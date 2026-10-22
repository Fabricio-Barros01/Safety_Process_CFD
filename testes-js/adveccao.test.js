// Verificação do solver de advecção: exatidão com C = 1, limites TVD,
// conservação e editor de código.

import { test } from "node:test";
import assert from "node:assert/strict";
import { criarPasso, perfilInicial, centros, compilarCodigo, metricas, torneio, EXEMPLO, LIMITADORES } from "../site/labs/adveccao/solver.js";

function rodar(esq, N, C, perfil, passos, meu = null) {
  const x = centros(N), u = new Float64Array(N), un = new Float64Array(N), st = criarPasso(esq, N, meu);
  for (let j = 0; j < N; j++) u[j] = perfilInicial(perfil, x[j]);
  for (let n = 0; n < passos; n++) { un.set(u); st(u, un, C); }
  return { u, x };
}

const soma = u => u.reduce((s, v) => s + v, 0);
const ESQUEMAS = ["upwind", "lw", "minmod", "vanleer", "superbee"];

test("upwind com C = 1 desloca o perfil uma célula por passo (exato a menos de arredondamento)", () => {
  const N = 100;
  for (const perfil of ["quadrado", "gauss"]) {
    const x = centros(N), u0 = x.map(v => perfilInicial(perfil, v));
    for (const k of [1, 37, 100]) {
      const { u } = rodar("upwind", N, 1, perfil, k);
      // u_j − (u_j − u_{j−1}) só difere de u_{j−1} por arredondamento.
      for (let j = 0; j < N; j++) assert.ok(Math.abs(u[j] - u0[(j - k + N * k) % N]) < 1e-14, `${perfil} k=${k} j=${j}`);
    }
  }
});

test("TVD não sai de [0, 1] e não aumenta a variação total", () => {
  for (const esq of Object.keys(LIMITADORES)) for (const perfil of ["quadrado", "gauss"]) for (const C of [0.2, 0.5, 0.8, 1]) {
    const N = 100, passos = Math.round(N / C), x = centros(N);
    const tv0 = metricas(x.map(v => perfilInicial(perfil, v)), x, 0, perfil).tv;
    const { u } = rodar(esq, N, C, perfil, passos);
    const M = metricas(u, x, 0, perfil);
    assert.ok(M.mn >= -1e-12 && M.mx <= 1 + 1e-12, `${esq} ${perfil} C=${C}: [${M.mn}, ${M.mx}]`);
    assert.ok(M.tv <= tv0 + 1e-12, `${esq} ${perfil} C=${C}: TV ${M.tv} > ${tv0}`);
  }
});

test("Lax–Wendroff cria valores fora de [0, 1] no quadrado (Godunov)", () => {
  const N = 100, { u } = rodar("lw", N, 0.8, "quadrado", 125), M = metricas(u, centros(N), 0, "quadrado");
  assert.ok(M.mn < -1e-3 && M.mx > 1 + 1e-3);
});

test("todos os esquemas conservam a soma de u", () => {
  for (const esq of ESQUEMAS) for (const C of [0.3, 0.9]) {
    const N = 120, x = centros(N), s0 = soma(x.map(v => perfilInicial("quadrado", v)));
    const { u } = rodar(esq, N, C, "quadrado", 500);
    assert.ok(Math.abs(soma(u) - s0) <= 1e-12 * s0, `${esq} C=${C}: ${soma(u)} vs ${s0}`);
  }
});

test("upwind com C > 1 é instável", () => {
  const N = 100, { u } = rodar("upwind", N, 1.2, "gauss", 400);
  assert.ok(Math.max(...u.map(Math.abs)) > 1e3);
});

test("o exemplo do editor compila e reproduz o upwind", () => {
  const r = compilarCodigo(EXEMPLO);
  assert.ok(r.f && !r.erro);
  const a = rodar("meu", 80, 0.6, "gauss", 50, r.f).u, b = rodar("upwind", 80, 0.6, "gauss", 50).u;
  assert.deepEqual(Array.from(a), Array.from(b));
});

test("código com erro devolve a mensagem sem lançar exceção", () => {
  assert.ok(compilarCodigo("u[j] = ;").erro);
  assert.ok(compilarCodigo("naoExiste(1);").erro);
  assert.equal(criarPasso("meu", 10, null), null);
});

test("torneio: uma linha por esquema e erro marcado para código que falha na execução", () => {
  const ok = torneio({ N: 100, C: 0.8, perfil: "quadrado", meu: compilarCodigo(EXEMPLO).f });
  assert.deepEqual(ok.linhas.map(l => l.esq), [...ESQUEMAS, "meu"]);
  assert.equal(ok.passos, 125);
  const falha = compilarCodigo("if (un.length > 8) throw new Error('x');");
  const R = torneio({ N: 100, C: 0.8, perfil: "quadrado", meu: falha.f });
  assert.equal(R.linhas.at(-1).erro, true);
});
