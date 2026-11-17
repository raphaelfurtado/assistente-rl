import { promises as fs } from "node:fs";
import path from "node:path";
import { Redis } from "@upstash/redis";
import { defaultConfig, type AdminConfig } from "./config";

// Onde a configuração editada no /admin fica guardada:
// - Upstash Redis, quando as variáveis existem (Vercel → Storage → Upstash)
// - arquivo .data/config.json, ao rodar localmente sem Redis
// - nenhum lugar, na Vercel sem Redis: o admin abre, mas não consegue salvar

const KEY = "rl:config";
const LOCAL_FILE = path.join(process.cwd(), ".data", "config.json");

export type StorageKind = "upstash" | "arquivo" | "nenhum";

let redis: Redis | null | undefined;
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export function storageKind(): StorageKind {
  if (getRedis()) return "upstash";
  return process.env.VERCEL ? "nenhum" : "arquivo";
}

// Cache curto para não consultar o banco a cada mensagem do chat.
let cache: { at: number; config: AdminConfig } | null = null;
const TTL_MS = 5000;

export async function getConfig({ fresh = false } = {}): Promise<AdminConfig> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.config;
  let config: AdminConfig | null = null;
  try {
    const kind = storageKind();
    if (kind === "upstash") {
      config = (await getRedis()!.get<AdminConfig>(KEY)) ?? null;
    } else if (kind === "arquivo") {
      config = JSON.parse(await fs.readFile(LOCAL_FILE, "utf8")) as AdminConfig;
    }
  } catch {
    config = null; // sem arquivo ainda, ou banco indisponível: usa o padrão
  }
  const result = config ?? defaultConfig();
  cache = { at: Date.now(), config: result };
  return result;
}

export async function saveConfig(config: AdminConfig): Promise<void> {
  const kind = storageKind();
  if (kind === "nenhum") {
    throw new Error("Nenhum banco configurado. Na Vercel, conecte o Upstash Redis em Storage e faça um Redeploy.");
  }
  if (kind === "upstash") {
    await getRedis()!.set(KEY, config);
  } else {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
    await fs.writeFile(LOCAL_FILE, JSON.stringify(config, null, 2), "utf8");
  }
  cache = { at: Date.now(), config };
}

export async function resetConfig(): Promise<AdminConfig> {
  const kind = storageKind();
  if (kind === "upstash") await getRedis()!.del(KEY);
  else if (kind === "arquivo") await fs.rm(LOCAL_FILE, { force: true });
  cache = null;
  return defaultConfig();
}
