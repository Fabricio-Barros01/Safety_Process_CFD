// Equação do passo da difusão com os números atuais, em TeX.

import { T, VERMELHO } from "../comum/equacao.js";
import { THETA } from "./solver.js";

// Conta feita no nó central j = ⌊N/2⌋.
export function texDifusao(e) {
  const r = e.r, N = e.N, dx = e.dx, j = Math.floor(N / 2), u = e.u;
  const um = u[j - 1], u0 = u[j], up = u[j + 1];
  let s = `\\Delta x = \\tfrac{1}{${N}} = ${T(dx)},\\qquad \\Delta t = r\\,\\Delta x^2 = ${T(r * dx * dx)}\\\\[8pt]`;
  if (e.esq === "ftcs") {
    const a = 1 - 2 * r, nx = a * u0 + r * (up + um);
    s += `u_j^{n+1} = (1-2r)\\,u_j^n + r\\,\\big(u_{j+1}^n + u_{j-1}^n\\big)\\\\`;
    s += `u_j^{n+1} = ${a < 0 ? VERMELHO : ""}{${T(a)}}\\,u_j^n + ${T(r)}\\,\\big(u_{j+1}^n + u_{j-1}^n\\big)\\\\[8pt]`;
    s += `\\text{nó } j=${j}:\\quad ${T(a)}\\cdot(${T(u0)}) + ${T(r)}\\cdot\\big(${T(up)} + ${T(um)}\\big) = ${T(nx)}`;
    if (a < 0) s += `\\\\[6pt]${VERMELHO}\\text{coeficiente de } u_j^n \\text{ negativo: o esquema deixou de ser monotônico}`;
  } else {
    const th = THETA[e.esq], a = r * th, b = 1 + 2 * r * th;
    const rhs = u0 + r * (1 - th) * (up - 2 * u0 + um);
    if (th === 1) s += `-r\\,u_{j-1}^{n+1} + (1+2r)\\,u_j^{n+1} - r\\,u_{j+1}^{n+1} = u_j^n\\\\`;
    else s += `-\\tfrac{r}{2}u_{j-1}^{n+1} + (1+r)\\,u_j^{n+1} - \\tfrac{r}{2}u_{j+1}^{n+1} = \\tfrac{r}{2}u_{j-1}^n + (1-r)\\,u_j^n + \\tfrac{r}{2}u_{j+1}^n\\\\`;
    s += `-${T(a)}\\,u_{j-1}^{n+1} + ${T(b)}\\,u_j^{n+1} - ${T(a)}\\,u_{j+1}^{n+1} = ${T(rhs)}\\qquad(\\text{nó } j=${j})\\\\[8pt]`;
    const A = T(-a), B = T(b);
    s += `\\underbrace{\\begin{bmatrix} ${B} & ${A} & & \\\\ ${A} & ${B} & ${A} & \\\\ & \\ddots & \\ddots & \\ddots \\\\ & & ${A} & ${B} \\end{bmatrix}}_{${N - 1}\\times${N - 1}}\\,\\mathbf u^{n+1} = \\mathbf d^{\\,n}\\\\[6pt]`;
    s += `\\text{resolvido a cada passo pelo TDMA (custo proporcional a } N\\text{)}`;
  }
  return `\\begin{gathered}${s}\\end{gathered}`;
}
