import { NextResponse } from "next/server";
import { adminConfigured, checkPassword, COOKIE, createSessionValue } from "@/lib/auth";

export const runtime = "nodejs";

// Freio simples contra tentativas em sequência (por instância do servidor).
const attempts = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "O admin está desligado: defina ADMIN_PASSWORD nas variáveis de ambiente." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = attempts.get(ip);
  if (a && a.until > Date.now()) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto e tente de novo." }, { status: 429 });
  }

  let password = "";
  try {
    const body = (await req.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    /* corpo inválido */
  }

  if (!checkPassword(password)) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(ip, { n, until: n >= 5 ? Date.now() + 60_000 : 0 });
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  attempts.delete(ip);
  const { value, maxAge } = createSessionValue();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge });
  return res;
}
