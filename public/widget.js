/*
 * Widget de suporte — cole no site com uma linha:
 *   <script src="https://SEU-PROJETO.vercel.app/widget.js" defer></script>
 * Opcional: data-color="#1A7748" data-position="left"
 */
(function () {
  if (window.__rlWidgetLoaded) return;
  window.__rlWidgetLoaded = true;

  var script = document.currentScript;
  var base = new URL(script ? script.src : "/widget.js", location.href).origin;
  var color = (script && script.getAttribute("data-color")) || "#1A7748";
  var left = script && script.getAttribute("data-position") === "left";
  var side = left ? "left" : "right";

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Abrir suporte");
  btn.setAttribute("aria-expanded", "false");
  btn.innerHTML =
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" stroke="white" stroke-width="2" stroke-linejoin="round"/></svg>';
  btn.style.cssText =
    "position:fixed;bottom:20px;" + side + ":20px;width:58px;height:58px;border-radius:50%;border:0;cursor:pointer;" +
    "background:" + color + ";box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2147483646;display:grid;place-items:center;";

  var frame = document.createElement("iframe");
  frame.src = base + "/widget";
  frame.title = "Suporte RealLeader";
  frame.style.cssText =
    "position:fixed;bottom:90px;" + side + ":20px;width:380px;height:600px;max-width:calc(100vw - 40px);" +
    "max-height:calc(100vh - 110px);border:0;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);" +
    "z-index:2147483647;display:none;background:#fff;";

  btn.addEventListener("click", function () {
    var open = frame.style.display === "none";
    frame.style.display = open ? "block" : "none";
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Fechar suporte" : "Abrir suporte");
  });

  document.body.appendChild(frame);
  document.body.appendChild(btn);
})();
