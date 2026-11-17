import { norm } from "./text";
import type { Classification } from "./types";

// Camada 1: respostas aprovadas para perguntas de resposta fixa (somente português).
export type Rule = {
  id: string;
  re: RegExp;
  kb: string;
  human?: boolean;
  reason?: string;
  text?: string;
};

export const RULES: Rule[] = [
  {
    id: "reembolso",
    re: /(reembols|estorn|devolu\w* (do|de|o) (meu )?dinheiro|dinheiro de volta|refund)/,
    kb: "kb-reembolso",
    human: true,
    reason: "Reembolso sempre vai para humano: a política publicada fala em assinatura e não deixa claro se vale para pacotes de créditos.",
  },
  {
    id: "regenerar",
    re: /(regener|gasta\w* (um |outro )?credito|consom\w* (um |outro )?credito|cobra\w* (um |outro )?credito)/,
    kb: "kb-creditos-consumo",
    text: "1 crédito = 1 matéria gerada. Regenerar uma matéria consome um novo crédito. Editar, salvar e reenviar para o WordPress é gratuito. Se a IA devolver um resultado inválido, o crédito não é cobrado.",
  },
  {
    id: "validade",
    re: /(creditos?|pacotes?)\b.*\b(expir|venc|validade|valem|prazo)|(expir|venc|validade|prazo)\w*.*\bcreditos?/,
    kb: "kb-creditos-validade",
    text: "Cada pacote de créditos do RLPRESS vale por 45 dias a partir da ativação. Créditos não usados nesse prazo expiram. Você continua com acesso ao arquivo das matérias já geradas, mas precisa de um novo pacote para gerar outras.",
  },
  {
    id: "precos",
    re: /(quanto custa|\bprecos?\b|\bpacotes?\b|tabela de valores)/,
    kb: "kb-precos",
    text: "Pacotes do RLPRESS:\n• 100 matérias: R$ 490,00 (R$ 4,90 cada)\n• 250 matérias: R$ 1.078,00 (R$ 4,31 cada)\n• 500 matérias: R$ 1.960,00 (R$ 3,92 cada)\n• Quantidade personalizada: R$ 4,90 por matéria\nPagamento com cartão; os créditos são liberados após a confirmação e valem 45 dias.",
  },
  {
    id: "cancelar",
    re: /\bcancel/,
    kb: "kb-cancelamento",
    text: "Você pode cancelar a assinatura quando quiser, sem multa, em Minha conta → Minhas assinaturas → Gerenciar assinatura. O acesso continua até o fim do período já pago, e não há reembolso proporcional do período em curso.",
  },
  {
    id: "contato",
    re: /(horario de atendimento|atendimento humano|falar com (alguem|um atendente|uma pessoa|humano)|\bcontato\b)/,
    kb: "kb-atendimento",
    text: "O atendimento humano funciona de segunda a sexta, das 9h às 18h (horário de Brasília), pelo formulário de contato do site, com resposta em até 1 dia útil.",
  },
  {
    id: "login",
    re: /(mesmo login|outro login|login separado|outra conta|nova conta|cadastro separado)/,
    kb: "kb-login",
    text: "Não precisa de outro cadastro: RLPRESS, RLTV e Análise Premium usam o mesmo login da sua conta RealLeader.",
  },
];

export function matchRule(message: string): Rule | null {
  const n = norm(message);
  return RULES.find((r) => r.re.test(n)) ?? null;
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
  else if (/(contratar|orcamento|proposta)/.test(n)) tipo = "comercial";
  else if (/(conexao|conectar|erro|falha|configur|obs|wordpress)/.test(n)) tipo = "tecnico";

  return { produto, tipo, idioma, resumo: message.slice(0, 90), confianca: 0.5, origem: "heurística (sem LLM)" };
}
