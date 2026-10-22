// Laboratório de difusão: DOM, eventos e animação.

import { $, ligarSegmentado } from "../comum/controles.js";
import { linhas } from "../comum/grafico.js";
import { cor } from "../comum/tema.js";
import { nf, sci, renderizar } from "../comum/equacao.js";
import { criarEstado, passo, passoDeTempo, solucaoExata, fatorAmplificacao, medidas } from "./solver.js";
import { texDifusao } from "./ao-vivo.js";

const T_FINAL = 0.2;

export function montarDifusao() {
  const xe = Array.from({ length: 401 }, (_, i) => i / 400);
  let esq = "ftcs", ic = "seno", rodando = false, explodiu = false, E;

  function iniciar() {
    E = criarEstado({ esq, ic, r: +$("#dif-r").value, N: +$("#dif-N").value });
    explodiu = false;
    $("#dif-r-o").textContent = nf(E.r, 2); $("#dif-N-o").textContent = E.N;
    desenhar(); desenharG();
  }

  function desenhar() {
    const ye = xe.map(x => solucaoExata(E.ic, x, E.t));
    const ymin = E.ic === "seno" ? -0.3 : -0.5, ymax = 1.2;
    linhas($("#cv-dif"), { xmin: 0, xmax: 1, ymin, ymax, xlabel: "x", ylabel: "u",
      series: [ { x: xe, y: ye, color: cor("--exact"), width: 1.5, dash: [5, 4] },
                { x: E.x, y: Array.from(E.u), color: cor("--num"), width: 2.2 } ] });
    const { mx, er } = medidas(E);
    $("#dif-t").textContent = nf(E.t, 4); $("#dif-n").textContent = E.n;
    $("#dif-max").textContent = sci(mx); $("#dif-err").textContent = sci(er);
    const st = $("#dif-status");
    if (explodiu || mx > 1e3) { st.className = "status bad"; st.textContent = `Instável: a solução explodiu em t = ${nf(E.t, 4)}.`; }
    else if (E.esq === "ftcs") { const ok = E.r <= 0.5 + 1e-12; st.className = "status " + (ok ? "good" : "bad"); st.textContent = ok ? "Estável pela análise de von Neumann (r ≤ 1/2)." : "Instável pela teoria (r > 1/2). Rode e espere."; }
    else if (E.esq === "btcs") { st.className = "status good"; st.textContent = "Incondicionalmente estável."; }
    else { st.className = "status good"; st.textContent = E.r > 1 ? "Estável, mas modos curtos quase não amortecem." : "Estável e de 2.ª ordem no tempo."; }
    renderizar("dif-live", texDifusao(E), !rodando);
    return mx;
  }

  function desenharG() {
    const th = Array.from({ length: 201 }, (_, i) => Math.PI * i / 200);
    const G = th.map(t => fatorAmplificacao(E.esq, E.r, t));
    linhas($("#cv-G"), { xmin: 0, xmax: Math.PI, ymin: -2, ymax: 1.3, xlabel: "kΔx (rad)", ylabel: "G",
      hlines: [{ y: 1, color: cor("--danger") }, { y: -1, color: cor("--danger") }],
      series: [{ x: th, y: G, color: cor("--accent"), width: 2.2 }] });
  }

  function laco() {
    if (!rodando) return;
    const spf = Math.min(400, Math.max(1, Math.round(4e-4 / passoDeTempo(E))));
    for (let k = 0; k < spf; k++) passo(E);
    const mx = desenhar();
    if (mx > 1e6 || !Number.isFinite(mx)) { explodiu = true; desenhar(); parar(); return; }
    if (E.t >= T_FINAL) { parar(); return; }
    requestAnimationFrame(laco);
  }

  function parar() { rodando = false; $("#dif-play").textContent = "Rodar"; }

  $("#dif-play").onclick = () => {
    if (rodando) { parar(); return; }
    if (E.t >= T_FINAL || explodiu) iniciar();
    rodando = true; $("#dif-play").textContent = "Pausar"; requestAnimationFrame(laco);
  };
  $("#dif-reset").onclick = () => { parar(); iniciar(); };
  $("#dif-r").oninput = () => { parar(); iniciar(); };
  $("#dif-N").oninput = () => { parar(); iniciar(); };
  ligarSegmentado("#dif-esq", v => { esq = v; parar(); iniciar(); });
  ligarSegmentado("#dif-ic", v => { ic = v; parar(); iniciar(); });

  iniciar();
  return { redesenhar() { desenhar(); desenharG(); }, parar };
}
