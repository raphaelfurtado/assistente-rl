import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Login simples por senha (ADMIN_PASSWORD). A sessão é um cookie assinado com HMAC, válido por 8 horas.

export const COOKIE = "rl_admin";
const MAX_AGE_S = 8 * 60 * 60;

function secret(): string | null {
  const s = process.env.ADMIN_SECRET?.trim() || process.env.ADMIN_PASSWORD?.trim();
  return s ? `rl-admin:${s}` : null;
}

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

function sign(payload: string, key: string) {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function checkPassword(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  // Compara os hashes para não vazar o tamanho da senha pelo tempo de resposta.
  const h = (x: string) => createHmac("sha256", "rl-admin-pw").update(x).digest("base64url");
  return safeEqual(h(input), h(expected));
}

export function createSessionValue(): { value: string; maxAge: number } {
  const key = secret();
  if (!key) throw new Error("ADMIN_PASSWORD não configurada.");
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = `admin.${exp}`;
  return { value: `${payload}.${sign(payload, key)}`, maxAge: MAX_AGE_S };
}

export function verifySessionValue(value: string | undefined): boolean {
  const key = secret();
  if (!key || !value) return false;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  return safeEqual(parts[2], sign(`${parts[0]}.${parts[1]}`, key));
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(store.get(COOKIE)?.value);
}
