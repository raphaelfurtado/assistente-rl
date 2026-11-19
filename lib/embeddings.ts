import { getClient } from "./llm";

// Mesmo modelo de embeddings do experimento M1D2 (1536 dimensões).
export const EMBEDDING_MODEL = "text-embedding-3-small";

export async function embed(textos: string[]): Promise<number[][] | null> {
  const c = getClient();
  if (!c || !textos.length) return null;
  const r = await c.embeddings.create({ model: EMBEDDING_MODEL, input: textos });
  return r.data.map((d) => d.embedding);
}
