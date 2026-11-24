// Modelos comparados no benchmark M1D3.
// Preços oficiais por 1M de tokens (tier padrão), consultados em 24/11/2026:
// - OpenAI: https://developers.openai.com/api/docs/pricing
// - Groq:   https://console.groq.com/docs/models
// O modelo local não tem custo de API (o custo é o hardware e a energia, discutidos no relatório).

export const MODELOS = [
  { id: "gpt-6.2-astra", nome: "GPT-6.2 Astra", papel: "Premium (topo)", provedor: "openai", entrada: 8.0, saida: 40.0 },
  { id: "gpt-6.2-sol", nome: "GPT-6.2 Sol", papel: "Premium (padrão)", provedor: "openai", entrada: 2.0, saida: 10.0 },
  { id: "gpt-6-luna", nome: "GPT-6 Luna", papel: "Intermediário econômico", provedor: "openai", entrada: 0.1, saida: 0.5 },
  { id: "gpt-4o-mini", nome: "GPT-4o mini", papel: "Referência (em produção)", provedor: "openai", entrada: 0.15, saida: 0.6 },
  { id: "openai/gpt-oss-120b", nome: "gpt-oss-120b (Groq)", papel: "Open-source em nuvem", provedor: "groq", entrada: 0.15, saida: 0.6 },
  { id: process.env.MODELO_LOCAL || "qwen2.5:3b", nome: `${process.env.MODELO_LOCAL || "qwen2.5:3b"} (local)`, papel: "Open-source local", provedor: "ollama", entrada: 0, saida: 0 },
];

export const PROVEDORES = {
  openai: { base: "https://api.openai.com/v1", chave: "OPENAI_API_KEY", paralelo: 4 },
  groq: { base: "https://api.groq.com/openai/v1", chave: "GROQ_API_KEY", paralelo: 1 }, // plano gratuito: limite de chamadas por minuto
  ollama: { base: "http://localhost:11434/v1", chave: null, paralelo: 1 },
};

// Condições equivalentes: os modelos GPT-6 e GPT-5.6 só aceitam temperatura 1 (padrão),
// então TODOS rodam com temperatura 1. O limite de saída é alto para não cortar modelos que raciocinam.
export const CONDICOES = { temperatura: 1, maxTokens: 2000, execucoes: 3 };

// Cenários de volume do projeto (Disciplina 01) e o caminho de cada mensagem pelo assistente:
// 35% resolvidas por regras (sem LLM); as outras 65% passam pela classificação;
// cerca de 45% de todas as mensagens chegam à resposta com a base (LLM com fontes ou orientação imediata).
export const VOLUMES = [400, 1200, 3000];
export const FLUXO = { classificacao: 0.65, resposta: 0.45 };
