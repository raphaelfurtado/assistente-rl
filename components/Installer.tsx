"use client";

import { useEffect, useState } from "react";

function CopyBlock({ id, label, code }: { id: string; label: string; code: string }) {
  const [state, setState] = useState<"idle" | "ok" | "fail">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setState("ok");
    } catch {
      const el = document.getElementById(id);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      setState("fail");
    }
    setTimeout(() => setState("idle"), 2500);
  }
  return (
    <div className="code-wrap">
      <div className="code-head">
        <span>{label}</span>
        <button type="button" className="copy" onClick={copy}>
          {state === "ok" ? "Copiado" : state === "fail" ? "Selecionado: use Ctrl+C" : "Copiar"}
        </button>
      </div>
      <pre id={id} className="code">{code}</pre>
    </div>
  );
}

export default function Installer() {
  const [origin, setOrigin] = useState("https://assistente-rl.vercel.app");
  const [color, setColor] = useState("#1A7748");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [greeting, setGreeting] = useState("Precisa de ajuda? Fale com o suporte.");

  useEffect(() => setOrigin(window.location.origin), []);

  const attrs = [
    color.toLowerCase() !== "#1a7748" ? ` data-color="${color}"` : "",
    position === "left" ? ` data-position="left"` : "",
    greeting !== "Precisa de ajuda? Fale com o suporte." ? ` data-greeting="${greeting.replace(/"/g, "&quot;")}"` : "",
  ].join("");
  const scriptTag = `<script src="${origin}/widget.js"${attrs} defer></script>`;
  const directLink = `${origin}/widget`;
  const iframeTag = `<iframe src="${origin}/widget" title="Suporte" style="width:100%;max-width:420px;height:640px;border:0;border-radius:16px"></iframe>`;
  const apiExample = `<button onclick="RLWidget.open()">Falar com o suporte</button>`;

  return (
    <div className="install">
      <section className="card">
        <h2>1. Botão flutuante (recomendado)</h2>
        <p className="hint">Cole uma linha antes de <code>&lt;/body&gt;</code> em qualquer site: HTML, WordPress (em Aparência → Editor de temas ou com um plugin de cabeçalho e rodapé), Wix, Shopify. O chat só carrega quando o visitante clica.</p>

        <div className="opts">
          <label className="opt">
            <span>Cor do botão</span>
            <span className="color-row">
              <input id="opt-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} />
              <code>{color}</code>
            </span>
          </label>
          <label className="opt">
            <span>Posição</span>
            <select id="opt-pos" value={position} onChange={(e) => setPosition(e.target.value as "right" | "left")}>
              <option value="right">Canto direito</option>
              <option value="left">Canto esquerdo</option>
            </select>
          </label>
          <label className="opt opt-wide">
            <span>Convite ao lado do botão (deixe vazio para desligar)</span>
            <input id="opt-greet" type="text" value={greeting} maxLength={80} onChange={(e) => setGreeting(e.target.value)} />
          </label>
        </div>

        <CopyBlock id="code-script" label="Código para colar no site" code={scriptTag} />
        <p className="hint">Para abrir o chat a partir de um botão ou link do próprio site:</p>
        <CopyBlock id="code-api" label="Abrir o chat por um botão do site" code={apiExample} />
        <p className="hint">Veja funcionando: <a href="/exemplo-site.html">site de exemplo com o widget instalado</a>.</p>
      </section>

      <section className="card">
        <h2>2. Link direto</h2>
        <p className="hint">Abre o chat numa página própria. Serve para colocar no WhatsApp, no e-mail de suporte, na bio do Instagram ou num QR code.</p>
        <CopyBlock id="code-link" label="Link do chat" code={directLink} />
      </section>

      <section className="card">
        <h2>3. Chat dentro da página</h2>
        <p className="hint">Mostra o chat fixo dentro de uma página, por exemplo na página &quot;Ajuda&quot; ou &quot;Contato&quot;.</p>
        <CopyBlock id="code-iframe" label="Código do iframe" code={iframeTag} />
      </section>

      <p className="foot">
        Em produção, defina a variável <code>WIDGET_ALLOWED_ORIGINS</code> na Vercel com os domínios do cliente, para que só esses sites possam embutir o chat.
      </p>
    </div>
  );
}
