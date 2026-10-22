// Gráficos em canvas 2D: eixos, linhas, marcadores e linhas horizontais.

import { cor } from "./tema.js";
import { tf } from "./equacao.js";

// Ajusta o canvas à densidade de pixels da tela.
export function preparar(cv) {
  const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width * dpr)); cv.height = Math.max(1, Math.round(r.height * dpr));
  const ctx = cv.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height };
}

// Marcas "redondas" (1, 2, 5 × 10^k) entre a e b, cerca de n delas.
export function marcas(a, b, n) {
  const span = b - a, s0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(s0))), f = s0 / mag;
  const st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag, out = [];
  for (let t = Math.ceil(a / st) * st; t <= b + 1e-9 * span; t += st) out.push(+t.toFixed(10));
  return out;
}

// Desenha grade, marcas e rótulos. o = { xmin, xmax, ymin, ymax, xlabel, ylabel }.
// Devolve as transformações X(x), Y(y) e a área útil.
export function eixos(cv, o) {
  const { ctx, w, h } = preparar(cv);
  const m = { l: 50, r: 12, t: 10, b: 36 }, pw = w - m.l - m.r, ph = h - m.t - m.b;
  const X = x => m.l + (x - o.xmin) / (o.xmax - o.xmin) * pw;
  const Y = y => m.t + (1 - (y - o.ymin) / (o.ymax - o.ymin)) * ph;
  ctx.clearRect(0, 0, w, h);
  ctx.font = '11px "IBM Plex Sans", system-ui, sans-serif';
  ctx.lineWidth = 1; ctx.strokeStyle = cor("--line"); ctx.fillStyle = cor("--muted");
  marcas(o.xmin, o.xmax, Math.max(3, Math.round(pw / 90))).forEach(t => {
    ctx.beginPath(); ctx.moveTo(X(t) + .5, m.t); ctx.lineTo(X(t) + .5, m.t + ph); ctx.stroke();
    ctx.textAlign = "center"; ctx.fillText(tf(t), X(t), m.t + ph + 14);
  });
  marcas(o.ymin, o.ymax, Math.max(3, Math.round(ph / 55))).forEach(t => {
    ctx.beginPath(); ctx.moveTo(m.l, Y(t) + .5); ctx.lineTo(m.l + pw, Y(t) + .5); ctx.stroke();
    ctx.textAlign = "right"; ctx.fillText(tf(t), m.l - 6, Y(t) + 4);
  });
  ctx.textAlign = "center"; ctx.fillText(o.xlabel || "", m.l + pw / 2, h - 4);
  ctx.save(); ctx.translate(12, m.t + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(o.ylabel || "", 0, 0); ctx.restore();
  return { ctx, X, Y, m, pw, ph, w, h };
}

// Gráfico de linhas. Além do de eixos(), o aceita:
//   series: [{ x, y, color, width, dash, marks: [[x, y], ...] }]
//   hlines: [{ y, color }]  (tracejadas)
//   over:   [{ x, y, color }]  (pontos pequenos por cima)
export function linhas(cv, o) {
  const A = eixos(cv, o), { ctx, X, Y, m, pw, ph } = A;
  ctx.save(); ctx.beginPath(); ctx.rect(m.l, m.t, pw, ph); ctx.clip();
  (o.hlines || []).forEach(hl => {
    ctx.strokeStyle = hl.color; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.l, Y(hl.y)); ctx.lineTo(m.l + pw, Y(hl.y)); ctx.stroke();
  });
  const big = (o.ymax - o.ymin) * 50;
  o.series.forEach(s => {
    ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 2; ctx.setLineDash(s.dash || []);
    ctx.beginPath(); let pen = false;
    for (let i = 0; i < s.x.length; i++) {
      let y = s.y[i];
      if (!Number.isFinite(y)) { pen = false; continue; }
      y = Math.max(o.ymin - big, Math.min(o.ymax + big, y));
      const px = X(s.x[i]), py = Y(y);
      if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
    }
    ctx.stroke();
    if (s.marks) {
      ctx.setLineDash([]); ctx.fillStyle = s.color;
      s.marks.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(X(x), Y(y), 4.5, 0, 2 * Math.PI); ctx.fill(); });
    }
  });
  (o.over || []).forEach(p => {
    ctx.setLineDash([]); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), 3, 0, 2 * Math.PI); ctx.fill();
  });
  ctx.restore();
  return A;
}
