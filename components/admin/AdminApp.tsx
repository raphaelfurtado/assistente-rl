"use client";

import { useEffect, useMemo, useState } from "react";
import Demo from "@/components/Demo";
import SiteNav from "@/components/SiteNav";
import { PRODUTOS, TIPOS, type AdminConfig, type AdminRule, type KbEntry } from "@/lib/config";
import { matchRule, triggerMatches } from "@/lib/rules";
import { norm } from "@/lib/text";
import type { StorageKind } from "@/lib/store";

type Tab = "regras" | "base" | "encaminhamento" | "casos" | "testar";

const STORAGE_LABEL: Record<StorageKind, string> = {
  supabase: "Salvando no Supabase (Postgres)",
  upstash: "Salvando no Upstash Redis",
  arquivo: "Salvando em arquivo local (.data/config.json)",
  nenhum: "Sem banco: as alterações não podem ser salvas",
};

const snapshot = (c: AdminConfig) => JSON.stringify({ kb: c.kb, rules: c.rules, humanTypes: c.humanTypes, threshold: c.threshold });

function uniqueId(base: string, taken: Set<string>) {
  let i = 1;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "nunca (usando o padrão)";

export default function AdminApp({ initial, storage }: { initial: AdminConfig; storage: StorageKind }) {
  const [cfg, setCfg] = useState<AdminConfig>(initial);
  const [savedCfg, setSavedCfg] = useState<AdminConfig>(initial);
  const saved = useMemo(() => snapshot(savedCfg), [savedCfg]);
  const [store, setStore] = useState<StorageKind>(storage);
  const [tab, setTab] = useState<Tab>("regras");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const dirty = snapshot(cfg) !== saved;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    if (notice?.kind !== "ok") return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  async function call(url: string, init?: RequestInit) {
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch(url, init);
      if (r.status === 401) {
        window.location.href = "/admin/login";
        return null;
      }
      const d = (await r.json()) as { config?: AdminConfig; storage?: StorageKind; error?: string };
      if (!r.ok || !d.config) throw new Error(d.error || `Erro ${r.status}`);
      setCfg(d.config);
      setSavedCfg(d.config);
      if (d.storage) setStore(d.storage);
      return d.config;
    } catch (e) {
      setNotice({ kind: "error", text: e instanceof Error ? e.message : "Algo deu errado." });
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const ok = await call("/api/admin/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg) });
    if (ok) setNotice({ kind: "ok", text: "Alterações salvas. O chat já usa a nova versão." });
  }

  async function reset() {
    setConfirmReset(false);
    const ok = await call("/api/admin/reset", { method: "POST" });
    if (ok) setNotice({ kind: "ok", text: "Configuração padrão restaurada." });
  }

  function discard() {
    setCfg(savedCfg);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="page">
      <div className="wrap">
        <SiteNav atual="admin" />
        <header className="admin-top">
          <div className="admin-title">
            <div className="eyebrow"><a href="/">Assistente RL</a> · admin</div>
            <h1>Admin do assistente</h1>
            <p className="admin-status">
              <span className={`dot ${store === "nenhum" ? "bad" : "good"}`} aria-hidden="true" />
              {STORAGE_LABEL[store]} · última alteração: {fmtDate(cfg.updatedAt)}
            </p>
          </div>
          <div className="admin-actions">
            {dirty && <span className="dirty">Alterações não salvas</span>}
            <button className="btn" type="button" onClick={discard} disabled={!dirty || busy}>Descartar</button>
            <button className="btn primary" type="button" onClick={save} disabled={!dirty || busy || store === "nenhum"}>
              {busy ? "Salvando…" : "Salvar"}
            </button>
            <button className="btn ghost" type="button" onClick={logout}>Sair</button>
          </div>
        </header>

        {store === "nenhum" && (
          <div className="banner error">
            Este servidor não tem banco para guardar as alterações. Na Vercel, abra o projeto → Storage → conecte um banco Upstash Redis e faça um Redeploy.
          </div>
        )}
        {notice && <div className={`banner ${notice.kind}`} role="status">{notice.text}</div>}

        <nav className="tabs" role="tablist" aria-label="Seções do admin">
          {([
            ["regras", `Respostas prontas (${cfg.rules.length})`],
            ["base", `Base de conhecimento (${cfg.kb.length})`],
            ["encaminhamento", "Encaminhamento"],
            ["casos", "Casos para a equipe"],
            ["testar", "Testar o chat"],
          ] as [Tab, string][]).map(([id, label]) => (
            <button key={id} role="tab" type="button" aria-selected={tab === id} className={`tab${tab === id ? " on" : ""}`} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>

        {tab === "regras" && <RulesTab cfg={cfg} setCfg={setCfg} />}
        {tab === "base" && <KbTab cfg={cfg} setCfg={setCfg} />}
        {tab === "encaminhamento" && (
          <RoutingTab cfg={cfg} setCfg={setCfg} confirmReset={confirmReset} setConfirmReset={setConfirmReset} onReset={reset} busy={busy} />
        )}
        {tab === "casos" && <CasosTab />}
        {tab === "testar" && (
          <section>
            {dirty && <div className="banner warn">Você tem alterações não salvas. O chat de teste usa a versão salva: clique em Salvar antes de testar.</div>}
            <Demo />
          </section>
        )}
      </div>
    </main>
  );
}

// ---------------- Respostas prontas ----------------

function RulesTab({ cfg, setCfg }: { cfg: AdminConfig; setCfg: React.Dispatch<React.SetStateAction<AdminConfig>> }) {
  const [sel, setSel] = useState<string | null>(cfg.rules[0]?.id ?? null);
  const [probe, setProbe] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const idx = cfg.rules.findIndex((r) => r.id === sel);
  const rule = idx >= 0 ? cfg.rules[idx] : null;

  const probeHit = useMemo(() => (probe.trim() ? matchRule(probe, cfg.rules) : null), [probe, cfg.rules]);

  function update(patch: Partial<AdminRule>) {
    if (idx < 0) return;
    setCfg((c) => ({ ...c, rules: c.rules.map((r, i) => (i === idx ? { ...r, ...patch } : r)) }));
    if (patch.id !== undefined) setSel(patch.id);
  }

  function add() {
    const id = uniqueId("nova-resposta", new Set(cfg.rules.map((r) => r.id)));
    const r: AdminRule = { id, nome: "Nova resposta pronta", gatilhos: [], acao: "responder", resposta: "", motivo: "", fonte: "", ativo: true };
    setCfg((c) => ({ ...c, rules: [...c.rules, r] }));
    setSel(id);
  }

  function move(delta: number) {
    const j = idx + delta;
    if (idx < 0 || j < 0 || j >= cfg.rules.length) return;
    setCfg((c) => {
      const rules = [...c.rules];
      [rules[idx], rules[j]] = [rules[j], rules[idx]];
      return { ...c, rules };
    });
  }

  function remove() {
    setCfg((c) => ({ ...c, rules: c.rules.filter((_, i) => i !== idx) }));
    setSel(cfg.rules[idx + 1]?.id ?? cfg.rules[idx - 1]?.id ?? null);
    setConfirmDel(false);
  }

  return (
    <div className="split">
      <aside className="list card">
        <div className="list-head">
          <h2>Respostas prontas</h2>
          <button className="btn small" type="button" onClick={add}>+ Nova</button>
        </div>
        <p className="hint">A ordem importa: a primeira que casar responde. Valem só para mensagens em português.</p>
        <ol className="items">
          {cfg.rules.map((r, i) => (
            <li key={r.id}>
              <button type="button" className={`item${r.id === sel ? " on" : ""}${r.ativo ? "" : " off"}`} onClick={() => { setSel(r.id); setConfirmDel(false); }}>
                <span className="item-n">{i + 1}</span>
                <span className="item-main">
                  <span className="item-title">{r.nome}</span>
                  <span className="item-sub">
                    <span className={`tag ${r.acao === "humano" ? "t4" : "t1"}`}>{r.acao === "humano" ? "Humano" : "Responde"}</span>
                    {!r.ativo && <span className="muted">desativada</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="probe">
          <label htmlFor="probe">Testar os gatilhos com uma frase</label>
          <input id="probe" type="text" placeholder="Ex.: meus créditos vencem quando?" value={probe} onChange={(e) => setProbe(e.target.value)} />
          {probe.trim() && (
            <p className="probe-res">
              {probeHit ? <>Casa com <b>{probeHit.rule.nome}</b> pelo gatilho “{probeHit.gatilho}”.</> : "Nenhuma resposta pronta casa. A mensagem segue para a classificação e o LLM."}
            </p>
          )}
        </div>
      </aside>

      {rule ? (
        <section className="editor card" aria-label="Editar resposta pronta">
          <div className="editor-head">
            <h2>{rule.nome || "(sem nome)"}</h2>
            <div className="row-actions">
              <button className="btn small" type="button" onClick={() => move(-1)} disabled={idx === 0} aria-label="Subir na ordem">↑</button>
              <button className="btn small" type="button" onClick={() => move(1)} disabled={idx === cfg.rules.length - 1} aria-label="Descer na ordem">↓</button>
            </div>
          </div>

          <div className="fields two">
            <label className="field">
              <span>Nome</span>
              <input id="rule-nome" type="text" value={rule.nome} maxLength={120} onChange={(e) => update({ nome: e.target.value })} />
            </label>
            <label className="field">
              <span>Identificador</span>
              <input id="rule-id" type="text" value={rule.id} maxLength={60} onChange={(e) => update({ id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
            </label>
          </div>

          <fieldset className="field">
            <legend>O que fazer quando casar</legend>
            <div className="radios">
              <label><input type="radio" name="acao" checked={rule.acao === "responder"} onChange={() => update({ acao: "responder" })} /> Responder com o texto abaixo</label>
              <label><input type="radio" name="acao" checked={rule.acao === "humano"} onChange={() => update({ acao: "humano" })} /> Encaminhar para humano</label>
            </div>
          </fieldset>

          <label className="field">
            <span>Gatilhos (um por linha)</span>
            <textarea
              id="rule-gatilhos"
              rows={5}
              value={rule.gatilhos.join("\n")}
              onChange={(e) => update({ gatilhos: e.target.value.split("\n") })}
              placeholder={"credit venc\ncredit expir\ncontrat rlpress"}
            />
            <small>
              Todas as palavras de uma linha precisam aparecer na mensagem, em qualquer ordem. Basta o começo da palavra:
              “credit” casa com “crédito” e “créditos”. Acentos e maiúsculas são ignorados.
            </small>
          </label>
          <TriggerPreview gatilhos={rule.gatilhos} />

          {rule.acao === "responder" ? (
            <label className="field">
              <span>Resposta enviada ao cliente</span>
              <textarea id="rule-resposta" rows={7} value={rule.resposta} maxLength={2000} onChange={(e) => update({ resposta: e.target.value })} />
            </label>
          ) : (
            <label className="field">
              <span>Motivo do encaminhamento (aparece para a equipe)</span>
              <textarea id="rule-motivo" rows={3} value={rule.motivo} maxLength={400} onChange={(e) => update({ motivo: e.target.value })} />
            </label>
          )}

          <div className="fields two">
            <label className="field">
              <span>Fonte na base de conhecimento</span>
              <select id="rule-fonte" value={rule.fonte} onChange={(e) => update({ fonte: e.target.value })}>
                <option value="">(nenhuma)</option>
                {cfg.kb.map((d) => <option key={d.id} value={d.id}>{d.id}</option>)}
              </select>
            </label>
            <label className="check">
              <input type="checkbox" checked={rule.ativo} onChange={(e) => update({ ativo: e.target.checked })} /> Ativa
            </label>
          </div>

          <div className="danger">
            {confirmDel ? (
              <>
                <span>Excluir “{rule.nome}”? A exclusão só vale depois de Salvar.</span>
                <button className="btn danger-btn small" type="button" onClick={remove}>Excluir</button>
                <button className="btn small" type="button" onClick={() => setConfirmDel(false)}>Cancelar</button>
              </>
            ) : (
              <button className="btn ghost small" type="button" onClick={() => setConfirmDel(true)}>Excluir esta resposta pronta</button>
            )}
          </div>
        </section>
      ) : (
        <section className="editor card"><p className="empty">Nenhuma resposta pronta. Clique em “+ Nova”.</p></section>
      )}
    </div>
  );
}

function TriggerPreview({ gatilhos }: { gatilhos: string[] }) {
  const [text, setText] = useState("");
  const mw = norm(text).split(/[^a-z0-9]+/).filter(Boolean);
  const hit = text.trim() ? gatilhos.find((g) => g.trim() && triggerMatches(g, mw)) : undefined;
  return (
    <div className="probe inline">
      <label htmlFor="rule-probe">Testar só esta resposta</label>
      <input id="rule-probe" type="text" placeholder="Digite uma frase de cliente" value={text} onChange={(e) => setText(e.target.value)} />
      {text.trim() && <p className="probe-res">{hit ? <>Casa pelo gatilho “{hit}”.</> : "Não casa com nenhum gatilho desta resposta."}</p>}
    </div>
  );
}

// ---------------- Base de conhecimento ----------------

function KbTab({ cfg, setCfg }: { cfg: AdminConfig; setCfg: React.Dispatch<React.SetStateAction<AdminConfig>> }) {
  const [sel, setSel] = useState<string | null>(cfg.kb[0]?.id ?? null);
  const [q, setQ] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const idx = cfg.kb.findIndex((d) => d.id === sel);
  const doc = idx >= 0 ? cfg.kb[idx] : null;
  const usedBy = doc ? cfg.rules.filter((r) => r.fonte === doc.id).map((r) => r.nome) : [];

  const shown = cfg.kb.filter((d) => {
    const nq = norm(q.trim());
    return !nq || norm(`${d.id} ${d.keys} ${d.text}`).includes(nq);
  });

  function update(patch: Partial<KbEntry>) {
    if (idx < 0) return;
    const oldId = cfg.kb[idx].id;
    setCfg((c) => ({
      ...c,
      kb: c.kb.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
      // Se o identificador mudar, as respostas prontas que apontam para ele acompanham.
      rules: patch.id !== undefined ? c.rules.map((r) => (r.fonte === oldId ? { ...r, fonte: patch.id! } : r)) : c.rules,
    }));
    if (patch.id !== undefined) setSel(patch.id);
  }

  function add() {
    const id = uniqueId("novo-trecho", new Set(cfg.kb.map((d) => d.id)));
    const d: KbEntry = { id, produto: "geral", keys: "", text: "", ativo: true };
    setCfg((c) => ({ ...c, kb: [d, ...c.kb] }));
    setSel(id);
    setQ("");
  }

  function remove() {
    if (!doc) return;
    setCfg((c) => ({
      ...c,
      kb: c.kb.filter((_, i) => i !== idx),
      rules: c.rules.map((r) => (r.fonte === doc.id ? { ...r, fonte: "" } : r)),
    }));
    setSel(cfg.kb[idx + 1]?.id ?? cfg.kb[idx - 1]?.id ?? null);
    setConfirmDel(false);
  }

  return (
    <div className="split">
      <aside className="list card">
        <div className="list-head">
          <h2>Base de conhecimento</h2>
          <button className="btn small" type="button" onClick={add}>+ Novo trecho</button>
        </div>
        <p className="hint">O LLM só responde com o que estiver aqui. Trechos desativados ficam fora das respostas.</p>
        <input className="search" type="search" placeholder="Buscar na base" aria-label="Buscar na base" value={q} onChange={(e) => setQ(e.target.value)} />
        <ol className="items">
          {shown.map((d) => (
            <li key={d.id}>
              <button type="button" className={`item${d.id === sel ? " on" : ""}${d.ativo ? "" : " off"}`} onClick={() => { setSel(d.id); setConfirmDel(false); }}>
                <span className="item-main">
                  <span className="item-title mono">{d.id}</span>
                  <span className="item-sub">
                    <span className="pill">{d.produto}</span>
                    {!d.ativo && <span className="muted">desativado</span>}
                    {!d.text.trim() && <span className="warn-text">sem texto</span>}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {!shown.length && <li className="empty">Nada encontrado.</li>}
        </ol>
      </aside>

      {doc ? (
        <section className="editor card" aria-label="Editar trecho da base">
          <div className="editor-head"><h2 className="mono">{doc.id}</h2></div>
          <div className="fields two">
            <label className="field">
              <span>Identificador</span>
              <input id="kb-id" type="text" value={doc.id} maxLength={60} onChange={(e) => update({ id: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} />
            </label>
            <label className="field">
              <span>Produto</span>
              <select id="kb-produto" value={doc.produto} onChange={(e) => update({ produto: e.target.value })}>
                {PRODUTOS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
          </div>
          <label className="field">
            <span>Texto oficial</span>
            <textarea id="kb-text" rows={9} value={doc.text} maxLength={2500} onChange={(e) => update({ text: e.target.value })} />
            <small>{doc.text.length}/2500 caracteres. Escreva fatos completos e verificados: o LLM não acrescenta nada além disto.</small>
          </label>
          <label className="field">
            <span>Palavras-chave para a busca</span>
            <input id="kb-keys" type="text" value={doc.keys} maxLength={600} onChange={(e) => update({ keys: e.target.value })} />
            <small>Palavras que os clientes usam ao perguntar sobre este assunto, separadas por espaço (sem acento). Ajudam o trecho a ser encontrado.</small>
          </label>
          <label className="field">
            <span>Link da fonte (opcional)</span>
            <input id="kb-url" type="url" placeholder="https://rldocs.realleader.com/..." value={doc.url ?? ""} maxLength={300} onChange={(e) => update({ url: e.target.value || undefined })} />
            <small>Página oficial de onde o texto foi tirado. Ajuda a equipe a revisar a base.</small>
          </label>
          <label className="check">
            <input type="checkbox" checked={doc.ativo} onChange={(e) => update({ ativo: e.target.checked })} /> Ativo
          </label>
          {usedBy.length > 0 && <p className="hint">Usado como fonte por: {usedBy.join(", ")}.</p>}
          <div className="danger">
            {confirmDel ? (
              <>
                <span>Excluir “{doc.id}”?{usedBy.length ? " As respostas prontas que o usam ficam sem fonte." : ""} A exclusão só vale depois de Salvar.</span>
                <button className="btn danger-btn small" type="button" onClick={remove}>Excluir</button>
                <button className="btn small" type="button" onClick={() => setConfirmDel(false)}>Cancelar</button>
              </>
            ) : (
              <button className="btn ghost small" type="button" onClick={() => setConfirmDel(true)}>Excluir este trecho</button>
            )}
          </div>
        </section>
      ) : (
        <section className="editor card"><p className="empty">Selecione um trecho ou clique em “+ Novo trecho”.</p></section>
      )}
    </div>
  );
}

// ---------------- Casos para a equipe (encaminhamentos gravados no Supabase) ----------------

type Caso = { id: string; criado_em: string; categoria: string; produto: string; idioma: string; motivo: string; mensagem: string; status: "aberto" | "resolvido"; resolvido_em: string | null };

function CasosTab() {
  const [itens, setItens] = useState<Caso[] | null>(null);
  const [disponivel, setDisponivel] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<"aberto" | "resolvido" | "todos">("aberto");

  async function carregar() {
    setErro("");
    try {
      const r = await fetch("/api/admin/encaminhamentos", { cache: "no-store" });
      if (r.status === 401) { window.location.href = "/admin/login"; return; }
      const d = (await r.json()) as { disponivel?: boolean; itens?: Caso[]; error?: string };
      if (!r.ok) throw new Error(d.error || `Erro ${r.status}`);
      setDisponivel(d.disponivel !== false);
      setItens(d.itens ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível carregar.");
      setItens([]);
    }
  }
  useEffect(() => { carregar(); }, []);

  async function mudar(id: string, status: "aberto" | "resolvido") {
    setItens((xs) => xs?.map((x) => (x.id === id ? { ...x, status } : x)) ?? null);
    const r = await fetch("/api/admin/encaminhamentos", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (!r.ok) { setErro("Não foi possível atualizar o caso."); carregar(); }
  }

  if (!disponivel) {
    return <section className="card"><h2>Casos para a equipe</h2><p className="hint">Disponível quando o Supabase estiver conectado. Sem banco, os encaminhamentos aparecem só na tela do cliente.</p></section>;
  }
  const lista = (itens ?? []).filter((x) => filtro === "todos" || x.status === filtro);
  const abertos = (itens ?? []).filter((x) => x.status === "aberto").length;
  return (
    <section className="card">
      <div className="list-head">
        <h2>Casos para a equipe ({abertos} abertos)</h2>
        <div className="row-actions">
          {(["aberto", "resolvido", "todos"] as const).map((f) => (
            <button key={f} type="button" className={`btn small${filtro === f ? " primary" : ""}`} onClick={() => setFiltro(f)}>
              {f === "aberto" ? "Abertos" : f === "resolvido" ? "Resolvidos" : "Todos"}
            </button>
          ))}
          <button type="button" className="btn small ghost" onClick={carregar}>Atualizar</button>
        </div>
      </div>
      <p className="hint">Cada vez que o chat encaminha para humano, o caso aparece aqui com a categoria e um trecho da mensagem (até 300 caracteres; a conversa não é gravada).</p>
      {erro && <div className="banner error">{erro}</div>}
      {itens === null ? (
        <p className="empty">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="empty">Nenhum caso {filtro === "aberto" ? "aberto" : filtro === "resolvido" ? "resolvido" : ""}.</p>
      ) : (
        <div className="logwrap">
          <table>
            <thead><tr><th>Quando</th><th>Categoria</th><th>Mensagem do cliente</th><th>Motivo</th><th></th></tr></thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <td className="n">{new Date(c.criado_em).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td><span className="pill">{c.categoria}</span>{c.produto && c.produto !== "—" ? <> <span className="pill">{c.produto}</span></> : null} <span className="pill">{c.idioma}</span></td>
                  <td className="m">{c.mensagem}</td>
                  <td className="m muted">{c.motivo}</td>
                  <td>
                    {c.status === "aberto"
                      ? <button type="button" className="btn small" onClick={() => mudar(c.id, "resolvido")}>Marcar resolvido</button>
                      : <button type="button" className="btn small ghost" onClick={() => mudar(c.id, "aberto")}>Reabrir</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------- Encaminhamento ----------------

function RoutingTab({
  cfg, setCfg, confirmReset, setConfirmReset, onReset, busy,
}: {
  cfg: AdminConfig;
  setCfg: React.Dispatch<React.SetStateAction<AdminConfig>>;
  confirmReset: boolean;
  setConfirmReset: (v: boolean) => void;
  onReset: () => void;
  busy: boolean;
}) {
  const on = new Set(cfg.humanTypes);
  function toggle(id: string, checked: boolean) {
    setCfg((c) => ({ ...c, humanTypes: checked ? [...c.humanTypes.filter((t) => t !== id), id] : c.humanTypes.filter((t) => t !== id) }));
  }
  return (
    <div className="stack">
      <section className="card">
        <h2>Tipos que vão direto para humano</h2>
        <p className="hint">Quando a classificação (Camada 2) identificar um destes tipos, o chat não tenta responder e encaminha para a equipe.</p>
        <div className="checks">
          {TIPOS.map((t) => (
            <label key={t.id} className="check">
              <input type="checkbox" checked={on.has(t.id)} onChange={(e) => toggle(t.id, e.target.checked)} /> {t.label}
            </label>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Confiança mínima do LLM</h2>
        <p className="hint">Abaixo deste valor, a resposta do LLM não é enviada e o caso vai para humano. Valores altos são mais seguros, mas encaminham mais.</p>
        <div className="range-row">
          <input
            id="threshold"
            type="range"
            min={0.3}
            max={0.95}
            step={0.05}
            value={cfg.threshold}
            onChange={(e) => setCfg((c) => ({ ...c, threshold: Number(e.target.value) }))}
            aria-label="Confiança mínima"
          />
          <output htmlFor="threshold" className="range-val">{cfg.threshold.toFixed(2)}</output>
        </div>
      </section>

      <section className="card">
        <h2>Restaurar o padrão</h2>
        <p className="hint">Apaga todas as edições salvas e volta à configuração original do projeto (respostas prontas, base e encaminhamento).</p>
        {confirmReset ? (
          <div className="danger">
            <span>Tem certeza? Isso não pode ser desfeito.</span>
            <button className="btn danger-btn small" type="button" onClick={onReset} disabled={busy}>Restaurar padrão</button>
            <button className="btn small" type="button" onClick={() => setConfirmReset(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn ghost" type="button" onClick={() => setConfirmReset(true)}>Restaurar o padrão…</button>
        )}
      </section>
    </div>
  );
}
