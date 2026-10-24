// Laboratório da pluma gaussiana: DOM, mapa em planta e sensibilidade.

import { $, ligarSegmentado } from "../comum/controles.js";
import { eixos, linhas } from "../comum/grafico.js";
import { cor } from "../comum/tema.js";
import { nf, tf, renderizar } from "../comum/equacao.js";
import { GASES, BRIGGS, pvol, distanciaAte, meiaLarguraMaxima, curvasSensibilidade, SENSIBILIDADE } from "./solver.js";
import { texPluma } from "./ao-vivo.js";

const CORES_CLASSE = { A: "#7B61A8", B: "#3F7CC4", C: "#2C9C9A", D: "#5B8A2E", E: "#C98A0B", F: "#C4471A" };

export function montarPluma() {
  const P = { cls: "D", gas: "metano" };

  const parametros = () => ({ cls: P.cls, gas: P.gas, Q: +$("#pl-Q").value, u: +$("#pl-u").value, H: +$("#pl-H").value, z: +$("#pl-z").value });

  function desenhar() {
    const p = parametros(), L = GASES[p.gas].LFL;
    $("#pl-Q-o").textContent = nf(p.Q, 1); $("#pl-u-o").textContent = nf(p.u, 1);
    $("#pl-H-o").textContent = p.H; $("#pl-z-o").textContent = p.z;
    const dL = distanciaAte(L, p), dH = distanciaAte(L / 2, p);
    const wmax = meiaLarguraMaxima(dH, L / 2, p);
    $("#pl-dl").textContent = dL ? `${tf(dL)} m` : "não atinge";
    $("#pl-dh").textContent = dH ? `${tf(dH)} m` : "não atinge";
    $("#pl-w").textContent = wmax ? `${tf(2 * wmax)} m` : "–";
    // mapa em planta
    const Xmax = Math.max(40, Math.min(6000, (dH || 60) * 1.35));
    const Ymax = Math.max(6, wmax * 1.6, BRIGGS[p.cls](Xmax)[0] * 0.6);
    const A = eixos($("#cv-pl"), { xmin: 0, xmax: Xmax, ymin: -Ymax, ymax: Ymax, xlabel: "distância a jusante x (m)", ylabel: "y (m)" });
    const { ctx, m, pw, ph } = A, nx = Math.min(260, Math.round(pw / 2.2)), ny = Math.min(130, Math.round(ph / 2.2));
    const cw = pw / nx, ch = ph / ny, lo = Math.log10(L / 2) - 2.5, hi = Math.log10(L / 2);
    const cDan = cor("--danger"), cAcc = cor("--accent"), cHeat = cor("--heat");
    for (let i = 0; i < nx; i++) {
      const x = (i + 0.5) / nx * Xmax;
      for (let k = 0; k < ny; k++) {
        const y = Ymax - (k + 0.5) / ny * 2 * Ymax, v = pvol(x, y, p.z, p);
        if (v <= 0) continue;
        if (v >= L) { ctx.globalAlpha = 0.9; ctx.fillStyle = cDan; }
        else if (v >= L / 2) { ctx.globalAlpha = 0.85; ctx.fillStyle = cAcc; }
        else { const f = (Math.log10(v) - lo) / (hi - lo); if (f <= 0) continue; ctx.globalAlpha = 0.08 + 0.55 * Math.min(1, f); ctx.fillStyle = cHeat; }
        ctx.fillRect(m.l + i * cw, m.t + k * ch, cw + 0.6, ch + 0.6);
      }
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = cor("--ink"); ctx.beginPath(); ctx.arc(m.l, m.t + ph / 2, 4, 0, 2 * Math.PI); ctx.fill();
    desenharSensibilidade(p);
    renderizar("pl-live", texPluma(p, dH), true);
  }

  function desenharSensibilidade(p) {
    const chave = $("#pl-sx").value, S = SENSIBILIDADE[chave], R = curvasSensibilidade(p, chave);
    let ymax = 10; const series = [];
    Object.keys(R.curvas).forEach(c => {
      const ys = R.curvas[c];
      ymax = Math.max(ymax, ...ys);
      const s = { x: R.xs, y: ys, color: CORES_CLASSE[c], width: c === p.cls ? 3 : 1.6, dash: [] };
      if (c === p.cls) s.marks = [R.atual];
      series.push(s);
    });
    linhas($("#cv-sens"), { xmin: S.min, xmax: S.max, ymin: 0, ymax: ymax * 1.08, xlabel: S.lab, ylabel: "distância até ½LFL (m)", series });
    $("#sens-leg").innerHTML = Object.keys(CORES_CLASSE).map(c => `<span style="--c:${CORES_CLASSE[c]}">classe ${c}</span>`).join("");
  }

  ["#pl-Q", "#pl-u", "#pl-H", "#pl-z"].forEach(id => $(id).addEventListener("input", desenhar));
  $("#pl-gas").onchange = e => { P.gas = e.target.value; desenhar(); };
  $("#pl-sx").onchange = desenhar;
  ligarSegmentado("#pl-cls", v => { P.cls = v; desenhar(); });

  return { redesenhar: desenhar, parar() {} };
}
