// Benchmark M1D3 — seleção de modelo para o assistente do RealLeader.
// Uso:
//   node run.mjs                         gera, avalia e escreve os resultados de todos os modelos (retoma de onde parou)
//   node run.mjs --modelos=gpt-4o-mini   só esses modelos (ids separados por vírgula)
//   node run.mjs --so-relatorio          só recalcula tabelas e gráficos a partir de results/raw.json

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { barrasHorizontais, mapaDeCalor } from "../m1d2-analise-prompts/charts.mjs";
import { carregarKB, PERGUNTAS } from "./dataset.mjs";
import { CONDICOES, FLUXO, MODELOS, PROVEDORES, VOLUMES } from "./modelos.mjs";
import { RUBRICA, SISTEMA_CLASSIFICACAO, sistemaResposta, usuarioClassificacao, usuarioResposta } from "./prompts.mjs";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, "results");
const RAW = path.join(OUT, "raw.json");
mkdirSync(path.join(OUT, "graficos"), { recursive: true });

const args = process.argv.slice(2);
const SO_RELATORIO = args.includes("--so-relatorio");
const FILTRO = args.find((a) => a.startsWith("--modelos="))?.split("=")[1]?.split(",");

// ---------- Ambiente ----------
function env(nome) {
  if (process.env[nome]) return process.env[nome];
  const arq = path.join(DIR, "..", "..", ".env.local");
  if (!existsSync(arq)) return undefined;
  const l = readFileSync(arq, "utf8").split(/\r?\n/).map((x) => x.replace(/^﻿/, "")).find((x) => x.startsWith(`${nome}=`));
  return l ? l.slice(nome.length + 1).trim() : undefined;
}

const JUIZ = "gpt-4o"; // fora da lista comparada, temperatura 0
const EMBEDDING = "text-embedding-3-small";
const KB = carregarKB();
const raw = existsSync(RAW) ? JSON.parse(readFileSync(RAW, "utf8")) : { gen: {}, judge: {}, emb: {}, ret: {}, meta: {} };
const salvar = () => writeFileSync(RAW, JSON.stringify(raw));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// ---------- Chamada a qualquer modelo (API compatível com a da OpenAI) ----------
async function chamar(modelo, system, user, { json = true, temperatura = CONDICOES.temperatura, maxTokens = CONDICOES.maxTokens } = {}) {
  const p = PROVEDORES[modelo.provedor];
  const chave = p.chave ? env(p.chave) : "ollama";
  const body = {
    model: modelo.id,
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
    temperature: temperatura,
    ...(json ? { response_format: { type: "json_object" } } : {}),
    ...(modelo.provedor === "ollama" ? { max_tokens: maxTokens } : { max_completion_tokens: maxTokens }),
  };
  const limite = modelo.provedor === "ollama" ? 600_000 : 120_000;
  for (let tentativa = 0; ; tentativa++) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), limite);
    const t0 = performance.now();
    try {
      const r = await fetch(`${p.base}/chat/completions`, { method: "POST", signal: ctl.signal, headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const ms = Math.round(performance.now() - t0);
      const j = await r.json().catch(() => ({}));
      if (r.status === 429 || r.status >= 500) {
        // Limite de uso: espera o tempo que o provedor pede (retry-after), com mais tentativas.
        const espera = Number(r.headers.get("retry-after")) || 0;
        throw Object.assign(new Error(`HTTP ${r.status}`), { retry: true, espera: espera * 1000 });
      }
      if (j.error) return { erro: String(j.error.message || JSON.stringify(j.error)).slice(0, 200), ms };
      const u = j.usage ?? {};
      return {
        texto: j.choices?.[0]?.message?.content ?? "",
        fim: j.choices?.[0]?.finish_reason,
        entrada: u.prompt_tokens ?? 0,
        saida: u.completion_tokens ?? 0,
        raciocinio: u.completion_tokens_details?.reasoning_tokens ?? 0,
        ms,
      };
    } catch (e) {
      if (tentativa < 7 && (e.retry || e.name === "AbortError" || e.cause)) { await sleep(Math.max(e.espera || 0, 2000 * 2 ** Math.min(tentativa, 4))); continue; }
      return { erro: e.name === "AbortError" ? `tempo esgotado (${limite / 1000}s)` : String(e.message).slice(0, 200), ms: Math.round(performance.now() - t0) };
    } finally {
      clearTimeout(timer);
    }
  }
}

