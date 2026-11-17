import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { validateConfig } from "@/lib/config";
import { getConfig, saveConfig, storageKind } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unauthorized = () => NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });

export async function GET() {
  if (!(await isAdmin())) return unauthorized();
  return NextResponse.json({ config: await getConfig({ fresh: true }), storage: storageKind() });
}

export async function PUT(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição precisa ser JSON." }, { status: 400 });
  }
  const v = validateConfig(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  try {
    await saveConfig(v.config);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível salvar." }, { status: 503 });
  }
  return NextResponse.json({ config: v.config, storage: storageKind() });
}
