// Verificação do solver de difusão: ordens de convergência, TDMA e von Neumann.

import { test } from "node:test";
import assert from "node:assert/strict";
import { criarEstado, passo, tdma, fatorAmplificacao, solucaoExata } from "../site/labs/difusao/solver.js";

// Erro máximo no instante final após `passos` passos com Δt = T/passos.
function erroFinal(esq, N, T, passos) {
  const dt = T / passos, e = criarEstado({ esq, ic: "seno", r: dt * N * N, N });
  for (let n = 0; n < passos; n++) passo(e);
  let er = 0;
  for (let j = 0; j <= N; j++) er = Math.max(er, Math.abs(e.u[j] - solucaoExata("seno", e.x[j], e.t)));
  return er;
}

const ordem = (e1, e2) => Math.log2(e1 / e2);

test("FTCS com r = 0,4 fixo: erro O(Δt) + O(Δx²) = O(Δx²)", () => {
  // Δt = r Δx², então a ordem 1 no tempo aparece como ordem 2 em Δx.
  const Ns = [20, 40, 80], er = Ns.map(N => erroFinal("ftcs", N, 0.1, N * N / 4));
  for (let i = 0; i < 2; i++) {
    const p = ordem(er[i], er[i + 1]);
    assert.ok(p > 1.9 && p < 2.1, `ordem observada ${p}`);
  }
});

test("BTCS com Δt ∝ Δx: ordem 1 no tempo", () => {
  const Ns = [40, 80, 160], er = Ns.map(N => erroFinal("btcs", N, 0.1, N / 4));
  for (let i = 0; i < 2; i++) {
    const p = ordem(er[i], er[i + 1]);
    assert.ok(p > 0.9 && p < 1.1, `ordem observada ${p}`);
  }
});

test("Crank–Nicolson com Δt ∝ Δx: ordem 2", () => {
  const Ns = [40, 80, 160], er = Ns.map(N => erroFinal("cn", N, 0.1, N / 4));
  for (let i = 0; i < 2; i++) {
    const p = ordem(er[i], er[i + 1]);
    assert.ok(p > 1.9 && p < 2.1, `ordem observada ${p}`);
  }
});

test("TDMA concorda com eliminação de Gauss densa", () => {
  const n = 12, a = -0.7, b = 2.9, c = -1.3;
  const d = Array.from({ length: n }, (_, i) => Math.sin(1 + i) + 0.1 * i);
  const s = tdma(a, b, c, d, new Float64Array(n));
  // Gauss com pivotamento parcial na matriz completa
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n + 1 }, (_, k) =>
    k === n ? d[i] : k === i ? b : k === i - 1 ? a : k === i + 1 ? c : 0));
  for (let k = 0; k < n; k++) {
    let p = k; for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) { const f = M[i][k] / M[k][k]; for (let q = k; q <= n; q++) M[i][q] -= f * M[k][q]; }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) { let t = M[i][n]; for (let q = i + 1; q < n; q++) t -= M[i][q] * x[q]; x[i] = t / M[i][i]; }
  for (let i = 0; i < n; i++) assert.ok(Math.abs(s[i] - x[i]) < 1e-12 * Math.max(1, Math.abs(x[i])), `i=${i}`);
});

test("um passo multiplica um modo discreto exatamente por G(kΔx)", () => {
  // sin(mπx_j) é autovetor do operador δ² com u = 0 nas bordas.
  const N = 32;
  for (const esq of ["ftcs", "btcs", "cn"]) for (const r of [0.1, 0.5, 3]) for (const m of [1, 5, 31]) {
    const e = criarEstado({ esq, ic: "seno", r, N });
    for (let j = 0; j <= N; j++) e.u[j] = Math.sin(m * Math.PI * e.x[j]);
    const u0 = e.u.slice();
    passo(e);
    const G = fatorAmplificacao(esq, r, m * Math.PI / N);
    for (let j = 1; j < N; j++) assert.ok(Math.abs(e.u[j] - G * u0[j]) < 1e-12, `${esq} r=${r} m=${m} j=${j}`);
  }
});

test("FTCS: |G| ≤ 1 para todo k se e somente se r ≤ 1/2", () => {
  const maxG = r => Math.max(...Array.from({ length: 201 }, (_, i) => Math.abs(fatorAmplificacao("ftcs", r, Math.PI * i / 200))));
  assert.ok(maxG(0.5) <= 1 + 1e-15);
  assert.ok(maxG(0.51) > 1);
});

test("solução exata do pulso reproduz a condição inicial em t = 0⁺", () => {
  // Série truncada em 400 modos: perto das descontinuidades há Gibbs, longe delas não.
  for (const x of [0.2, 0.5, 0.8]) assert.ok(Math.abs(solucaoExata("pulso", x, 1e-7) - (x > 0.4 && x < 0.6 ? 1 : 0)) < 1e-2, `x=${x}`);
});
