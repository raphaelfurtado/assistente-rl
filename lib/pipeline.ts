import { getClient, llmAnswer, llmClassify } from "./llm";
import { heuristicClassify, matchRule } from "./rules";
import { getConfig } from "./store";
import { detectLang, retrieve } from "./text";
import type { ChatResult, Classification, Lang, Step, Turn } from "./types";

const HANDOFF: Record<Lang, string> = {
  pt: "Esse caso precisa de uma pessoa da equipe. Abra um chamado em rldocs.realleader.com/chamados (ou, no RLPRESS, Central de ajuda → Abrir chamado): a equipe responde em até 48 horas, inclusive fins de semana. Registrei o resumo abaixo para agilizar.",
  en: "This case needs a person from our team. Please open a ticket at rldocs.realleader.com/chamados (or, in RLPRESS, Help center → Open ticket): the team replies within 48 hours, weekends included. I've logged the summary below to speed things up.",
  es: "Este caso necesita una persona del equipo. Abre un ticket en rldocs.realleader.com/chamados (o, en RLPRESS, Central de ayuda → Abrir ticket): el equipo responde en hasta 48 horas, incluidos fines de semana. Registré el resumen abajo para agilizar.",
};

const QUALIFY: Record<Lang, string> = {
  pt: "\n\nPara o time comercial já chegar preparado, me conte: 1) nome da empresa, 2) como pretende usar os dados (portal, TV, app), 3) volume esperado, 4) produto de interesse (RLPRESS, RLTV ou API).",
  en: "\n\nSo our sales team comes prepared, please tell me: 1) company name, 2) how you plan to use the data (website, TV, app), 3) expected volume, 4) product of interest (RLPRESS, RLTV or API).",
  es: "\n\nPara que el equipo comercial llegue preparado, cuéntame: 1) nombre de la empresa, 2) cómo planeas usar los datos (portal, TV, app), 3) volumen esperado, 4) producto de interés (RLPRESS, RLTV o API).",
};

function handoffSummary(message: string, lang: Lang, info: Pick<Classification, "tipo" | "produto">) {
  return [
    "Resumo para a equipe",
    `categoria: ${info.tipo}`,
    `produto:   ${info.produto}`,
    `idioma:    ${lang}`,
    `mensagem:  ${message.slice(0, 160)}`,
  ].join("\n");
}

const asLang = (x: string, fallback: Lang): Lang => (x === "pt" || x === "en" || x === "es" ? x : fallback);

