// Gráficos SVG estáticos para o relatório (abrem no VS Code, GitHub e em PDF).
// Paleta de referência: superfície #fcfcfb, tinta #0b0b0b/#52514e, rampa azul sequencial,
// cores de status só para nível de risco (sempre acompanhadas de rótulo).

const C = {
  surface: "#fcfcfb", ink: "#0b0b0b", ink2: "#52514e", muted: "#898781",
  grid: "#e1e0d9", axis: "#c3c2b7", series: "#2a78d6", dim: "#b7d3f6", neutral: "#f0efec",
  ramp: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#104281"],
  status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
};
const FONT = `font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function frame(w, h, title, subtitle, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(title)}" ${FONT}>
<rect width="${w}" height="${h}" fill="${C.surface}"/>
<text x="24" y="34" font-size="17" font-weight="600" fill="${C.ink}">${esc(title)}</text>
${subtitle ? `<text x="24" y="56" font-size="13" fill="${C.ink2}">${esc(subtitle)}</text>` : ""}
${body}
</svg>`;
}

// Escala sequencial (0..1) → passo da rampa azul; texto branco nos passos escuros.
function rampColor(t) {
  const i = Math.max(0, Math.min(C.ramp.length - 1, Math.round(t * (C.ramp.length - 1))));
  return { fill: C.ramp[i], text: i >= 3 ? "#ffffff" : C.ink };
}

// 1. Barras horizontais ordenadas (uma série). Destaque: a barra recomendada em azul cheio, as demais em azul claro.
export function barrasHorizontais({ titulo, subtitulo, linhas, max = 100, formato = (v) => v.toFixed(0), rotuloEixo }) {
  const w = 760, left = 190, right = 70, top = 80, rowH = 40, barH = 22;
  const h = top + linhas.length * rowH + 44;
  const x = (v) => left + (v / max) * (w - left - right);
  let body = "";
  for (const t of [0, 25, 50, 75, 100].filter((t) => t <= max)) {
    body += `<line x1="${x(t)}" x2="${x(t)}" y1="${top - 8}" y2="${top + linhas.length * rowH}" stroke="${C.grid}" stroke-width="1"/>`;
    body += `<text x="${x(t)}" y="${top + linhas.length * rowH + 18}" font-size="11.5" fill="${C.muted}" text-anchor="middle">${t}</text>`;
  }
  linhas.forEach((l, i) => {
    const y = top + i * rowH + (rowH - barH) / 2;
    const cor = l.destaque ? C.series : C.dim;
    const bw = Math.max(2, x(l.valor) - left);
    body += `<text x="${left - 12}" y="${y + barH / 2 + 4.5}" font-size="13" fill="${C.ink}" text-anchor="end" font-weight="${l.destaque ? 600 : 400}">${esc(l.rotulo)}</text>`;
    body += `<path d="M${left} ${y} h${bw - 4} a4 4 0 0 1 4 4 v${barH - 8} a4 4 0 0 1 -4 4 h-${bw - 4} z" fill="${cor}"><title>${esc(l.rotulo)}: ${formato(l.valor)}</title></path>`;
    body += `<text x="${left + bw + 8}" y="${y + barH / 2 + 4.5}" font-size="13" fill="${C.ink}" font-weight="${l.destaque ? 600 : 400}">${formato(l.valor)}</text>`;
  });
  body += `<line x1="${left}" x2="${left}" y1="${top - 8}" y2="${top + linhas.length * rowH}" stroke="${C.axis}" stroke-width="1"/>`;
  if (rotuloEixo) body += `<text x="${(left + w - right) / 2}" y="${h - 8}" font-size="11.5" fill="${C.muted}" text-anchor="middle">${esc(rotuloEixo)}</text>`;
  return frame(w, h, titulo, subtitulo, body);
}

