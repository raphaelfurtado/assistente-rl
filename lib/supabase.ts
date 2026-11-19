import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente do Supabase usado SÓ no servidor, com a chave secreta.
// As tabelas têm RLS ligado e nenhuma política: a chave pública não acessa nada.

let client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)?.trim();
  const key = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim();
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}
