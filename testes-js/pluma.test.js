// Verificação da pluma gaussiana: fluxo de massa, simetria e distâncias.

import { test } from "node:test";
import assert from "node:assert/strict";
import { concentracao, pvol, distanciaAte, meiaLargura, curvasSensibilidade, CLASSES, GASES, BRIGGS } from "../site/labs/pluma/solver.js";

// ∫∫ u C dy dz no plano x, y ∈ (−∞, ∞), z ∈ [0, ∞), pela regra do trapézio
// em ±12σ (o integrando gaussiano é desprezível além disso).
function fluxoMassa(x, p) {
  const [sy, sz] = BRIGGS[p.cls](x), ny = 1200, nz = 1200;
  const ymax = 12 * sy, zmax = p.H + 12 * sz, hy = 2 * ymax / ny, hz = zmax / nz;
  let s = 0;
  for (let i = 0; i <= ny; i++) {
    const y = -ymax + i * hy, wy = i === 0 || i === ny ? 0.5 : 1;
    for (let k = 0; k <= nz; k++) {
      const wz = k === 0 || k === nz ? 0.5 : 1;
      s += wy * wz * concentracao(x, y, k * hz, p);
    }
  }
  return p.u * s * hy * hz;
}

test("fluxo de massa num plano transversal = Q (com reflexão no solo)", () => {
  for (const cls of CLASSES) for (const H of [0, 10]) for (const x of [50, 800]) {
    const p = { cls, gas: "metano", Q: 2, u: 5, H, z: 0 };
    const F = fluxoMassa(x, p);
    assert.ok(Math.abs(F - p.Q) < 1e-6 * p.Q, `${cls} H=${H} x=${x}: ${F}`);
  }
});

test("concentração é par em y e nula para x ≤ 0,5 m", () => {
  const p = { cls: "D", gas: "propano", Q: 3, u: 4, H: 5, z: 2 };
  assert.equal(concentracao(300, 7, 2, p), concentracao(300, -7, 2, p));
  assert.equal(concentracao(0.5, 0, 5, p), 0);
});

test("distância até o limiar é o último ponto da varredura acima dele", () => {
  for (const cls of CLASSES) {
    const p = { cls, gas: "metano", Q: 2, u: 5, H: 10, z: 10 }, L = GASES.metano.LFL / 2;
    const d = distanciaAte(L, p);
    assert.ok(d > 0, cls);
    assert.ok(pvol(d, 0, p.z, p) >= L);
    const prox = d < 200 ? d + 0.5 : d + 2;
    for (let x = prox; x <= 6000; x += x < 200 ? 0.5 : 2) assert.ok(pvol(x, 0, p.z, p) < L, `${cls} x=${x}`);
  }
});

test("meia-largura: a isolinha passa em (x, ±w)", () => {
  const p = { cls: "D", gas: "metano", Q: 2, u: 5, H: 10, z: 10 }, L = 2.5, x = 10;
  const w = meiaLargura(x, L, p);
  assert.ok(w > 0);
  assert.ok(Math.abs(pvol(x, w, p.z, p) - L) < 1e-10 * L);
});

test("sensibilidade: 6 curvas de 28 pontos e o caso atual sobre a curva da classe", () => {
  const p = { cls: "D", gas: "metano", Q: 2, u: 5, H: 10, z: 10 };
  const R = curvasSensibilidade(p, "u");
  assert.deepEqual(Object.keys(R.curvas), CLASSES);
  assert.equal(R.xs.length, 28);
  assert.deepEqual(R.atual, [5, distanciaAte(2.5, p)]);
});
