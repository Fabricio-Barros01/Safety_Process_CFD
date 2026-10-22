// Validação de TeX: equações estáticas das páginas e strings geradas pelos
// painéis ao vivo para uma grade de parâmetros. Falha em erro de parse.

import { test } from "node:test";
import assert from "node:assert/strict";
import { renderizarTex, equacoesDoHtml } from "./apoio/tex.js";
import { criarEstado, passo } from "../site/labs/difusao/solver.js";
import { texDifusao } from "../site/labs/difusao/ao-vivo.js";
import { criarPasso, perfilInicial, centros, compilarCodigo, EXEMPLO } from "../site/labs/adveccao/solver.js";
import { texAdveccao } from "../site/labs/adveccao/ao-vivo.js";
import { distanciaAte, CLASSES, GASES } from "../site/labs/pluma/solver.js";
import { texPluma } from "../site/labs/pluma/ao-vivo.js";

const PAGINAS = ["site/labs/index.html"];

function validar(lista, rotulo) {
  for (const { tex, display, caso } of lista) {
    try { renderizarTex(tex, display); }
    catch (e) { assert.fail(`${rotulo} ${caso || ""}: ${e.message}\n${tex}`); }
  }
}

test("equações estáticas das páginas", () => {
  for (const p of PAGINAS) {
    const eqs = equacoesDoHtml(p);
    assert.ok(eqs.length > 30, `${p}: só ${eqs.length} equações encontradas`);
    validar(eqs, p);
  }
});

test("painel ao vivo da difusão", () => {
  const lista = [];
  for (const esq of ["ftcs", "btcs", "cn"]) for (const ic of ["seno", "pulso"])
    for (const r of [0.05, 0.4, 0.5, 0.52, 1, 6]) for (const N of [10, 50, 200]) {
      const e = criarEstado({ esq, ic, r, N });
      for (const passos of [0, 1, 200]) {
        while (e.n < passos) passo(e);
        lista.push({ tex: texDifusao(e), display: true, caso: `${esq} ${ic} r=${r} N=${N} n=${passos}` });
      }
    }
  validar(lista, "difusão");
});

test("painel ao vivo da advecção", () => {
  const meu = compilarCodigo(EXEMPLO).f, lista = [];
  for (const esq of ["upwind", "lw", "minmod", "vanleer", "superbee", "meu", "meu-sem-codigo"])
    for (const perfil of ["quadrado", "gauss"]) for (const C of [0.05, 0.8, 1, 1.2]) for (const N of [40, 100, 400]) {
      const st = esq === "meu-sem-codigo" ? null : criarPasso(esq, N, meu);
      const x = centros(N), u = new Float64Array(N), un = new Float64Array(N);
      for (let j = 0; j < N; j++) u[j] = perfilInicial(perfil, x[j]);
      for (const passos of [0, 3, 300]) {
        for (let n = 0; st && n < passos; n++) { un.set(u); st(u, un, C); }
        lista.push({ tex: texAdveccao({ esq, C, u, passo: st }), display: true, caso: `${esq} ${perfil} C=${C} N=${N} n=${passos}` });
      }
    }
  validar(lista, "advecção");
});

test("painel ao vivo da pluma", () => {
  const lista = [], base = { Q: 2, u: 5, H: 10, z: 10 };
  const variantes = [base, { ...base, Q: 0.1 }, { ...base, Q: 20 }, { ...base, u: 1 }, { ...base, u: 15 },
    { ...base, H: 0, z: 0 }, { ...base, H: 30, z: 0 }, { ...base, H: 0, z: 30 }];
  for (const cls of CLASSES) for (const gas of Object.keys(GASES)) for (const v of variantes) {
    const p = { cls, gas, ...v }, dH = distanciaAte(GASES[gas].LFL / 2, p);
    lista.push({ tex: texPluma(p, dH), display: true, caso: JSON.stringify(p) });
  }
  validar(lista, "pluma");
});

test("o validador rejeita TeX inválido", () => {
  assert.throws(() => renderizarTex("\\frac{1}{"));
  assert.throws(() => renderizarTex("\\macroInexistente x"));
});
