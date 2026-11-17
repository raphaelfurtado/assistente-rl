/*
 * Widget de suporte — cole no site com uma linha, antes de </body>:
 *   <script src="https://assistente-rl.vercel.app/widget.js" defer></script>
 *
 * Opções (atributos no <script>):
 *   data-color="#1A7748"            cor do botão
 *   data-position="right" | "left"  canto da tela
 *   data-greeting="Precisa de ajuda?"  convite exibido ao lado do botão ("" desliga)
 *   data-open="true"                abre o chat ao carregar a página
 *
 * API para o site: window.RLWidget.open(), .close(), .toggle()
 */
(function () {
  if (window.RLWidget) return;

  var script = document.currentScript;
  var attr = function (name, fallback) {
    var v = script && script.getAttribute(name);
    return v === null || v === undefined ? fallback : v;
  };
  var base = new URL(script ? script.src : "/widget.js", location.href).origin;
  var color = attr("data-color", "#1A7748");
  var side = attr("data-position", "right") === "left" ? "left" : "right";
  var greeting = attr("data-greeting", "Precisa de ajuda? Fale com o suporte.");
  var startOpen = attr("data-open", "false") === "true";

  var css =
    ".rlw-btn{position:fixed;bottom:20px;" + side + ":20px;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;" +
    "background:" + color + ";box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2147483646;display:grid;place-items:center;" +
    "transition:transform .15s ease}" +
    ".rlw-btn:hover{transform:scale(1.06)}" +
    ".rlw-btn:focus-visible{outline:3px solid " + color + ";outline-offset:3px}" +
    ".rlw-frame{position:fixed;bottom:90px;" + side + ":20px;width:380px;height:620px;max-width:calc(100vw - 40px);" +
    "max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.28);" +
    "z-index:2147483647;background:#fff;display:none}" +
    ".rlw-open .rlw-frame{display:block}" +
    ".rlw-tease{position:fixed;bottom:32px;" + side + ":90px;max-width:240px;padding:10px 14px;border-radius:14px;" +
    "background:#fff;color:#15201A;font:14px/1.4 system-ui,-apple-system,'Segoe UI',sans-serif;" +
    "box-shadow:0 8px 24px rgba(0,0,0,.18);z-index:2147483646;cursor:pointer;display:none}" +
    ".rlw-tease.show{display:block}" +
    ".rlw-open .rlw-tease{display:none}" +
    ".rlw-tease-x{margin-left:8px;border:0;background:none;color:#5A6A61;cursor:pointer;font-size:16px;line-height:1}" +
    "@media (max-width:480px){.rlw-frame{inset:0;width:100%;height:100%;max-width:none;max-height:none;border-radius:0}" +
    ".rlw-open .rlw-btn{display:none}}" +
    "@media (prefers-reduced-motion:reduce){.rlw-btn{transition:none}}";

  var ICON_CHAT =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>';
  var ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>';

  var root, btn, frame, tease, loaded = false, open = false;

  function seenTease() {
    try { return sessionStorage.getItem("rlw-tease") === "1"; } catch (e) { return false; }
  }
  function markTease() {
    try { sessionStorage.setItem("rlw-tease", "1"); } catch (e) {}
  }

  function setOpen(next) {
    var wasOpen = open;
    open = next;
    if (open && !loaded) { frame.src = base + "/widget"; loaded = true; }
    root.classList.toggle("rlw-open", open);
    btn.innerHTML = open ? ICON_CLOSE : ICON_CHAT;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Fechar suporte" : "Abrir suporte");
    if (open) { tease.classList.remove("show"); markTease(); }
    else if (wasOpen) btn.focus();
  }

  function mount() {
    var style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    root = document.createElement("div");
    root.className = "rlw-root";

    frame = document.createElement("iframe");
    frame.className = "rlw-frame";
    frame.title = "Suporte";
    frame.setAttribute("allow", "clipboard-write");

    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "rlw-btn";
    btn.addEventListener("click", function () { setOpen(!open); });

    tease = document.createElement("div");
    tease.className = "rlw-tease";
    tease.setAttribute("role", "button");
    tease.tabIndex = 0;
    tease.textContent = greeting;
    var x = document.createElement("button");
    x.type = "button";
    x.className = "rlw-tease-x";
    x.setAttribute("aria-label", "Dispensar");
    x.textContent = "×";
    x.addEventListener("click", function (e) { e.stopPropagation(); tease.classList.remove("show"); markTease(); });
    tease.appendChild(x);
    tease.addEventListener("click", function () { setOpen(true); });
    tease.addEventListener("keydown", function (e) { if (e.key === "Enter") setOpen(true); });

    root.appendChild(frame);
    root.appendChild(tease);
    root.appendChild(btn);
    document.body.appendChild(root);
    setOpen(false);

    // O botão "fechar" dentro do chat avisa a página por postMessage.
    window.addEventListener("message", function (e) {
      if (e.origin === base && e.data && e.data.type === "rl-widget-close") setOpen(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });

    if (startOpen) setOpen(true);
    else if (greeting && !seenTease()) setTimeout(function () { if (!open) tease.classList.add("show"); }, 2500);
  }

  window.RLWidget = {
    open: function () { setOpen(true); },
    close: function () { setOpen(false); },
    toggle: function () { setOpen(!open); },
  };

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
