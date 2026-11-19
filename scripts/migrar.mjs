// Roda as migrations da pasta supabase/ no banco do Supabase, em ordem, uma vez cada.
// Uso: npm run db:migrar
// Precisa de SUPABASE_DB_URL (connection string com a senha) no .env.local ou no ambiente.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PASTA = path.join(RAIZ, "supabase");

function lerEnv(nome) {
  if (process.env[nome]) return process.env[nome];
  const arq = path.join(RAIZ, ".env.local");
  if (!existsSync(arq)) return undefined;
  const linha = readFileSync(arq, "utf8").split(/\r?\n/).map((l) => l.replace(/^﻿/, "")).find((l) => l.startsWith(`${nome}=`));
  return linha ? linha.slice(nome.length + 1).trim() : undefined;
}

const url = lerEnv("SUPABASE_DB_URL");
if (!url) {
  console.error("Defina SUPABASE_DB_URL no .env.local (Supabase → Get Connected → connection string, com a senha).");
  process.exit(1);
}

// Separa as partes à mão: a senha pode ter caracteres especiais (@, #, /, ?) que quebram o formato de URL.
// O último "@" separa as credenciais do endereço.
function partes(s) {
  const m = s.match(/^postgres(?:ql)?:\/\/(.*)@([^@/:]+)(?::(\d+))?\/([^?]*)/);
  if (!m) throw new Error("SUPABASE_DB_URL não está no formato postgresql://usuario:senha@host:porta/banco");
  const cred = m[1];
  const i = cred.indexOf(":");
  return { user: cred.slice(0, i), password: cred.slice(i + 1), host: m[2], port: Number(m[3] || 5432), database: m[4] || "postgres" };
}

const client = new pg.Client({ ...partes(url), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(`create table if not exists _migracoes (nome text primary key, aplicada_em timestamptz not null default now())`);
  const feitas = new Set((await client.query("select nome from _migracoes")).rows.map((r) => r.nome));
  const arquivos = readdirSync(PASTA).filter((f) => f.endsWith(".sql")).sort();
  let novas = 0;
  for (const f of arquivos) {
    if (feitas.has(f)) {
      console.log(`= ${f} (já aplicada)`);
      continue;
    }
    const sql = readFileSync(path.join(PASTA, f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into _migracoes (nome) values ($1)", [f]);
      await client.query("commit");
      console.log(`+ ${f} aplicada`);
      novas++;
    } catch (e) {
      await client.query("rollback");
      throw new Error(`${f}: ${e.message}`);
    }
  }
  // A tabela de controle também fica protegida por RLS
  await client.query("alter table _migracoes enable row level security");
  console.log(novas ? `${novas} migration(s) aplicada(s).` : "Banco já estava atualizado.");
} finally {
  await client.end();
}
