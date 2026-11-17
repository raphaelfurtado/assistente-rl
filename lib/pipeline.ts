import { KB_BY_ID } from "./kb";
import { getClient, llmAnswer, llmClassify } from "./llm";
import { heuristicClassify, matchRule } from "./rules";
import { detectLang, retrieve } from "./text";
import type { ChatResult, Classification, Lang, Step, Turn } from "./types";

const HUMAN_TYPES = new Set(["reembolso", "bug", "parceria", "comercial"]);

const HANDOFF: Record<Lang, string> = {
  pt: "Esse caso precisa de uma pessoa da equipe. Registrei o resumo abaixo para o atendimento humano, que funciona de segunda a sexta, das 9h às 18h (Brasília), com resposta em até 1 dia útil.",
  en: "This case needs a person from our team. I've logged the summary below for human support, available Monday to Friday, 9am–6pm Brasília time, with a reply within 1 business day.",
  es: "Este caso necesita una persona del equipo. Registré el resumen abajo para la atención humana, de lunes a viernes, de 9h a 18h (hora de Brasilia), con respuesta en hasta 1 día hábil.",
};

const QUALIFY: Record<Lang, string> = {
  pt: "\n\nPara o time comercial já chegar preparado, me conte: 1) nome da empresa, 2) como pretende usar os dados (portal, TV, app), 3) volume esperado, 4) produto de interesse (RLPRESS, RLTV ou API).",
  en: "\n\nSo our sales team comes prepared, please tell me: 1) company name, 2) how you plan to use the data (website, TV, app), 3) expected volume, 4) product of interest (RLPRESS, RLTV or API).",
  es: "\n\nPara que el equipo comercial llegue preparado, cuéntame: 1) nombre de la empresa, 2) cómo planeas usar los datos (portal, TV, app), 3) volumen esperado, 4) producto de interés (RLPRESS, RLTV o API).",
};

const threshold = () => {
  const t = Number(process.env.CONFIDENCE_THRESHOLD);
  return Number.isFinite(t) && t > 0 && t <= 1 ? t : 0.6;
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
  const lang = detectLang(message);
  const llmOn = getClient() !== null;
  const done = (r: Omit<ChatResult, "steps" | "llm" | "ms">): ChatResult => ({ ...r, steps, llm: llmOn, ms: Date.now() - t0 });

  // ---------- Camada 1: regras ----------
  const rule = lang === "pt" ? matchRule(message) : null;
  if (rule) {
    steps.push({ layer: 1, result: rule.human ? "regra de encaminhamento" : "resposta aprovada", kv: [["regra", rule.id], ["fonte", rule.kb], ["idioma", lang]] });
    steps.push({ layer: 2, skip: true, result: "pulada", kv: [] });
    steps.push({ layer: 3, skip: true, result: "pulada", kv: [] });
    if (rule.human) {
      steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", "política ambígua para créditos"]] });
      return done({ reply: HANDOFF[lang], layer: 4, lang, meta: rule.reason, handoff: handoffSummary(message, lang, { tipo: "reembolso", produto: "rlpress/premium" }) });
    }
    steps.push({ layer: 4, skip: true, result: "não precisou", kv: [] });
    return done({ reply: rule.text ?? "", layer: 1, lang, meta: `fonte: ${rule.kb}` });
  }
  steps.push({
    layer: 1,
    result: "nenhuma regra casou",
    kv: [["idioma", lang], ["observação", lang === "pt" ? "frase fora dos padrões fixos" : "regras só cobrem português"]],
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

  if (HUMAN_TYPES.has(info.tipo)) {
    steps.push({ layer: 3, skip: true, result: "pulada", kv: [] });
    steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", info.tipo]] });
    const reason =
      info.tipo === "parceria" ? "Parceria: o assistente qualifica e o comercial negocia." :
      info.tipo === "bug" ? "Possível erro em dado ou matéria: precisa de verificação humana." :
      info.tipo === "comercial" ? "Pedido comercial: tratado pelo time RealLeader." :
      "Tema sensível: tratado por humano.";
    return done({
      reply: HANDOFF[replyLang] + (info.tipo === "parceria" ? QUALIFY[replyLang] : ""),
      layer: 4,
      lang: replyLang,
      meta: reason,
      handoff: handoffSummary(message, replyLang, info),
    });
  }

  // ---------- Camada 3: LLM com fontes ----------
  const docs = retrieve(`${message} ${info.resumo}`, info.produto);
  const buscadas = docs.map((d) => d.id).join(", ") || "nenhuma";
  if (!llmOn) {
    steps.push({ layer: 3, skip: true, result: "LLM indisponível", kv: [["fontes achadas", buscadas]] });
    steps.push({ layer: 4, result: "encaminhado", kv: [["motivo", "sem chave da OpenAI configurada"]] });
    return done({ reply: HANDOFF[replyLang], layer: 4, lang: replyLang, meta: "Sem LLM configurado: dúvida aberta vai para humano.", handoff: handoffSummary(message, replyLang, info) });
  }

  try {
    const a = await llmAnswer(message, docs, replyLang, history.slice(-4));
    const cited = a.fontes.filter((id) => KB_BY_ID[id]);
    const min = threshold();
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
