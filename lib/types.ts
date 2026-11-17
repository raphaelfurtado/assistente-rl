export type Layer = 1 | 2 | 3 | 4;
export type Lang = "pt" | "en" | "es";

export type Step = {
  layer: Layer;
  result: string;
  skip?: boolean;
  kv: [string, string][];
};

export type Turn = { role: "user" | "assistant"; content: string };

export type ChatResult = {
  reply: string;
  layer: Layer; // camada em que a mensagem terminou
  steps: Step[];
  meta?: string; // linha curta exibida sob a resposta (fonte, confiança, motivo)
  handoff?: string; // resumo enviado à equipe, quando vai para humano
  lang: Lang;
  llm: boolean; // se o LLM estava disponível nesta chamada
  ms: number;
};

export type Classification = {
  produto: string;
  tipo: string;
  idioma: string;
  resumo: string;
  confianca: number;
  origem: string;
};