// 2. Mapa de calor com valor escrito em cada célula.
export function mapaDeCalor({ titulo, subtitulo, linhas, colunas, valor, texto, max, legenda, larguraRotulo = 300, larguraCelula = 72 }) {
  const cellW = larguraCelula, cellH = 30, left = larguraRotulo, top = 104;
  const w = left + colunas.length * cellW + 24, h = top + linhas.length * cellH + 64;
  let body = "";
  colunas.forEach((c, j) => {
    body += `<text x="${left + j * cellW + cellW / 2}" y="${top - 26}" font-size="12.5" font-weight="600" fill="${C.ink}" text-anchor="middle">${esc(c.titulo)}</text>`;
    if (c.sub) body += `<text x="${left + j * cellW + cellW / 2}" y="${top - 11}" font-size="11" fill="${C.ink2}" text-anchor="middle">${esc(c.sub)}</text>`;
  });
  linhas.forEach((l, i) => {
    const y = top + i * cellH;
    body += `<text x="${left - 10}" y="${y + cellH / 2 + 4.5}" font-size="12.5" fill="${C.ink}" text-anchor="end">${esc(l.rotulo)}</text>`;
    colunas.forEach((c, j) => {
      const v = valor(l, c);
      const { fill, text } = v === null ? { fill: C.neutral, text: C.muted } : rampColor(v / max);
      const xx = left + j * cellW;
      body += `<rect x="${xx + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${fill}"><title>${esc(l.rotulo)} · ${esc(c.titulo)}: ${esc(texto(l, c))}</title></rect>`;
      body += `<text x="${xx + cellW / 2}" y="${y + cellH / 2 + 4.5}" font-size="12.5" fill="${text}" text-anchor="middle">${esc(texto(l, c))}</text>`;
    });
  });
  if (legenda) {
    const ly = top + linhas.length * cellH + 26;
    body += `<text x="${left}" y="${ly + 11}" font-size="11.5" fill="${C.ink2}">${esc(legenda.menor)}</text>`;
    C.ramp.forEach((col, k) => { body += `<rect x="${left + 90 + k * 26}" y="${ly}" width="24" height="14" rx="2" fill="${col}"/>`; });
    body += `<text x="${left + 90 + C.ramp.length * 26 + 8}" y="${ly + 11}" font-size="11.5" fill="${C.ink2}">${esc(legenda.maior)}</text>`;
  }
  return frame(w, h, titulo, subtitulo, body);
}

// 3. Dispersão custo × qualidade, com rótulo direto em cada ponto (uma série; a identidade vem do rótulo).
export function dispersao({ titulo, subtitulo, pontos, xMax, rotuloX, rotuloY, formatoX = (v) => v }) {
  const w = 760, h = 440, left = 72, right = 40, top = 80, bottom = 64;
  const X = (v) => left + (v / xMax) * (w - left - right);
  const Y = (v) => top + (1 - v / 100) * (h - top - bottom);
  let body = "";
  for (const t of [0, 25, 50, 75, 100]) {
    body += `<line x1="${left}" x2="${w - right}" y1="${Y(t)}" y2="${Y(t)}" stroke="${C.grid}"/>`;
    body += `<text x="${left - 10}" y="${Y(t) + 4}" font-size="11.5" fill="${C.muted}" text-anchor="end">${t}%</text>`;
  }
  const stepX = xMax / 4;
  for (let k = 0; k <= 4; k++) {
    const v = k * stepX;
    body += `<text x="${X(v)}" y="${h - bottom + 20}" font-size="11.5" fill="${C.muted}" text-anchor="middle">${formatoX(v)}</text>`;
  }
  body += `<line x1="${left}" x2="${w - right}" y1="${Y(0)}" y2="${Y(0)}" stroke="${C.axis}"/>`;
  body += `<text x="${(left + w - right) / 2}" y="${h - 14}" font-size="12" fill="${C.ink2}" text-anchor="middle">${esc(rotuloX)}</text>`;
  body += `<text transform="translate(18 ${(top + h - bottom) / 2}) rotate(-90)" font-size="12" fill="${C.ink2}" text-anchor="middle">${esc(rotuloY)}</text>`;
  // Pontos agrupados (próximos demais para rótulo ao lado) recebem rótulos em coluna, com linha de chamada.
  const grupo = pontos.filter((p) => !p.destaque);
  const colX = Math.max(...grupo.map((p) => X(p.x))) + 70;
  const ordem = [...grupo].sort((a, b) => b.y - a.y);
  const centro = ordem.reduce((a, p) => a + Y(p.y), 0) / (ordem.length || 1);
  const passo = 21;
  ordem.forEach((p, k) => { p._ly = centro + (k - (ordem.length - 1) / 2) * passo; });
  for (const p of pontos) {
    const cx = X(p.x), cy = Y(p.y);
    if (!p.destaque) {
      body += `<path d="M${cx + 6} ${cy} L${colX - 34} ${p._ly} H${colX - 6}" fill="none" stroke="${C.axis}" stroke-width="1"/>`;
      body += `<text x="${colX}" y="${p._ly + 4.5}" font-size="12.5" fill="${C.ink}">${esc(p.rotulo)} <tspan fill="${C.ink2}">· ${p.y.toFixed(0)}%</tspan></text>`;
    }
  }
  for (const p of pontos) {
    const cx = X(p.x), cy = Y(p.y);
    body += `<circle cx="${cx}" cy="${cy}" r="${p.destaque ? 8 : 6}" fill="${p.destaque ? C.series : C.dim}" stroke="${C.surface}" stroke-width="2"><title>${esc(p.rotulo)}: ${formatoX(p.x)} · ${p.y.toFixed(0)}%</title></circle>`;
    if (p.destaque) {
      const anchor = cx > w - 200 ? "end" : "start";
      const dx = anchor === "end" ? -14 : 14;
      body += `<text x="${cx + dx}" y="${cy + 4.5}" font-size="12.5" fill="${C.ink}" text-anchor="${anchor}" font-weight="600">${esc(p.rotulo)} <tspan font-weight="400" fill="${C.ink2}">· ${p.y.toFixed(0)}%</tspan></text>`;
    }
  }
  return frame(w, h, titulo, subtitulo, body);
}

