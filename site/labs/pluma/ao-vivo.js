// Cálculo da pluma com os números atuais, em TeX.

import { T } from "../comum/equacao.js";
import { BRIGGS, GASES, paraPorcentagemVolume } from "./solver.js";

// Fórmulas de Briggs em TeX, [σy, σz] por classe.
export const BRIGGS_TEX = {
  A: ["0{,}22\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}20\\,x"],
  B: ["0{,}16\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}12\\,x"],
  C: ["0{,}11\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}08\\,x\\,(1+2\\cdot10^{-4}x)^{-1/2}"],
  D: ["0{,}08\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}06\\,x\\,(1+1{,}5\\cdot10^{-3}x)^{-1/2}"],
  E: ["0{,}06\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}03\\,x\\,(1+3\\cdot10^{-4}x)^{-1}"],
  F: ["0{,}04\\,x\\,(1+10^{-4}x)^{-1/2}", "0{,}016\\,x\\,(1+3\\cdot10^{-4}x)^{-1}"]
};

// Conta no ponto do eixo a x = dH (distância até ½LFL) ou, se a nuvem não
// atinge ½LFL, a x = 100 m.
export function texPluma(p, dH) {
  const x = dH || 100, [sy, sz] = BRIGGS[p.cls](x), M = GASES[p.gas].M;
  const pre = p.Q / (2 * Math.PI * p.u * sy * sz);
  const e1 = Math.exp(-((p.z - p.H) ** 2) / (2 * sz * sz)), e2 = Math.exp(-((p.z + p.H) ** 2) / (2 * sz * sz));
  const C = pre * (e1 + e2), v = paraPorcentagemVolume(C, p.gas);
  let s = `x = ${T(x)}\\ \\text{m}\\ \\big(${dH ? "\\text{distância até }\\tfrac12\\text{LFL}" : "\\text{ponto de exemplo}"}\\big),\\quad y = 0,\\quad z = ${p.z}\\ \\text{m}\\\\[8pt]`;
  s += `\\sigma_y = ${BRIGGS_TEX[p.cls][0]} = ${T(sy)}\\ \\text{m}\\\\ \\sigma_z = ${BRIGGS_TEX[p.cls][1]} = ${T(sz)}\\ \\text{m}\\quad(\\text{classe } ${p.cls})\\\\[8pt]`;
  s += `\\frac{Q}{2\\pi u\\,\\sigma_y\\sigma_z} = \\frac{${T(p.Q)}}{2\\pi\\cdot${T(p.u)}\\cdot${T(sy)}\\cdot${T(sz)}} = ${T(pre)}\\ \\text{kg/m}^3\\\\[6pt]`;
  s += `\\underbrace{e^{-(z-H)^2/2\\sigma_z^2}}_{\\text{fonte real}} + \\underbrace{e^{-(z+H)^2/2\\sigma_z^2}}_{\\text{fonte imagem}} = ${T(e1)} + ${T(e2)}\\\\[6pt]`;
  s += `C = ${T(pre)}\\times${T(e1 + e2)} = ${T(C)}\\ \\text{kg/m}^3\\\\[8pt]`;
  s += `\\%\\text{vol} = \\frac{C\\,R\\,T}{p\\,M}\\times100 = \\frac{${T(C)}\\cdot 8{,}314\\cdot 288{,}15}{101\\,325\\cdot ${T(M)}}\\times100 = ${T(v)}\\ \\%`;
  return `\\begin{gathered}${s}\\end{gathered}`;
}

