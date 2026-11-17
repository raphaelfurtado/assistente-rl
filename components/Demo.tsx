"use client";

import { useState } from "react";
import Chat, { LAYER } from "./Chat";
import { KB } from "@/lib/kb";
import type { ChatResult, Layer } from "@/lib/types";

type LogRow = { n: number; message: string; layer: Layer; ms: number };

const PREMISSA: [Layer, string, number][] = [
  [1, "Regras", 35],
  [3, "LLM", 40],
  [4, "Humano", 25],
];

export default function Demo() {
  const [last, setLast] = useState<{ message: string; result: ChatResult } | null>(null);
  const [log, setLog] = useState<LogRow[]>([]);

  function onResult(message: string, result: ChatResult) {
    setLast({ message, result });
    setLog((l) => [...l, { n: l.length + 1, message, layer: result.layer, ms: result.ms }]);
  }

  const total = log.length;
  const count = (k: Layer) => log.filter((r) => r.layer === k).length;

  return (
    <div className="grid">
      <Chat onResult={onResult} />

      <div className="panel">
        <section className="card" aria-labelledby="trace-h">
          <h2 id="trace-h">Como a última mensagem foi tratada</h2>
          <p className="hint">Cada etapa mostra a decisão tomada. Camadas puladas aparecem tracejadas.</p>
          {last ? (
            <>
              <p className="quote">“{last.message}”</p>
              <ol className="trace">
                {last.result.steps.map((s, i) => (
                  <li key={i}>
                    <div className={`node ${LAYER[s.layer].cls}${s.skip ? " skip" : ""}`}>{s.layer}</div>
                    <div>
                      <div className="step-title">
                        {LAYER[s.layer].label} <span className="res">· {s.result}</span>
                      </div>
                      {s.kv.length > 0 && (
                        <div className="kv">
                          {s.kv.map(([k, v]) => (
                            <span key={k} style={{ display: "contents" }}>
                              <span>{k}</span>
                              <b>{v}</b>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="empty">Envie uma mensagem ou clique num exemplo abaixo do chat para ver o caminho dela pelas camadas.</p>
          )}
        </section>

        <section className="card" aria-labelledby="dist-h">
          <h2 id="dist-h">Distribuição nesta sessão</h2>
          <p className="hint">Onde cada mensagem terminou, comparado com a premissa do documento (35% regras, 40% LLM, 25% humano).</p>
          <div className="bars">
            {PREMISSA.map(([k, label, prem]) => {
              const c = count(k);
              const pct = total ? Math.round((c / total) * 100) : 0;
              return (
                <div className="bar-row" key={k}>
                  <span style={{ color: `var(--c${k})`, fontWeight: 600 }}>{label}</span>
                  <div className="track">
                    <div className="fill" style={{ width: `${pct}%`, background: `var(--c${k})` }} />
                    <div className="mark" style={{ left: `${prem}%` }} title={`Premissa: ${prem}%`} />
                  </div>
                  <span className="nums">{c} · {pct}% (prem. {prem}%)</span>
                </div>
              );
            })}
          </div>
          <div className="legend"><i /> premissa do documento</div>
        </section>

        <section className="card" aria-labelledby="log-h">
          <h2 id="log-h">Registro de mensagens</h2>
          {log.length ? (
            <div className="logwrap">
              <table>
                <thead><tr><th>#</th><th>Mensagem</th><th>Terminou em</th><th>Tempo</th></tr></thead>
                <tbody>
                  {[...log].reverse().map((r) => (
                    <tr key={r.n}>
                      <td className="n">{r.n}</td>
                      <td className="m">{r.message}</td>
                      <td><span className={`tag ${LAYER[r.layer].cls}`}>{LAYER[r.layer].label}</span></td>
                      <td className="n">{r.ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty">Nenhuma mensagem ainda.</p>
          )}
          <details>
            <summary>Base de conhecimento usada (fontes autorizadas)</summary>
            <div className="kb">
              {KB.map((d) => (
                <div key={d.id}><code>{d.id}</code> — {d.text}</div>
              ))}
            </div>
          </details>
        </section>

        <p className="foot">
          A Camada 2 e a Camada 3 usam a API da OpenAI no servidor. Sem a chave configurada, o assistente responde só com regras e
          encaminha o resto para humano.
        </p>
      </div>
    </div>
  );
}
