import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { resetConfig, storageKind } from "@/lib/store";

export const runtime = "nodejs";

export async function POST() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  try {
    const config = await resetConfig();
    return NextResponse.json({ config, storage: storageKind() });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Não foi possível restaurar." }, { status: 503 });
  }
}
