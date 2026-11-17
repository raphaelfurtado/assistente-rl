import { NextResponse } from "next/server";
import { getConfig } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista pública dos trechos ativos da base (o mesmo conteúdo que o chat já pode dizer ao cliente).
export async function GET() {
  const config = await getConfig();
  return NextResponse.json({
    kb: config.kb.filter((d) => d.ativo).map(({ id, text }) => ({ id, text })),
    updatedAt: config.updatedAt,
  });
}