// 4. Matriz de riscos probabilidade × impacto (5×5). Faixas com cor de status + rótulo; riscos como marcadores numerados.
export function matrizDeRiscos({ titulo, subtitulo, riscos }) {
  const cell = 92, left = 120, top = 96, n = 5;
  const w = left + n * cell + 300, h = top + n * cell + 70;
  const nivel = (s) => (s >= 15 ? "critical" : s >= 10 ? "serious" : s >= 5 ? "warning" : "good");
  const nomeNivel = { good: "Baixo (1–4)", warning: "Médio (5–9)", serious: "Alto (10–14)", critical: "Crítico (15–25)" };
  let body = "";
  for (let p = 1; p <= n; p++) {
    for (let i = 1; i <= n; i++) {
      const x = left + (p - 1) * cell, y = top + (n - i) * cell;
      body += `<rect x="${x + 1}" y="${y + 1}" width="${cell - 2}" height="${cell - 2}" rx="3" fill="${C.status[nivel(p * i)]}" fill-opacity="0.16"/>`;
    }
  }
  for (let k = 1; k <= n; k++) {
    body += `<text x="${left + (k - 0.5) * cell}" y="${top + n * cell + 20}" font-size="12" fill="${C.ink2}" text-anchor="middle">${k}</text>`;
    body += `<text x="${left - 12}" y="${top + (n - k + 0.5) * cell + 4}" font-size="12" fill="${C.ink2}" text-anchor="end">${k}</text>`;
  }
  body += `<text x="${left + (n * cell) / 2}" y="${top + n * cell + 44}" font-size="12.5" fill="${C.ink}" text-anchor="middle" font-weight="600">Probabilidade →</text>`;
  body += `<text transform="translate(${left - 46} ${top + (n * cell) / 2}) rotate(-90)" font-size="12.5" fill="${C.ink}" text-anchor="middle" font-weight="600">Impacto →</text>`;
  // agrupa riscos por célula
  const porCelula = {};
  for (const r of riscos) (porCelula[`${r.p}-${r.i}`] ||= []).push(r);
  for (const [k, lista] of Object.entries(porCelula)) {
    const [p, i] = k.split("-").map(Number);
    const x0 = left + (p - 1) * cell, y0 = top + (n - i) * cell;
    lista.forEach((r, idx) => {
      const col = idx % 3, row = Math.floor(idx / 3);
      const cx = x0 + 20 + col * 26, cy = y0 + 22 + row * 26;
      body += `<circle cx="${cx}" cy="${cy}" r="11" fill="${C.ink}"><title>${esc(r.id)} · ${esc(r.nome)}: P${r.p} × I${r.i}</title></circle>`;
      body += `<text x="${cx}" y="${cy + 4}" font-size="10.5" font-weight="600" fill="#ffffff" text-anchor="middle">${esc(r.id.replace("R", ""))}</text>`;
    });
  }
  // legenda de níveis + lista de riscos
  const lx = left + n * cell + 28;
  let ly = top + 4;
  for (const nv of ["critical", "serious", "warning", "good"]) {
    body += `<rect x="${lx}" y="${ly}" width="16" height="16" rx="3" fill="${C.status[nv]}" fill-opacity="0.35"/>`;
    body += `<text x="${lx + 24}" y="${ly + 12.5}" font-size="12" fill="${C.ink}">${nomeNivel[nv]}</text>`;
    ly += 24;
  }
  ly += 14;
  for (const r of [...riscos].sort((a, b) => b.p * b.i - a.p * a.i)) {
    body += `<text x="${lx}" y="${ly}" font-size="11.5" fill="${C.ink}"><tspan font-weight="600">${esc(r.id)}</tspan> ${esc(r.curto)} (${r.p * r.i})</text>`;
    ly += 18;
  }
  return frame(Math.max(w, lx + 270), Math.max(h, ly + 10), titulo, subtitulo, body);
}
