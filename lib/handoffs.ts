import { getSupabase } from "./supabase";

// Encaminhamentos para a equipe, gravados no Supabase.
// Por privacidade (LGPD), guarda só um trecho da mensagem e a classificação, não a conversa.

export type Encaminhamento = {
  id: string;
  criado_em: string;
  categoria: string;
  produto: string;
  idioma: string;
  motivo: string;
  mensagem: string;
  status: "aberto" | "resolvido";
  resolvido_em: string | null;
};

export async function registrarEncaminhamento(e: { categoria: string; produto: string; idioma: string; motivo: string; mensagem: string }): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from("encaminhamentos").insert({ ...e, mensagem: e.mensagem.slice(0, 300), motivo: e.motivo.slice(0, 300) });
    return !error;
  } catch {
    return false;
  }
}

export async function listarEncaminhamentos(limite = 200): Promise<Encaminhamento[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.from("encaminhamentos").select("*").order("criado_em", { ascending: false }).limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as Encaminhamento[];
}

export async function atualizarStatus(id: string, status: "aberto" | "resolvido"): Promise<void> {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase não configurado.");
  const { error } = await sb
    .from("encaminhamentos")
    .update({ status, resolvido_em: status === "resolvido" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