async function pool(itens, n, fn) {
  let i = 0, feitos = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < itens.length) {
      const x = itens[i++];
      await fn(x);
      if (++feitos % 10 === 0 || feitos === itens.length) { console.log(`   ${feitos}/${itens.length}`); salvar(); }
    }
  }));
  salvar();
}

const openai = MODELOS.find((m) => m.provedor === "openai");
async function embed(textos) {
  const r = await fetch(`${PROVEDORES.openai.base}/embeddings`, { method: "POST", headers: { Authorization: `Bearer ${env("OPENAI_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: EMBEDDING, input: textos }) });
  const j = await r.json();
  if (!j.data) throw new Error(JSON.stringify(j).slice(0, 200));
  return j.data.map((d) => d.embedding);
}
const cos = (a, b) => { let d = 0, x = 0, y = 0; for (let k = 0; k < a.length; k++) { d += a[k] * b[k]; x += a[k] ** 2; y += b[k] ** 2; } return d / Math.sqrt(x * y); };

// ---------- 1. Trechos fixos por pergunta (iguais para todos os modelos) ----------
async function recuperar() {
  if (PERGUNTAS.every((q) => raw.ret[q.id])) return;
  console.log("1) Busca semântica dos trechos (a mesma para todos os modelos)");
  const vk = await embed(KB.map((d) => d.text));
  const vq = await embed(PERGUNTAS.map((q) => q.texto));
  PERGUNTAS.forEach((q, i) => {
    raw.ret[q.id] = KB.map((d, k) => ({ id: d.id, s: cos(vq[i], vk[k]) })).sort((a, b) => b.s - a.s).slice(0, 4).map((x) => ({ id: x.id, s: Number(x.s.toFixed(3)) }));
  });
  salvar();
}

const chave = (m, tarefa, q, r) => `${m.id}|${tarefa}|${q.id}|${r}`;

// ---------- 2. Geração ----------
async function gerar(modelos) {
  const kbPorId = Object.fromEntries(KB.map((d) => [d.id, d]));
  for (const m of modelos) {
    const plano = [];
    for (const q of PERGUNTAS) for (let r = 1; r <= CONDICOES.execucoes; r++) for (const t of ["cls", "resp"]) {
      const g = raw.gen[chave(m, t, q, r)];
      // Refaz o que não existe ou falhou por limite de uso/tempo (infraestrutura, não qualidade do modelo).
      const refazer = !g || (g.erro && /HTTP 429|HTTP 5\d\d|tempo esgotado/.test(g.erro));
      if (refazer) {
        if (g) { delete raw.judge[chave(m, t, q, r)]; delete raw.emb[`${m.id}|${q.id}`]; raw.meta.refeitas = (raw.meta.refeitas || 0) + 1; }
        plano.push({ q, r, t });
      }
    }
    if (!plano.length) continue;
    console.log(`2) ${m.nome}: ${plano.length} chamadas`);
    await pool(plano, PROVEDORES[m.provedor].paralelo, async ({ q, r, t }) => {
      const idioma = q.rotulos.idioma[0];
      const res = t === "cls"
        ? await chamar(m, SISTEMA_CLASSIFICACAO, usuarioClassificacao(q.texto))
        : await chamar(m, sistemaResposta(raw.ret[q.id].map((x) => kbPorId[x.id]), idioma), usuarioResposta(q.texto));
      raw.gen[chave(m, t, q, r)] = { ...res, final: true };
    });
  }
}

// ---------- 3. Avaliação das respostas pelo juiz ----------
async function avaliar(modelos) {
  const KB_TEXTO = KB.map((d) => `[${d.id}] ${d.text}`).join("\n");
  const plano = [];
  for (const m of modelos) for (const q of PERGUNTAS) for (let r = 1; r <= CONDICOES.execucoes; r++) {
    const k = chave(m, "resp", q, r);
    if (raw.gen[k] && !raw.judge[k]) plano.push({ m, q, r, k });
  }
  if (!plano.length) return;
  console.log(`3) Juiz (${JUIZ}): ${plano.length} respostas`);
  const juiz = { id: JUIZ, provedor: "openai" };
  await pool(plano, 4, async ({ q, k }) => {
    const g = raw.gen[k];
    const saida = g.erro ? `(o modelo não respondeu: ${g.erro})` : g.texto;
    const user = `PERGUNTA DO CLIENTE:\n${q.texto}\n\nCOMPORTAMENTO ESPERADO:\n${q.comportamento}${q.escalar ? "\n(Escalar para a equipe é o comportamento correto aqui.)" : ""}\n\nGABARITO (base de conhecimento oficial):\n${KB_TEXTO}\n\nSAÍDA DO ASSISTENTE (JSON):\n"""${saida}"""`;
    const r = await chamar(juiz, RUBRICA, user, { temperatura: 0, maxTokens: 400 });
    let j = {};
    try { j = JSON.parse(r.texto || "{}"); } catch { /* juiz falhou */ }
    const n = (v) => Math.max(1, Math.min(5, Math.round(Number(v) || 1)));
    raw.judge[k] = {
      clareza: n(j.clareza), completude: n(j.completude), tom: n(j.tom), seguranca: n(j.seguranca),
      alucinacao: ["nenhuma", "leve", "grave"].includes(j.alucinacao) ? j.alucinacao : "leve",
      correto: Boolean(j.comportamento_correto),
      justificativa: String(j.justificativa || r.erro || "").slice(0, 300),
    };
  });
}

// ---------- 4. Consistência: cosseno entre as 3 respostas ----------
const parse = (t) => { try { const o = JSON.parse(t); return o && typeof o === "object" ? o : null; } catch { return null; } };
const textoResposta = (g) => { const o = parse(g?.texto); return o ? (o.escalar ? "[escalar]" : String(o.resposta ?? "")) : String(g?.texto ?? ""); };

async function consistencia(modelos) {
  const grupos = [];
  for (const m of modelos) for (const q of PERGUNTAS) {
    const k = `${m.id}|${q.id}`;
    if (raw.emb[k] === undefined && [1, 2, 3].every((r) => raw.gen[chave(m, "resp", q, r)])) grupos.push({ m, q, k });
  }
  if (!grupos.length) return;
  console.log(`4) Embeddings de consistência: ${grupos.length} grupos`);
  await pool(grupos, 4, async ({ m, q, k }) => {
    const t = [1, 2, 3].map((r) => textoResposta(raw.gen[chave(m, "resp", q, r)]) || " ");
    const v = await embed(t);
    raw.emb[k] = (cos(v[0], v[1]) + cos(v[0], v[2]) + cos(v[1], v[2])) / 3;
  });
}

// ---------- 5. Métricas e relatório ----------
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const p95 = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.ceil(0.95 * s.length) - 1)]; };
const pct = (x) => `${Math.round(x * 100)}%`;
const f1 = (x) => x.toFixed(1).replace(".", ",");
const f3 = (x) => x.toFixed(3).replace(".", ",");
const usd = (x) => (x === 0 ? "US$ 0" : x < 0.01 ? `US$ ${x.toFixed(5).replace(".", ",")}` : `US$ ${x.toFixed(2).replace(".", ",")}`);
const custo = (m, g) => ((g.entrada || 0) * m.entrada + (g.saida || 0) * m.saida) / 1e6;
const palavras = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function metricas(m) {
  const cls = [], resp = [];
  for (const q of PERGUNTAS) for (let r = 1; r <= CONDICOES.execucoes; r++) {
    const c = raw.gen[chave(m, "cls", q, r)], s = raw.gen[chave(m, "resp", q, r)];
    if (c) cls.push({ q, r, g: c, o: parse(c.texto) });
    if (s) resp.push({ q, r, g: s, o: parse(s.texto), j: raw.judge[chave(m, "resp", q, r)] });
  }
  if (!cls.length && !resp.length) return null;
  const ok = (x) => !x.g.erro;
  // Classificação
  const acerto = (x, campo) => Boolean(x.o && x.q.rotulos[campo].includes(norm(x.o[campo])));
  const clsOk = cls.filter(ok);
  const clsTodos = cls.map((x) => x.o && ["produto", "tipo", "idioma"].every((c) => acerto(x, c)));
  const estavelCls = PERGUNTAS.filter((q) => { const xs = cls.filter((x) => x.q.id === q.id); const sig = xs.map((x) => x.o ? `${norm(x.o.produto)}|${norm(x.o.tipo)}|${norm(x.o.idioma)}` : "x"); return xs.length && sig.every((s) => s === sig[0]); }).length / PERGUNTAS.length;
  // Resposta
  const respOk = resp.filter(ok);
  const formatoOk = resp.filter((x) => x.o && typeof x.o.resposta === "string" && typeof x.o.escalar === "boolean" && (x.o.escalar || (x.o.resposta.trim() && palavras(x.o.resposta) <= 130)));
  const julgadas = resp.filter((x) => x.j);
  const comFatos = resp.filter((x) => x.q.fatos.length && !x.q.escalar);
  const fatos = media(comFatos.map((x) => { const t = norm(textoResposta(x.g)); return x.q.fatos.filter((gr) => gr.some((f) => t.includes(norm(f)))).length / x.q.fatos.length; }));
  const porPergunta = PERGUNTAS.map((q) => {
    const xs = julgadas.filter((x) => x.q.id === q.id);
    return { q, corretos: xs.filter((x) => x.j.correto).length, n: xs.length, graves: xs.filter((x) => x.j.alucinacao === "grave").length, estavel: xs.length > 0 && xs.every((x) => x.j.correto === xs[0].j.correto), cos: raw.emb[`${m.id}|${q.id}`] };
  });
  const custoCls = media(clsOk.map((x) => custo(m, x.g)));
  const custoResp = media(respOk.map((x) => custo(m, x.g)));
  const custoMsg = FLUXO.classificacao * custoCls + FLUXO.resposta * custoResp;
  const todos = [...clsOk, ...respOk];
  return {
    m, n: { cls: cls.length, resp: resp.length },
    erros: cls.length + resp.length - todos.length,
    cls: {
      jsonValido: cls.filter((x) => x.o).length / (cls.length || 1),
      acertoProduto: cls.filter((x) => acerto(x, "produto")).length / (cls.length || 1),
      acertoTipo: cls.filter((x) => acerto(x, "tipo")).length / (cls.length || 1),
      acertoIdioma: cls.filter((x) => acerto(x, "idioma")).length / (cls.length || 1),
      acertoTotal: clsTodos.filter(Boolean).length / (cls.length || 1),
      estavel: estavelCls,
      latMedia: media(clsOk.map((x) => x.g.ms)), latP95: p95(clsOk.map((x) => x.g.ms)),
      custo: custoCls,
    },
    resp: {
      jsonValido: resp.filter((x) => x.o).length / (resp.length || 1),
      formato: formatoOk.length / (resp.length || 1),
      correto: julgadas.filter((x) => x.j.correto).length / (julgadas.length || 1),
      alucinacao: julgadas.filter((x) => x.j.alucinacao !== "nenhuma").length / (julgadas.length || 1),
      grave: julgadas.filter((x) => x.j.alucinacao === "grave").length / (julgadas.length || 1),
      clareza: media(julgadas.map((x) => x.j.clareza)), completude: media(julgadas.map((x) => x.j.completude)),
      tom: media(julgadas.map((x) => x.j.tom)), seguranca: media(julgadas.map((x) => x.j.seguranca)),
      fatos,
      cosseno: media(porPergunta.map((p) => p.cos).filter((c) => typeof c === "number")),
      estavel: porPergunta.filter((p) => p.estavel).length / PERGUNTAS.length,
      latMedia: media(respOk.map((x) => x.g.ms)), latP95: p95(respOk.map((x) => x.g.ms)),
      custo: custoResp,
      entrada: media(respOk.map((x) => x.g.entrada || 0)), saida: media(respOk.map((x) => x.g.saida || 0)), raciocinio: media(respOk.map((x) => x.g.raciocinio || 0)),
    },
    custoMsg,
    latMsg: media(todos.map((x) => x.g.ms)),
    porPergunta,
  };
}

// Critérios da decisão (pesos pensados para o atendimento de um SaaS: acerto e risco primeiro, custo e velocidade em seguida).
const CRITERIOS = [
  { id: "qualidade", nome: "Qualidade da resposta", curto: "Qualidade", peso: 25, porque: "Resolver o caso do cliente é o objetivo do produto." },
  { id: "risco", nome: "Risco de erro (sem alucinação grave)", curto: "Risco", peso: 20, porque: "Um preço ou política inventada gera prejuízo e perda de confiança." },
  { id: "classificacao", nome: "Acerto da classificação", curto: "Classificação", peso: 10, porque: "Define o roteamento: erro aqui manda o caso para o lugar errado." },
  { id: "formato", nome: "Formato (JSON válido, tamanho)", curto: "Formato", peso: 10, porque: "O sistema depende de JSON válido; formato errado vira encaminhamento desnecessário." },
  { id: "consistencia", nome: "Consistência", curto: "Consistência", peso: 10, porque: "O mesmo cliente não pode receber comportamentos diferentes." },
  { id: "latencia", nome: "Latência (p95)", curto: "Latência", peso: 10, porque: "Chat exige resposta em poucos segundos." },
  { id: "custo", nome: "Custo por mensagem", curto: "Custo", peso: 15, porque: "Afeta a margem do SaaS conforme o volume cresce." },
];

// Escala log para custo e latência: a diferença entre US$ 0,0001 e US$ 0,01 importa tanto quanto entre 0,01 e 1.
const escalaLog = (v, vals) => {
  const xs = vals.filter((x) => x > 0);
  if (v <= 0) return 100;
  const lo = Math.log10(Math.min(...xs)), hi = Math.log10(Math.max(...xs));
  return hi === lo ? 100 : 100 * (1 - (Math.log10(v) - lo) / (hi - lo));
};

function notas(lista) {
  const custos = lista.map((x) => x.custoMsg), lats = lista.map((x) => x.resp.latP95);
  return lista.map((x) => {
    const v = {
      qualidade: x.resp.correto * 100,
      risco: (1 - x.resp.grave) * 100,
      classificacao: x.cls.acertoTotal * 100,
      formato: ((x.cls.jsonValido + x.resp.formato) / 2) * 100,
      consistencia: ((x.resp.estavel + x.cls.estavel) / 2) * 100,
      latencia: escalaLog(x.resp.latP95, lats),
      custo: escalaLog(x.custoMsg, custos),
    };
    const total = (pesos) => CRITERIOS.reduce((a, c) => a + (pesos[c.id] / 100) * v[c.id], 0);
    const base = Object.fromEntries(CRITERIOS.map((c) => [c.id, c.peso]));
    const custoAlto = Object.fromEntries(CRITERIOS.map((c) => [c.id, c.id === "custo" ? 35 : (c.peso * 65) / 85]));
    const qualidadeAlta = Object.fromEntries(CRITERIOS.map((c) => [c.id, c.id === "qualidade" || c.id === "risco" ? c.peso * 1.6 : c.peso * (100 - 45 * 1.6) / 55]));
    return { x, v, base: total(base), custoAlto: total(custoAlto), qualidadeAlta: total(qualidadeAlta) };
  });
}

function relatorio() {
  const lista = MODELOS.map(metricas).filter(Boolean);
  if (!lista.length) { console.log("Sem resultados ainda."); return; }
  const head = (cols) => `| ${cols.join(" | ")} |\n| ${cols.map(() => "---").join(" | ")} |\n`;
  const nome = (x) => x.m.nome;
  const ns = notas(lista);
  const barra = (frac, n = 10) => "█".repeat(Math.max(0, Math.min(n, Math.round(frac * n)))) + "░".repeat(n - Math.max(0, Math.min(n, Math.round(frac * n))));
  let md = `## Condições\n\nMesmos prompts de produção, mesmos 4 trechos da base por pergunta (busca semântica feita uma vez), temperatura ${CONDICOES.temperatura} para todos, limite de ${CONDICOES.maxTokens} tokens de saída, ${CONDICOES.execucoes} execuções por pergunta e tarefa, ${PERGUNTAS.length} perguntas. Juiz: \`${JUIZ}\` (temperatura 0, fora da comparação).\n\n`;

  md += `## Tabela comparativa\n\n`;
  md += head(["Métrica", ...lista.map(nome)]);
  const L = (rot, f) => { md += `| ${rot} | ${lista.map(f).join(" | ")} |\n`; };
  L("Papel", (x) => x.m.papel);
  L("Preço (entrada / saída por 1M tokens)", (x) => x.m.entrada || x.m.saida ? `US$ ${x.m.entrada} / ${x.m.saida}` : "sem custo de API");
  L("**Resposta: comportamento correto**", (x) => `**${pct(x.resp.correto)}**`);
  L("Resposta: fatos do gabarito (sem LLM)", (x) => pct(x.resp.fatos));
  L("Resposta: alucinação grave", (x) => pct(x.resp.grave));
  L("Resposta: qualquer alucinação", (x) => pct(x.resp.alucinacao));
  L("Resposta: clareza / completude (1–5)", (x) => `${f1(x.resp.clareza)} / ${f1(x.resp.completude)}`);
  L("Resposta: tom / segurança (1–5)", (x) => `${f1(x.resp.tom)} / ${f1(x.resp.seguranca)}`);
  L("Resposta: formato correto (JSON + até 130 palavras)", (x) => pct(x.resp.formato));
  L("Classificação: acerto total (produto + tipo + idioma)", (x) => pct(x.cls.acertoTotal));
  L("Classificação: produto / tipo / idioma", (x) => `${pct(x.cls.acertoProduto)} / ${pct(x.cls.acertoTipo)} / ${pct(x.cls.acertoIdioma)}`);
  L("Classificação: JSON válido", (x) => pct(x.cls.jsonValido));
  L("Consistência: cosseno entre execuções", (x) => f3(x.resp.cosseno));
  L("Consistência: comportamento estável (resposta / classificação)", (x) => `${pct(x.resp.estavel)} / ${pct(x.cls.estavel)}`);
  L("Latência média (resposta)", (x) => `${f1(x.resp.latMedia / 1000)} s`);
  L("Latência p95 (resposta)", (x) => `${f1(x.resp.latP95 / 1000)} s`);
  L("Latência média (classificação)", (x) => `${f1(x.cls.latMedia / 1000)} s`);
  L("Tokens por resposta (entrada / saída / raciocínio)", (x) => `${Math.round(x.resp.entrada)} / ${Math.round(x.resp.saida)} / ${Math.round(x.resp.raciocinio)}`);
  L("Custo por requisição (classificação)", (x) => usd(x.cls.custo));
  L("Custo por requisição (resposta)", (x) => usd(x.resp.custo));
  L("**Custo por mensagem do assistente**", (x) => `**${usd(x.custoMsg)}**`);
  for (const v of VOLUMES) L(`Custo mensal com ${v.toLocaleString("pt-BR")} mensagens`, (x) => usd(x.custoMsg * v));
  L("Falhas de chamada (erro ou tempo esgotado)", (x) => String(x.erros));
  md += `\nCusto por mensagem = ${FLUXO.classificacao} × classificação + ${FLUXO.resposta} × resposta (35% das mensagens são resolvidas por regras, sem LLM).\n\n`;

  md += `## Placar visual\n\n`;
  md += head(["Critério", ...lista.map(nome)]);
  for (const c of CRITERIOS) md += `| ${c.nome} | ${ns.map((n) => `${barra(n.v[c.id] / 100)} ${Math.round(n.v[c.id])}`).join(" | ")} |\n`;
  md += `\nTodas as barras em 0–100 (maior = melhor). Custo e latência em escala logarítmica.\n\n`;

  md += `## Matriz de decisão ponderada\n\n`;
  md += head(["Critério", "Peso", ...lista.map(nome), "Por que o peso"]);
  for (const c of CRITERIOS) md += `| ${c.nome} | ${c.peso}% | ${ns.map((n) => Math.round(n.v[c.id])).join(" | ")} | ${c.porque} |\n`;
  md += `| **Nota ponderada** | **100%** | ${ns.map((n) => `**${f1(n.base)}**`).join(" | ")} | |\n\n`;
  const rank = (campo) => [...ns].sort((a, b) => b[campo] - a[campo]).map((n) => `${nome(n.x)} (${f1(n[campo])})`).join(" > ");
  md += head(["Cenário de pesos", "Ranking"]);
  md += `| Pesos do projeto | ${rank("base")} |\n| Custo pesando 35% | ${rank("custoAlto")} |\n| Qualidade e risco pesando 72% | ${rank("qualidadeAlta")} |\n\n`;

  md += `## Resultado de cada teste (resposta)\n\n✅ correto nas ${CONDICOES.execucoes} · 🟨 em parte · ❌ errou nas ${CONDICOES.execucoes} · ⚠️ alucinação grave em pelo menos uma\n\n`;
  md += head(["Pergunta", ...lista.map(nome)]);
  for (const q of PERGUNTAS) {
    md += `| ${q.id} · ${q.texto} | ${lista.map((x) => { const p = x.porPergunta.find((y) => y.q.id === q.id); if (!p.n) return "—"; return `${p.corretos === p.n ? "✅" : p.corretos ? "🟨" : "❌"}${p.graves ? "⚠️" : ""}`; }).join(" | ")} |\n`;
  }
  md += `| **Total ✅ / 🟨 / ❌** | ${lista.map((x) => { const pp = x.porPergunta.filter((p) => p.n); return `**${pp.filter((p) => p.corretos === p.n).length} / ${pp.filter((p) => p.corretos && p.corretos < p.n).length} / ${pp.filter((p) => !p.corretos).length}**`; }).join(" | ")} |\n\n`;

  writeFileSync(path.join(OUT, "tabelas.md"), md);
  writeFileSync(path.join(OUT, "resumo.json"), JSON.stringify(lista.map((x) => ({ ...x, m: x.m.id, porPergunta: x.porPergunta.map((p) => ({ id: p.q.id, corretos: p.corretos, n: p.n, graves: p.graves, cosseno: p.cos })) })), null, 2));

  // CSV com todas as saídas para conferência humana
  const esc = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const linhas = [["modelo", "tarefa", "pergunta", "execucao", "ms", "entrada", "saida", "raciocinio", "custo_usd", "correto_juiz", "alucinacao", "justificativa", "saida_modelo"].join(",")];
  for (const x of lista) for (const q of PERGUNTAS) for (let r = 1; r <= CONDICOES.execucoes; r++) for (const t of ["cls", "resp"]) {
    const g = raw.gen[chave(x.m, t, q, r)]; if (!g) continue;
    const j = t === "resp" ? raw.judge[chave(x.m, t, q, r)] : null;
    linhas.push([x.m.id, t, q.id, r, g.ms, g.entrada ?? "", g.saida ?? "", g.raciocinio ?? "", custo(x.m, g).toFixed(6), j?.correto ?? "", j?.alucinacao ?? "", esc(j?.justificativa), esc(g.erro ? `ERRO: ${g.erro}` : g.texto)].join(","));
  }
  writeFileSync(path.join(OUT, "respostas.csv"), "﻿" + linhas.join("\n"));

  // Gráficos
  const G = path.join(OUT, "graficos");
  const melhor = [...ns].sort((a, b) => b.base - a.base)[0].x.m.id;
  writeFileSync(path.join(G, "1-nota-ponderada.svg"), barrasHorizontais({ titulo: "Nota ponderada por modelo", subtitulo: "0 a 100 · qualidade e risco pesam 45%, custo 15%, latência 10%", linhas: [...ns].sort((a, b) => b.base - a.base).map((n) => ({ rotulo: nome(n.x), valor: n.base, destaque: n.x.m.id === melhor })), formato: (v) => f1(v), rotuloEixo: "Nota ponderada (0–100)" }));
  const cmax = Math.max(...lista.map((x) => x.custoMsg * 1200));
  writeFileSync(path.join(G, "2-custo-mensal.svg"), barrasHorizontais({ titulo: "Custo mensal estimado com 1.200 mensagens", subtitulo: "Preços oficiais de 24/11/2026 · inclui tokens de raciocínio", linhas: [...lista].sort((a, b) => b.custoMsg - a.custoMsg).map((x) => ({ rotulo: nome(x), valor: (x.custoMsg * 1200 / cmax) * 100, destaque: x.m.id === melhor, real: x.custoMsg * 1200 })), formato: (v) => usd((v / 100) * cmax), rotuloEixo: "Percentual do mais caro" }));
  const lmax = Math.max(...lista.map((x) => x.resp.latP95));
  writeFileSync(path.join(G, "3-latencia.svg"), barrasHorizontais({ titulo: "Latência p95 da resposta", subtitulo: "95% das respostas chegaram em até este tempo", linhas: [...lista].sort((a, b) => b.resp.latP95 - a.resp.latP95).map((x) => ({ rotulo: nome(x), valor: (x.resp.latP95 / lmax) * 100, destaque: x.m.id === melhor })), formato: (v) => `${f1(((v / 100) * lmax) / 1000)} s`, rotuloEixo: "Percentual do mais lento" }));
  writeFileSync(path.join(G, "4-perfil.svg"), mapaDeCalor({ titulo: "Onde cada modelo se destaca e falha", subtitulo: "Cada critério em 0–100 · mais escuro = melhor", linhas: ns.map((n) => ({ rotulo: nome(n.x), n })), colunas: CRITERIOS.map((c) => ({ titulo: c.curto, sub: `peso ${c.peso}%`, c })), valor: (l, c) => l.n.v[c.c.id], texto: (l, c) => String(Math.round(l.n.v[c.c.id])), max: 100, legenda: { menor: "0 (pior)", maior: "100 (melhor)" }, larguraRotulo: 190, larguraCelula: 92 }));

  console.log("\n" + md);
}

// ---------- Execução ----------
if (!SO_RELATORIO) {
  const modelos = MODELOS.filter((m) => !FILTRO || FILTRO.includes(m.id));
  await recuperar();
  await gerar(modelos);
  await avaliar(modelos);
  await consistencia(modelos);
}
relatorio();
