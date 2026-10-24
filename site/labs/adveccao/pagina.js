// Laboratório de advecção: DOM, eventos, animação, editor e torneio.

import { $, ligarSegmentado } from "../comum/controles.js";
import { linhas } from "../comum/grafico.js";
import { cor } from "../comum/tema.js";
import { nf, sci, renderizar } from "../comum/equacao.js";
import { EXEMPLO, criarPasso, compilarCodigo, perfilInicial, centros, metricas, torneio } from "./solver.js";
import { texAdveccao } from "./ao-vivo.js";

export function montarAdveccao() {
  const xe = Array.from({ length: 600 }, (_, i) => i / 599);
  const A = { esq: "upwind", perfil: "quadrado", C: 0.8, N: 100, rodando: false, k: 0, meu: null, explodiu: false };

  function iniciar() {
    A.N = +$("#adv-N").value; A.C = +$("#adv-C").value;
    A.x = centros(A.N);
    A.u = new Float64Array(A.N); for (let j = 0; j < A.N; j++) A.u[j] = perfilInicial(A.perfil, A.x[j]);
    A.k = 0; A.explodiu = false; A.passo = criarPasso(A.esq, A.N, A.meu);
    $("#adv-C-o").textContent = nf(A.C, 2); $("#adv-N-o").textContent = A.N;
    desenhar();
  }

  function desenhar() {
    const s = A.k * A.C / A.N;
    const over = [];
    for (let j = 0; j < A.N; j++) if (A.u[j] < -1e-6 || A.u[j] > 1 + 1e-6) over.push({ x: A.x[j], y: A.u[j], color: cor("--danger") });
    linhas($("#cv-adv"), { xmin: 0, xmax: 1, ymin: -0.35, ymax: 1.35, xlabel: "x", ylabel: "u",
      hlines: [{ y: 0, color: cor("--line") }, { y: 1, color: cor("--line") }],
      series: [ { x: xe, y: xe.map(x => perfilInicial(A.perfil, x - s)), color: cor("--exact"), width: 1.5, dash: [5, 4] },
                { x: A.x, y: Array.from(A.u), color: cor("--num"), width: 2.2 } ], over });
    const M = metricas(A.u, A.x, s, A.perfil);
    $("#adv-v").textContent = nf(s, 2); $("#adv-pk").textContent = sci(M.mx);
    $("#adv-min").textContent = sci(M.mn); $("#adv-max").textContent = sci(M.mx); $("#adv-l1").textContent = sci(M.l1);
    const st = $("#adv-status");
    if (!A.passo) { st.className = "status bad"; st.textContent = "Aplique um código válido no editor para usar “Meu esquema”."; }
    else if (A.explodiu || M.mx > 1e3) { st.className = "status bad"; st.textContent = "Instável: a solução explodiu."; }
    else if (M.mn < -1e-6 || M.mx > 1 + 1e-6) { st.className = "status bad"; st.textContent = "Oscilações: valores fora de [0, 1]."; }
    else { st.className = "status good"; st.textContent = "Solução limitada em [0, 1]."; }
    renderizar("adv-live", texAdveccao({ esq: A.esq, C: A.C, u: A.u, passo: A.passo }), !A.rodando);
    return M.mx;
  }

  function laco() {
    if (!A.rodando || !A.passo) return;
    const spf = Math.max(1, Math.round(A.N / (A.C * 150)));
    const un = new Float64Array(A.N);
    try {
      for (let k = 0; k < spf; k++) { un.set(A.u); A.passo(A.u, un, A.C); A.k++; }
    } catch (e) { $("#adv-err").textContent = "Erro ao executar seu código: " + e.message; parar(); return; }
    const mx = desenhar();
    if (!Number.isFinite(mx) || mx > 1e6) { A.explodiu = true; desenhar(); parar(); return; }
    requestAnimationFrame(laco);
  }

  // Ao parar, renderiza o painel ao vivo sem throttle para mostrar o estado final.
  function parar() {
    A.rodando = false; $("#adv-play").textContent = "Rodar";
    if (A.u) renderizar("adv-live", texAdveccao({ esq: A.esq, C: A.C, u: A.u, passo: A.passo }), true);
  }

  function compilar() {
    const r = compilarCodigo($("#adv-code").value);
    A.meu = r.f || null;
    $("#adv-err").textContent = r.erro ? "Erro no código: " + r.erro : "";
    return !r.erro;
  }

  function rodarTorneio() {
    const N = A.N, C = A.C, R = torneio({ N, C, perfil: A.perfil, meu: A.meu });
    let html = "<tr><th>Esquema</th><th>Erro L1</th><th>Mín.</th><th>Máx.</th><th>Var. total</th></tr>";
    R.linhas.forEach(L => {
      if (L.erro) { html += `<tr><td>${L.nome}</td><td class="bad" colspan="4">erro no código</td></tr>`; return; }
      const bmn = L.mn < -1e-6, bmx = L.mx > 1 + 1e-6;
      html += `<tr><td>${L.nome}</td><td>${sci(L.l1)}</td><td class="${bmn ? "bad" : ""}">${sci(L.mn)}</td><td class="${bmx ? "bad" : ""}">${sci(L.mx)}</td><td>${sci(L.tv)}</td></tr>`;
    });
    const tv0 = A.perfil === "quadrado" ? 2 : null;
    $("#adv-table").innerHTML = html;
    $("#adv-table").insertAdjacentHTML("beforeend", `<caption style="caption-side:bottom;text-align:left;color:var(--muted);font-size:.82rem;padding-top:6px">C = ${nf(C, 2)}, ${N} células, ${R.passos} passos.${tv0 ? " Variação total exata = 2." : ""} Em vermelho, valores fora de [0, 1].</caption>`);
  }

  $("#adv-play").onclick = () => {
    if (A.rodando) { parar(); return; }
    if (A.explodiu) iniciar();
    if (!A.passo) { desenhar(); return; }
    A.rodando = true; $("#adv-play").textContent = "Pausar"; requestAnimationFrame(laco);
  };
  $("#adv-reset").onclick = () => { parar(); iniciar(); };
  $("#adv-C").oninput = () => { parar(); iniciar(); };
  $("#adv-N").oninput = () => { parar(); iniciar(); };
  $("#adv-esq").onchange = e => { A.esq = e.target.value; parar(); iniciar(); };
  ligarSegmentado("#adv-perfil", v => { A.perfil = v; parar(); iniciar(); });

  $("#adv-code").value = EXEMPLO; compilar();
  $("#adv-apply").onclick = () => { if (compilar()) { $("#adv-esq").value = "meu"; A.esq = "meu"; } parar(); iniciar(); };
  $("#adv-restore").onclick = () => { $("#adv-code").value = EXEMPLO; compilar(); parar(); iniciar(); };
  $("#adv-code").addEventListener("keydown", e => {
    if (e.key === "Tab") { e.preventDefault(); const t = e.target, a = t.selectionStart; t.setRangeText("  ", a, t.selectionEnd, "end"); }
  });
  $("#adv-tour").onclick = rodarTorneio;

  iniciar();
  return { redesenhar: desenhar, parar };
}
