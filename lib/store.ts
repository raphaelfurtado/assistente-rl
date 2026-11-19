import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { defaultConfig, type AdminConfig, type AdminRule, type KbEntry } from "./config";
import { embed } from "./embeddings";
import { getSupabase } from "./supabase";

// Onde a configuração editada no /admin fica guardada, em ordem de preferência:
// - Supabase (Postgres): tabelas respostas_prontas, base_conhecimento e configuracao (supabase/001_inicial.sql)
// - Upstash Redis: um documento JSON na chave rl:config
// - arquivo .data/config.json, ao rodar localmente sem banco
// - nenhum lugar, na Vercel sem banco: o admin abre, mas não consegue salvar

const KEY = "rl:config";
const LOCAL_FILE = path.join(process.cwd(), ".data", "config.json");

export type StorageKind = "supabase" | "upstash" | "arquivo" | "nenhum";

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function storageKind(): StorageKind {
  if (getSupabase()) return "supabase";
  if (getRedis()) return "upstash";
  return process.env.VERCEL ? "nenhum" : "arquivo";
}

// Cache curto para não consultar o banco a cada mensagem do chat.
let cache: { at: number; config: AdminConfig } | null = null;
const TTL_MS = 5000;

// ---------- Supabase ----------
type RegraRow = { id: string; ordem: number; nome: string; gatilhos: string[]; acao: "responder" | "humano"; resposta: string; motivo: string; fonte: string; ativo: boolean };
type KbRow = { id: string; produto: string; palavras: string; texto: string; url: string | null; ativo: boolean; texto_embedding?: string | null };

async function lerSupabase(): Promise<AdminConfig | null> {
  const sb = getSupabase()!;
  const [r, k, c] = await Promise.all([
    sb.from("respostas_prontas").select("id,ordem,nome,gatilhos,acao,resposta,motivo,fonte,ativo").order("ordem"),
    sb.from("base_conhecimento").select("id,produto,palavras,texto,url,ativo").order("id"),
    sb.from("configuracao").select("chave,valor").eq("chave", "geral").maybeSingle(),
  ]);
  if (r.error) throw new Error(r.error.message);
  if (k.error) throw new Error(k.error.message);
  if (c.error) throw new Error(c.error.message);
  if (!c.data) return null; // banco ainda vazio: vale o padrão do código
  const geral = c.data.valor as { humanTypes?: string[]; threshold?: number; updatedAt?: string; ordemKb?: string[] };
  const kb: KbEntry[] = ((k.data ?? []) as KbRow[]).map((d) => ({ id: d.id, produto: d.produto, keys: d.palavras, text: d.texto, url: d.url ?? undefined, ativo: d.ativo }));
  // Mantém a ordem da base como estava no admin
  if (geral.ordemKb?.length) kb.sort((a, b) => geral.ordemKb!.indexOf(a.id) - geral.ordemKb!.indexOf(b.id));
  return {
    rules: ((r.data ?? []) as RegraRow[]).map(({ ordem: _o, ...x }) => x as AdminRule),
    kb,
    humanTypes: geral.humanTypes ?? defaultConfig().humanTypes,
    threshold: geral.threshold ?? 0.6,
    updatedAt: geral.updatedAt ?? null,
  };
}

const lista = (ids: string[]) => `(${ids.map((i) => `"${i.replace(/"/g, "")}"`).join(",")})`;

