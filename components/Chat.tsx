"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatResult, Layer, Turn } from "@/lib/types";

export const LAYER: Record<Layer, { cls: string; label: string }> = {
  1: { cls: "t1", label: "Regras" },
  2: { cls: "t2", label: "Classificação" },
  3: { cls: "t3", label: "LLM com fontes" },
  4: { cls: "t4", label: "Humano" },
};

const SAMPLES = [
  "Os créditos vencem?",
  "Regenerar a matéria gasta crédito?",
  "Comprei créditos mês passado e meu saldo zerou sem eu gerar nada",
  "O teste de conexão com o WordPress fica vermelho",
  "Dá pra usar o RLTV com NDI?",
  "Por que a classificação de vocês é diferente da tabela oficial?",
  "Quero reembolso do pacote que comprei ontem",
  "Somos um portal em Portugal e queremos usar os dados de vocês",
  "How long are my credits valid?",
  "La nota salió con el marcador equivocado",
  "Quanto custa o pacote de 500?",
];

type Bubble =
  | { role: "user"; text: string }
  | { role: "bot"; text: string; layer?: Layer; meta?: string; handoff?: string; thinking?: boolean };

const WELCOME =
  "Olá! Sou o assistente virtual do RealLeader. Posso ajudar com créditos do RLPRESS, integração com WordPress, RLTV, assinatura e dúvidas sobre o método. Casos de reembolso, erros nos dados e parcerias eu encaminho para a equipe.";

export default function Chat({
  embedded = false,
  onResult,
}: {
  embedded?: boolean;
  onResult?: (message: string, result: ChatResult) => void;
}) {
  const [bubbles, setBubbles] = useState<Bubble[]>([{ role: "bot", text: WELCOME }]);
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [llm, setLlm] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/chat").then((r) => r.json()).then((d: { llm?: boolean }) => setLlm(Boolean(d.llm))).catch(() => setLlm(false));
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [bubbles]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setInput("");
    setBubbles((b) => [...b, { role: "user", text: message }, { role: "bot", text: "Analisando…", thinking: true }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = (await res.json()) as ChatResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error || `Erro ${res.status}`);
      setBubbles((b) => [...b.slice(0, -1), { role: "bot", text: data.reply, layer: data.layer, meta: data.meta, handoff: data.handoff }]);
      setHistory((h) => [...h, { role: "user" as const, content: message }, { role: "assistant" as const, content: data.reply }].slice(-6));
      setLlm(data.llm);
      onResult?.(message, data);
    } catch (e) {
      const why = e instanceof Error ? e.message : "erro desconhecido";
      setBubbles((b) => [...b.slice(0, -1), { role: "bot", text: `Não consegui responder agora (${why}). Tente de novo em instantes.` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`widget${embedded ? " embedded" : ""}`} aria-label="Widget de atendimento">
      <div className="w-head">
        <div>
          <div className="w-title">Suporte RealLeader</div>
          <div className="w-sub">Assistente virtual · protótipo</div>
        </div>
        <span className="llm-pill">{llm === null ? "LLM: verificando…" : llm ? "LLM: ativo" : "LLM: só regras"}</span>
      </div>

      <div className="msgs" ref={listRef} aria-live="polite">
        {bubbles.map((b, i) =>
          b.role === "user" ? (
            <div key={i} className="msg user">{b.text}</div>
          ) : (
            <div key={i} className="msg bot">
              <div className={b.thinking ? "thinking" : undefined}>{b.text}</div>
              {(b.layer || b.meta) && (
                <div className="meta">
                  {b.layer && <span className={`tag ${LAYER[b.layer].cls}`}>{LAYER[b.layer].label}</span>}
                  {b.meta && <span>{b.meta}</span>}
                </div>
              )}
              {b.handoff && <div className="handoff">{b.handoff}</div>}
            </div>
          ),
        )}
      </div>

      <div className="chips" aria-label="Mensagens de exemplo">
        {SAMPLES.map((s) => (
          <button key={s} type="button" className="chip" disabled={busy} onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <form className="compose" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <label htmlFor="q" className="sr-only">Sua mensagem</label>
        <input id="q" autoComplete="off" placeholder="Escreva sua dúvida…" maxLength={600} value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="send" type="submit" disabled={busy || !input.trim()}>Enviar</button>
      </form>
    </section>
  );
}
