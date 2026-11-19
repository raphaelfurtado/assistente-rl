-- Assistente RL — estrutura do banco no Supabase
-- Como usar: Supabase → SQL Editor → New query → cole este arquivo inteiro → Run.
-- Pode rodar mais de uma vez: só cria o que ainda não existe.

-- Busca semântica (embeddings), a mesma do experimento M1D2
create extension if not exists vector;

-- Camada 1: respostas prontas, na ordem em que são testadas
create table if not exists respostas_prontas (
  id            text primary key,
  ordem         integer not null default 0,
  nome          text not null,
  gatilhos      text[] not null default '{}',
  acao          text not null default 'responder' check (acao in ('responder', 'humano')),
  resposta      text not null default '',
  motivo        text not null default '',
  fonte         text not null default '',
  ativo         boolean not null default true,
  atualizado_em timestamptz not null default now()
);

-- Camada 3: base de conhecimento (fontes autorizadas) com o vetor para busca semântica
create table if not exists base_conhecimento (
  id            text primary key,
  produto       text not null default 'geral',
  palavras      text not null default '',
  texto         text not null,
  url           text,
  ativo         boolean not null default true,
  embedding     vector(1536),
  texto_embedding text,                 -- texto usado no último embedding (para saber quando recalcular)
  atualizado_em timestamptz not null default now()
);

-- Ajustes gerais (tipos que vão para humano, confiança mínima)
create table if not exists configuracao (
  chave         text primary key,
  valor         jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- Encaminhamentos para a equipe (o "resumo" que antes só aparecia na tela)
-- Guarda só um trecho da mensagem (até 300 caracteres) e a classificação, não a conversa inteira.
create table if not exists encaminhamentos (
  id           uuid primary key default gen_random_uuid(),
  criado_em    timestamptz not null default now(),
  categoria    text not null,
  produto      text not null default '',
  idioma       text not null default 'pt',
  motivo       text not null default '',
  mensagem     text not null,
  status       text not null default 'aberto' check (status in ('aberto', 'resolvido')),
  resolvido_em timestamptz
);
create index if not exists encaminhamentos_criado_em_idx on encaminhamentos (criado_em desc);

-- Busca semântica: os trechos ativos mais parecidos com a pergunta
create or replace function buscar_trechos(consulta vector(1536), quantidade int default 4)
returns table (id text, produto text, palavras text, texto text, url text, similaridade float)
language sql stable
as $$
  select b.id, b.produto, b.palavras, b.texto, b.url, 1 - (b.embedding <=> consulta) as similaridade
  from base_conhecimento b
  where b.ativo and b.embedding is not null
  order by b.embedding <=> consulta
  limit quantidade;
$$;

-- Segurança: RLS ligado e nenhuma política.
-- Resultado: a chave pública (publishable/anon) não lê nem grava nada;
-- só o servidor, com a chave secreta, acessa as tabelas.
alter table respostas_prontas enable row level security;
alter table base_conhecimento enable row level security;
alter table configuracao     enable row level security;
alter table encaminhamentos  enable row level security;