async function gravarSupabase(config: AdminConfig): Promise<void> {
  const sb = getSupabase()!;
  const agora = new Date().toISOString();

  // Respostas prontas: grava todas na ordem e apaga as que saíram
  const regras = config.rules.map((r, i) => ({ ...r, ordem: i, atualizado_em: agora }));
  if (regras.length) {
    const { error } = await sb.from("respostas_prontas").upsert(regras);
    if (error) throw new Error(`Respostas prontas: ${error.message}`);
  }
  const delR = regras.length
    ? await sb.from("respostas_prontas").delete().not("id", "in", lista(regras.map((r) => r.id)))
    : await sb.from("respostas_prontas").delete().neq("id", "");
  if (delR.error) throw new Error(`Respostas prontas: ${delR.error.message}`);

  // Base de conhecimento: grava o texto e recalcula o embedding só dos trechos que mudaram
  const atuais = await sb.from("base_conhecimento").select("id,texto_embedding");
  if (atuais.error) throw new Error(`Base: ${atuais.error.message}`);
  const jaTem = new Map(((atuais.data ?? []) as { id: string; texto_embedding: string | null }[]).map((d) => [d.id, d.texto_embedding]));
  const linhas = config.kb.map((d) => ({ id: d.id, produto: d.produto, palavras: d.keys, texto: d.text, url: d.url ?? null, ativo: d.ativo, atualizado_em: agora }));
  if (linhas.length) {
    const { error } = await sb.from("base_conhecimento").upsert(linhas);
    if (error) throw new Error(`Base: ${error.message}`);
  }
  const delK = linhas.length
    ? await sb.from("base_conhecimento").delete().not("id", "in", lista(linhas.map((d) => d.id)))
    : await sb.from("base_conhecimento").delete().neq("id", "");
  if (delK.error) throw new Error(`Base: ${delK.error.message}`);

  const mudaram = config.kb.filter((d) => jaTem.get(d.id) !== d.text);
  if (mudaram.length) {
    const vetores = await embed(mudaram.map((d) => d.text)).catch(() => null);
    if (vetores) {
      for (let i = 0; i < mudaram.length; i++) {
        const { error } = await sb.from("base_conhecimento").update({ embedding: vetores[i], texto_embedding: mudaram[i].text }).eq("id", mudaram[i].id);
        if (error) throw new Error(`Embedding de ${mudaram[i].id}: ${error.message}`);
      }
    }
  }

  // Ajustes gerais
  const { error } = await sb.from("configuracao").upsert({
    chave: "geral",
    valor: { humanTypes: config.humanTypes, threshold: config.threshold, updatedAt: config.updatedAt ?? agora, ordemKb: config.kb.map((d) => d.id) },
    atualizado_em: agora,
  });
  if (error) throw new Error(`Configuração: ${error.message}`);
}

// ---------- API usada pelo resto do projeto ----------

export async function getConfig({ fresh = false } = {}): Promise<AdminConfig> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.config;
  let config: AdminConfig | null = null;
  try {
    const kind = storageKind();
    if (kind === "supabase") config = await lerSupabase();
    else if (kind === "upstash") config = (await getRedis()!.get<AdminConfig>(KEY)) ?? null;
    else if (kind === "arquivo") config = JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) as AdminConfig;
  } catch {
    config = null; // banco vazio, sem tabelas ainda ou indisponível: usa o padrão do código
  }
  const result = config ?? defaultConfig();
  cache = { at: Date.now(), config: result };
  return result;
}

export async function saveConfig(config: AdminConfig): Promise<void> {
  const kind = storageKind();
  if (kind === "nenhum") {
    throw new Error("Nenhum banco configurado. Na Vercel, conecte o Supabase (ou o Upstash) e faça um Redeploy.");
  }
  if (kind === "supabase") await gravarSupabase(config);
  else if (kind === "upstash") await getRedis()!.set(KEY, config);
  else {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, JSON.stringify(config, null, 2), "utf8");
  }
  cache = { at: Date.now(), config };
}

// No Supabase, "restaurar o padrão" grava o padrão do código nas tabelas (inclusive os embeddings),
// o que também serve para carregar o banco pela primeira vez.
export async function resetConfig(): Promise<AdminConfig> {
  const kind = storageKind();
  const padrao = { ...defaultConfig(), updatedAt: new Date().toISOString() };
  if (kind === "supabase") {
    await gravarSupabase(padrao);
    cache = null;
    return padrao;
  }
  if (kind === "upstash") await getRedis()!.del(KEY);
  else if (kind === "arquivo") await fs.rm(LOCAL_FILE, { force: true });
  cache = null;
  return defaultConfig();
}

// Busca semântica na base (pgvector). Devolve null quando não dá para usar (sem Supabase, sem LLM,
// sem embeddings ainda), para o pipeline cair na busca por palavras-chave.
export async function buscarTrechosSemantica(texto: string, quantidade = 4): Promise<{ id: string; similaridade: number }[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const v = await embed([texto]);
    if (!v) return null;
    const { data, error } = await sb.rpc("buscar_trechos", { consulta: v[0], quantidade });
    if (error || !data?.length) return null;
    return (data as { id: string; similaridade: number }[]).map((d) => ({ id: d.id, similaridade: d.similaridade }));
  } catch {
    return null;
  }
}
