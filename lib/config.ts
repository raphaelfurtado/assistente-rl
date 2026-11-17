import { KB, type KbDoc } from "./kb";

// Tudo o que a equipe pode editar pelo /admin, sem mexer em código.

export type KbEntry = KbDoc & { ativo: boolean };

export type AdminRule = {
  id: string;
  nome: string;
  // Cada linha é um gatilho. Todas as palavras de uma linha precisam aparecer na mensagem
  // (em qualquer ordem). Basta o começo da palavra: "credit" casa com "crédito" e "créditos".
  gatilhos: string[];
  acao: "responder" | "humano";
  resposta: string; // usado quando acao = "responder"
  motivo: string; // usado quando acao = "humano"
  fonte: string; // id do trecho da base que embasa a resposta
  ativo: boolean;
};

export type AdminConfig = {
  kb: KbEntry[];
  rules: AdminRule[];
  humanTypes: string[];
  threshold: number;
  updatedAt: string | null;
};

export const TIPOS: { id: string; label: string }[] = [
  { id: "reembolso", label: "Reembolso" },
  { id: "bug", label: "Erro em dado ou matéria (bug)" },
  { id: "parceria", label: "Parceria, API, revenda" },
  { id: "comercial", label: "Comercial (RLTV, plano personalizado, fonte sob encomenda)" },
  { id: "cobranca", label: "Cobrança" },
  { id: "tecnico", label: "Técnico (integração, configuração)" },
  { id: "metodo", label: "Método e dados" },
  { id: "produto", label: "Produto (como funciona, como contratar)" },
  { id: "duvida", label: "Dúvida geral" },
];

export const PRODUTOS = ["rlpress", "rltv", "premium", "portal", "geral"];

const DEFAULT_RULES: AdminRule[] = [
  {
    id: "reembolso", nome: "Reembolso vai para humano", acao: "humano", fonte: "kb-reembolso", ativo: true, resposta: "",
    gatilhos: ["reembols", "estorn", "dinheiro volta", "refund"],
    motivo: "Reembolso sempre vai para humano: a política publicada fala em assinatura e não deixa claro se vale para pacotes de créditos.",
  },
  {
    id: "regenerar", nome: "Regenerar gasta crédito", acao: "responder", fonte: "kb-creditos-consumo", ativo: true, motivo: "",
    gatilhos: ["regener", "gasta credit", "consom credit", "cobra credit"],
    resposta: "1 crédito = 1 matéria gerada. Regenerar uma matéria consome um novo crédito. Editar, salvar e reenviar para o WordPress é gratuito. Se a IA devolver um resultado inválido, o crédito não é cobrado.",
  },
  {
    id: "validade", nome: "Validade dos créditos", acao: "responder", fonte: "kb-creditos-validade", ativo: true, motivo: "",
    gatilhos: ["credit venc", "credit expir", "credit validade", "credit prazo", "pacote venc", "pacote expir", "pacote validade"],
    resposta: "Cada pacote de créditos do RLPRESS vale por 45 dias a partir da ativação. Créditos não usados nesse prazo expiram. Você continua com acesso ao arquivo das matérias já geradas, mas precisa de um novo pacote para gerar outras.",
  },
  {
    id: "contratar-rlpress", nome: "Como contratar o RLPRESS", acao: "responder", fonte: "kb-rlpress-contratar", ativo: true, motivo: "",
    gatilhos: ["contrat rlpress", "assinar rlpress", "comprar rlpress", "adquirir rlpress", "comprar credit", "adquirir credit", "comecar usar rlpress"],
    resposta: "Contratar o RLPRESS é rápido e não precisa falar com vendedor:\n1. Crie sua conta RealLeader em realleader.com/cadastrar (ou entre com a conta que já tem).\n2. Escolha um pacote de créditos: 100, 250 ou 500 matérias, ou uma quantidade personalizada.\n3. Pague com cartão. Os créditos são liberados assim que o pagamento é confirmado e valem 45 dias.\nNão há mensalidade. Para equipes, peça uma organização na sua conta, com um login por pessoa.",
  },
  {
    id: "precos", nome: "Preços dos pacotes", acao: "responder", fonte: "kb-precos", ativo: true, motivo: "",
    gatilhos: ["quanto custa", "preco", "pacote", "tabela valores"],
    resposta: "Pacotes do RLPRESS:\n• 100 matérias: R$ 490,00 (R$ 4,90 cada)\n• 250 matérias: R$ 1.078,00 (R$ 4,31 cada)\n• 500 matérias: R$ 1.960,00 (R$ 3,92 cada)\n• Quantidade personalizada: R$ 4,90 por matéria\nPagamento com cartão; os créditos são liberados após a confirmação e valem 45 dias.",
  },
  {
    id: "cancelar", nome: "Cancelar assinatura", acao: "responder", fonte: "kb-cancelamento", ativo: true, motivo: "",
    gatilhos: ["cancel"],
    resposta: "Você pode cancelar a assinatura quando quiser, sem multa, em Minha conta → Minhas assinaturas → Gerenciar assinatura. O acesso continua até o fim do período já pago, e não há reembolso proporcional do período em curso.",
  },
  {
    id: "contato", nome: "Horário e contato", acao: "responder", fonte: "kb-atendimento", ativo: true, motivo: "",
    gatilhos: ["horario atendimento", "atendimento humano", "falar alguem", "falar atendente", "falar pessoa", "falar humano", "contato"],
    resposta: "O atendimento humano funciona de segunda a sexta, das 9h às 18h (horário de Brasília), pelo formulário de contato do site, com resposta em até 1 dia útil.",
  },
  {
    id: "login", nome: "Mesmo login para todos os produtos", acao: "responder", fonte: "kb-login", ativo: true, motivo: "",
    gatilhos: ["mesmo login", "outro login", "login separado", "outra conta", "nova conta", "cadastro separado"],
    resposta: "Não precisa de outro cadastro: RLPRESS, RLTV e Análise Premium usam o mesmo login da sua conta RealLeader.",
  },
];

