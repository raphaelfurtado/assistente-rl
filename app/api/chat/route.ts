import { NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import type { Turn } from "@/lib/types";

export const runtime = "nodejs";

const MAX_MESSAGE = 600;
const MAX_TURNS = 6;
const MAX_TURN_CHARS = 1200;

function parseHistory(x: unknown): Turn[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((t): t is Turn =>
      !!t && typeof t === "object" &&
      ((t as Turn).role === "user" || (t as Turn).role === "assistant") &&
      typeof (t as Turn).content === "string")
    .slice(-MAX_TURNS)
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURN_CHARS) }));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição precisa ser JSON." }, { status: 400 });
  }
  const { message, history } = (body ?? {}) as { message?: unknown; history?: unknown };
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Envie o campo 'message' com o texto do cliente." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: `A mensagem passa de ${MAX_MESSAGE} caracteres.` }, { status: 413 });
  }
  const result = await runPipeline(message.trim(), parseHistory(history));
  return NextResponse.json(result);
}

export async function GET() {
  return NextResponse.json({ ok: true, llm: Boolean(process.env.OPENAI_API_KEY?.trim()) });
}
