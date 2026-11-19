import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { atualizarStatus, listarEncaminhamentos } from "@/lib/handoffs";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  if (!getSupabase()) return NextResponse.json({ disponivel: false, itens: [] });
  try {
    return NextResponse.json({ disponivel: true, itens: await listarEncaminhamentos() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível ler os encaminhamentos." }, { status: 503 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  let body: { id?: unknown; status?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* corpo inválido */
  }
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "resolvido" ? "resolvido" : body.status === "aberto" ? "aberto" : null;
  if (!/^[0-9a-f-]{36}$/i.test(id) || !status) return NextResponse.json({ error: "Envie id e status (aberto ou resolvido)." }, { status: 400 });
  try {
    await atualizarStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível atualizar." }, { status: 503 });
  }
}
