// Equação do passo da advecção com os números atuais, em TeX.

import { T, VERMELHO } from "../comum/equacao.js";
import { LIMITADORES, razaoGradientes } from "./solver.js";

// Nó de maior gradiente |u_j − u_{j−1}| (a frente do perfil).
export function noMaiorGradiente(u) {
  const N = u.length, idx = j => (j + N) % N;
  let j = 0, g = -1;
  for (let k = 0; k < N; k++) { const d = Math.abs(u[k] - u[idx(k - 1)]); if (d > g) { g = d; j = k; } }
  return j;
}

// e = { esq, C, u, passo }; passo pode ser null (editor sem código válido).
export function texAdveccao(e) {
  const u = e.u, N = u.length, C = e.C, idx = j => (j + N) % N;
  const j = noMaiorGradiente(u);
  const um = u[idx(j - 1)], u0 = u[j], up = u[idx(j + 1)];
  let nx = NaN;
  if (e.passo) { const v = new Float64Array(N); try { e.passo(v, u, C); nx = v[j]; } catch (err) {} }
  let s = `C = \\frac{a\\,\\Delta t}{\\Delta x} = ${T(C)},\\qquad j = ${j}\\ (\\text{maior gradiente})\\\\[8pt]`;
  if (e.esq === "upwind") {
    s += `u_j^{n+1} = (1-C)\\,u_j^n + C\\,u_{j-1}^n\\\\`;
    s += `= ${C > 1 ? VERMELHO : ""}{${T(1 - C)}}\\cdot(${T(u0)}) + ${T(C)}\\cdot(${T(um)}) = ${T(nx)}`;
    if (C > 1) s += `\\\\[6pt]${VERMELHO}\\text{com } C>1 \\text{ o coeficiente } 1-C \\text{ fica negativo: instável}`;
  } else if (e.esq === "lw") {
    const cm = C * (1 + C) / 2, c0 = 1 - C * C, cp = C * (C - 1) / 2;
    s += `u_j^{n+1} = \\tfrac{C(1+C)}{2}\\,u_{j-1}^n + (1-C^2)\\,u_j^n + \\tfrac{C(C-1)}{2}\\,u_{j+1}^n\\\\`;
    s += `= ${T(cm)}\\cdot(${T(um)}) + ${T(c0)}\\cdot(${T(u0)}) + ${cp < 0 ? VERMELHO : ""}{${T(cp)}}\\cdot(${T(up)}) = ${T(nx)}`;
    if (cp < 0) s += `\\\\[6pt]${VERMELHO}\\text{coeficiente negativo: não monotônico (teorema de Godunov)}`;
  } else if (LIMITADORES[e.esq]) {
    const psi = LIMITADORES[e.esq];
    const rj = razaoGradientes(u, j, N), rjm = razaoGradientes(u, j - 1, N), pj = psi(rj), pjm = psi(rjm);
    const Fp = u0 + 0.5 * pj * (1 - C) * (up - u0), Fm = um + 0.5 * pjm * (1 - C) * (u0 - um);
    s += `r_j = \\frac{u_j-u_{j-1}}{u_{j+1}-u_j} = ${T(rj)},\\qquad \\psi(r_j) = ${T(pj)},\\qquad \\psi(r_{j-1}) = ${T(pjm)}\\\\[4pt]`;
    s += `\\tfrac{1}{a}F_{j+1/2} = u_j + \\tfrac12\\,\\psi(r_j)\\,(1-C)\\,(u_{j+1}-u_j) = ${T(Fp)}\\\\`;
    s += `\\tfrac{1}{a}F_{j-1/2} = ${T(Fm)}\\\\[6pt]`;
    s += `u_j^{n+1} = u_j^n - C\\,\\tfrac{1}{a}\\big(F_{j+1/2}-F_{j-1/2}\\big) = ${T(u0)} - ${T(C)}\\cdot(${T(Fp - Fm)}) = ${T(nx)}`;
  } else {
    s += `\\text{Esquema do editor (sem forma fechada conhecida)}\\\\[4pt] u_j^n = ${T(u0)}\\quad\\longrightarrow\\quad u_j^{n+1} = ${T(nx)}`;
  }
  return `\\begin{gathered}${s}\\end{gathered}`;
}