export async function runPipeline(message: string, history: Turn[]): Promise<ChatResult> {
  const t0 = Date.now();
  const steps: Step[] = [];
  const config = await getConfig();
  const kb = config.kb.filter((d) => d.ativo);
  const kbIds = new Set(kb.map((d) => d.id));
  const humanTypes = new Set(config.humanTypes);
  const lang = detectLang(message);
  const llmOn = getClient() !== null;
  const done = (r: Omit<ChatResult, "steps" | "llm" | "ms">): ChatResult => ({ ...r, steps, llm: llmOn, ms: Date.now() - t0 });

  // ---------- Camada 1: respostas prontas ----------
  const hit = lang === "pt" ? matchRule(message, config.rules) : null;
  if (hit) {
    const { rule, gatilho } = hit;
    const human = rule.acao === "humano";
    steps.push({ layer: 1, result: human ? "regra de encaminhamento" : "resposta aprovada", kv: [["regra", rule.id], ["gatilho", gatilho], ["fonte", rule.fonte || "—"], ["idioma", lang]] });
    steps.push({ layer: 2, skip: true, result: "pulada", kv: [] });
    steps.push({ layer: 3, skip: true, result: "pulada", kv: [] });
    if (human) {
      steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", rule.nome]] });
      return done({ reply: HANDOFF[lang], layer: 4, lang, meta: rule.motivo || rule.nome, handoff: handoffSummary(message, lang, { tipo: rule.id, produto: "—" }) });
    }
    steps.push({ layer: 4, skip: true, result: "não precisou", kv: [] });
    return done({ reply: rule.resposta, layer: 1, lang, meta: rule.fonte ? `fonte: ${rule.fonte}` : `regra: ${rule.id}` });
  }
  steps.push({
    layer: 1,
    result: "nenhuma regra casou",
    kv: [["idioma", lang], ["observação", lang === "pt" ? "frase fora dos gatilhos cadastrados" : "regras só cobrem português"]],
  });

  // ---------- Camada 2: classificação ----------
  let info: Classification;
  if (llmOn) {
    try {
      info = await llmClassify(message, lang);
    } catch (e) {
      info = heuristicClassify(message, lang);
      info.origem = `heurística (LLM falhou: ${e instanceof Error ? e.message.slice(0, 60) : "erro"})`;
    }
  } else {
    info = heuristicClassify(message, lang);
  }
  steps.push({
    layer: 2,
    result: info.tipo,
    kv: [["produto", info.produto], ["tipo", info.tipo], ["idioma", info.idioma], ["confiança", info.confianca.toFixed(2)], ["por", info.origem]],
  });
  const replyLang = asLang(info.idioma, lang);

  if (humanTypes.has(info.tipo)) {
    const reason =
      info.tipo === "parceria" ? "Parceria: o assistente qualifica e o comercial negocia." :
      info.tipo === "bug" ? "Possível erro em dado ou matéria: precisa de verificação humana." :
      info.tipo === "comercial" ? "Pedido comercial: tratado pelo time RealLeader." :
      `Tipo "${info.tipo}" é tratado por humano.`;

    // Erro nos dados e parcerias: antes de encaminhar, diz o que o cliente pode fazer agora (validado no
    // experimento M1D2: só o canal de atendimento foi considerado incompleto; para API, a RLAPI é self-service).
    let agora = "";
    if ((info.tipo === "bug" || info.tipo === "parceria") && llmOn) {
      try {
        const docsBug = retrieve(`${message} ${info.resumo}`, kb, info.produto);
        const a = await llmAnswer(message, docsBug, replyLang, history.slice(-4));
        const cited = a.fontes.filter((id) => kbIds.has(id));
        if (!a.escalar && a.resposta && cited.length && a.confianca >= config.threshold) {
          agora = a.resposta;
          steps.push({ layer: 3, result: "orientação imediata", kv: [["fontes citadas", cited.join(", ")], ["confiança", a.confianca.toFixed(2)]] });
        }
      } catch {
        /* sem orientação imediata: segue só o encaminhamento */
      }
    }
    if (!agora) steps.push({ layer: 3, skip: true, result: "pulada", kv: [] });
    steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", `tipo "${info.tipo}" configurado para humano`]] });
    return done({
      reply: (agora ? `${agora}\n\n` : "") + HANDOFF[replyLang] + (info.tipo === "parceria" ? QUALIFY[replyLang] : ""),
      layer: 4,
      lang: replyLang,
      meta: reason,
      handoff: handoffSummary(message, replyLang, info),
    });
  }

  // ---------- Camada 3: LLM com fontes ----------
  const docs = retrieve(`${message} ${info.resumo}`, kb, info.produto);
  const buscadas = docs.map((d) => d.id).join(", ") || "nenhuma";
  if (!llmOn) {
    steps.push({ layer: 3, skip: true, result: "LLM indisponível", kv: [["fontes achadas", buscadas]] });
    steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", "sem chave da OpenAI configurada"]] });
    return done({ reply: HANDOFF[replyLang], layer: 4, lang: replyLang, meta: "Sem LLM configurado: dúvida aberta vai para humano.", handoff: handoffSummary(message, replyLang, info) });
  }

  try {
    const a = await llmAnswer(message, docs, replyLang, history.slice(-4));
    const cited = a.fontes.filter((id) => kbIds.has(id));
    const min = config.threshold;
    const escalate = a.escalar || !a.resposta || a.confianca < min || cited.length === 0;
    steps.push({
      layer: 3,
      result: escalate ? "baixa confiança" : "respondeu",
      kv: [["fontes buscadas", buscadas], ["fontes citadas", cited.join(", ") || "nenhuma"], ["confiança", a.confianca.toFixed(2)], ["limite", min.toFixed(2)]],
    });
    if (escalate) {
      steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", `fontes não cobrem ou confiança < ${min.toFixed(2)}`]] });
      return done({ reply: HANDOFF[replyLang], layer: 4, lang: replyLang, meta: "As fontes oficiais não cobrem a pergunta com segurança.", handoff: handoffSummary(message, replyLang, info) });
    }
    steps.push({ layer: 4, skip: true, result: "não precisou", kv: [] });
    return done({ reply: a.resposta, layer: 3, lang: replyLang, meta: `fontes: ${cited.join(", ")} · confiança ${a.confianca.toFixed(2)}` });
  } catch (e) {
    steps.push({ layer: 3, result: "falhou", kv: [["erro", e instanceof Error ? e.message.slice(0, 80) : "desconhecido"]] });
    steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", "falha do LLM"]] });
    return done({ reply: HANDOFF[replyLang], layer: 4, lang: replyLang, meta: "O LLM não respondeu; o caso segue para humano.", handoff: handoffSummary(message, replyLang, info) });
  }
}
