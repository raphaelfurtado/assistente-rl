import type { AdminRule } from "./config";
import { norm } from "./text";
import type { Classification } from "./types";

// Camada 1: respostas prontas, editáveis no /admin (somente português).
// Um gatilho casa quando TODAS as suas palavras aparecem na mensagem, em qualquer ordem.
// Cada palavra do gatilho casa com o começo de uma palavra da mensagem ("credit" → "créditos").

const words = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

export function triggerMatches(trigger: string, messageWords: string[]): boolean {
  const parts = words(trigger);
  return parts.length > 0 && parts.every((p) => messageWords.some((w) => w.startsWith(p)));
}

export function matchRule(message: string, rules: AdminRule[]): { rule: AdminRule; gatilho: string } | null {
  const mw = words(message);
  for (const rule of rules) {
    if (!rule.ativo) continue;
    const g = rule.gatilhos.find((t) => triggerMatches(t, mw));
    if (g) return { rule, gatilho: g };
  }
  return null;
}

// Classificação de reserva quando o LLM não está disponível.
export function heuristicClassify(message: string, idioma: string): Classification {
  const n = norm(message);
  let produto = "geral";
  if (/(rltv|obs|vmix|ndi|grafico|arte|template)/.test(n)) produto = "rltv";
  else if (/(rlpress|materia|wordpress|credito|nota|noticia)/.test(n)) produto = "rlpress";
  else if (/(assinatura|premium)/.test(n)) produto = "premium";
  else if (/(classificacao|tabela|campeonato|probabilidade|metodo)/.test(n)) produto = "portal";

  let tipo = "duvida";
  if (/(reembols|estorn|refund)/.test(n)) tipo = "reembolso";
  else if (/(parceri|\bapi\b|usar os dados|integrar|revender)/.test(n)) tipo = "parceria";
  else if (/(errad|equivocad|wrong|bug|travou|nao carrega|quebrou)/.test(n)) tipo = "bug";
  else if (/(contratar|orcamento|proposta|sob encomenda)/.test(n) && produto !== "rlpress") tipo = "comercial";
  else if (/(contratar|comprar|assinar)/.test(n)) tipo = "produto";
  else if (/(conexao|conectar|erro|falha|configur|obs|wordpress)/.test(n)) tipo = "tecnico";

  return { produto, tipo, idioma, resumo: message.slice(0, 90), confianca: 0.5, origem: "heurística (sem LLM)" };
}