export function defaultConfig(): AdminConfig {
  return {
    kb: KB.map((d) => ({ ...d, ativo: true })),
    rules: DEFAULT_RULES.map((r) => ({ ...r, gatilhos: [...r.gatilhos] })),
    humanTypes: ["reembolso", "bug", "parceria", "comercial"],
    threshold: 0.6,
    updatedAt: null,
  };
}

// ---------- Validação do que chega do /admin ----------

const SLUG = /^[a-z0-9][a-z0-9-]{1,59}$/;
const str = (x: unknown, max: number) => (typeof x === "string" ? x.trim().slice(0, max) : "");

export function validateConfig(input: unknown): { ok: true; config: AdminConfig } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "Configuração inválida." };
  const c = input as Record<string, unknown>;
  if (!Array.isArray(c.kb) || !Array.isArray(c.rules) || !Array.isArray(c.humanTypes)) {
    return { ok: false, error: "Faltam a base, as respostas prontas ou o encaminhamento." };
  }
  if (c.kb.length > 300) return { ok: false, error: "A base passa de 300 trechos." };
  if (c.rules.length > 150) return { ok: false, error: "Há mais de 150 respostas prontas." };

  const kb: KbEntry[] = [];
  const kbIds = new Set<string>();
  for (const raw of c.kb) {
    const d = (raw ?? {}) as Record<string, unknown>;
    const id = str(d.id, 60);
    if (!SLUG.test(id)) return { ok: false, error: `Identificador inválido na base: "${id || "(vazio)"}". Use letras minúsculas, números e hífens.` };
    if (kbIds.has(id)) return { ok: false, error: `Identificador repetido na base: "${id}".` };
    const text = str(d.text, 2500);
    if (!text) return { ok: false, error: `O trecho "${id}" está sem texto.` };
    kbIds.add(id);
    kb.push({
      id,
      produto: PRODUTOS.includes(str(d.produto, 20)) ? str(d.produto, 20) : "geral",
      keys: str(d.keys, 600),
      text,
      ativo: d.ativo !== false,
    });
  }

  const rules: AdminRule[] = [];
  const ruleIds = new Set<string>();
  for (const raw of c.rules) {
    const r = (raw ?? {}) as Record<string, unknown>;
    const id = str(r.id, 60);
    if (!SLUG.test(id)) return { ok: false, error: `Identificador inválido em resposta pronta: "${id || "(vazio)"}".` };
    if (ruleIds.has(id)) return { ok: false, error: `Identificador repetido em resposta pronta: "${id}".` };
    ruleIds.add(id);
    const gatilhos = (Array.isArray(r.gatilhos) ? r.gatilhos : [])
      .map((g) => str(g, 80))
      .filter(Boolean)
      .slice(0, 40);
    const acao = r.acao === "humano" ? "humano" : "responder";
    const resposta = str(r.resposta, 2000);
    const ativo = r.ativo !== false;
    if (ativo && !gatilhos.length) return { ok: false, error: `A resposta pronta "${id}" está ativa sem gatilhos.` };
    if (ativo && acao === "responder" && !resposta) return { ok: false, error: `A resposta pronta "${id}" está ativa sem texto de resposta.` };
    const fonte = str(r.fonte, 60);
    rules.push({
      id,
      nome: str(r.nome, 120) || id,
      gatilhos,
      acao,
      resposta,
      motivo: str(r.motivo, 400),
      fonte: kbIds.has(fonte) ? fonte : "",
      ativo,
    });
  }

  const validTipos = new Set(TIPOS.map((t) => t.id));
  const humanTypes = c.humanTypes.map((t) => str(t, 30)).filter((t) => validTipos.has(t));
  const th = Number(c.threshold);
  const threshold = Number.isFinite(th) && th >= 0.3 && th <= 0.95 ? Math.round(th * 100) / 100 : 0.6;

  return { ok: true, config: { kb, rules, humanTypes, threshold, updatedAt: new Date().toISOString() } };
}
