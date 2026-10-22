// Pluma gaussiana passiva com reflexão no solo e σ de Briggs, campo aberto
// (Módulo 6). Funções puras, sem DOM.

export const GASES = { metano: { M: 0.016, LFL: 5.0 }, propano: { M: 0.044, LFL: 2.1 } };

// Constantes da conversão kg/m³ → %vol.
export const R_GAS = 8.314, T_AMB = 288.15, P_AMB = 101325;

// σy(x) e σz(x) de Briggs, campo aberto, x em metros.
export const BRIGGS = {
  A: x => [0.22 * x / Math.sqrt(1 + 1e-4 * x), 0.20 * x],
  B: x => [0.16 * x / Math.sqrt(1 + 1e-4 * x), 0.12 * x],
  C: x => [0.11 * x / Math.sqrt(1 + 1e-4 * x), 0.08 * x / Math.sqrt(1 + 2e-4 * x)],
  D: x => [0.08 * x / Math.sqrt(1 + 1e-4 * x), 0.06 * x / Math.sqrt(1 + 1.5e-3 * x)],
  E: x => [0.06 * x / Math.sqrt(1 + 1e-4 * x), 0.03 * x / (1 + 3e-4 * x)],
  F: x => [0.04 * x / Math.sqrt(1 + 1e-4 * x), 0.016 * x / (1 + 3e-4 * x)]
};
export const CLASSES = Object.keys(BRIGGS);

// Concentração em kg/m³. p = { cls, gas, Q (kg/s), u (m/s), H (m), z (m) }.
export function concentracao(x, y, z, p) {
  if (x <= 0.5) return 0;
  const [sy, sz] = BRIGGS[p.cls](x);
  return p.Q / (2 * Math.PI * p.u * sy * sz) * Math.exp(-y * y / (2 * sy * sy)) *
    (Math.exp(-((z - p.H) ** 2) / (2 * sz * sz)) + Math.exp(-((z + p.H) ** 2) / (2 * sz * sz)));
}

export const paraPorcentagemVolume = (C, gas) => C * R_GAS * T_AMB / (P_AMB * GASES[gas].M) * 100;

// Concentração em %vol.
export const pvol = (x, y, z, p) => paraPorcentagemVolume(concentracao(x, y, z, p), p.gas);

// Maior x no eixo (y = 0, z = p.z) com %vol ≥ limiar, varrendo de 1 m a 6 km
// (passo 0,5 m até 200 m, 2 m depois). 0 se não atinge.
export function distanciaAte(limiar, p) { let ultimo = 0; for (let x = 1; x <= 6000; x += x < 200 ? 0.5 : 2) if (pvol(x, 0, p.z, p) >= limiar) ultimo = x; return ultimo; }

// Meia-largura em y da isolinha do limiar na seção x.
export function meiaLargura(x, limiar, p) { const c = pvol(x, 0, p.z, p); if (c <= limiar) return 0; const sy = BRIGGS[p.cls](x)[0]; return sy * Math.sqrt(2 * Math.log(c / limiar)); }

// Largura máxima (meia-largura) da isolinha até a distância dH.
export function meiaLarguraMaxima(dH, limiar, p) {
  let wmax = 0; for (let x = 1; x <= dH; x += Math.max(0.5, dH / 300)) wmax = Math.max(wmax, meiaLargura(x, limiar, p));
  return wmax;
}

export const SENSIBILIDADE = { u: { min: 1, max: 15, lab: "vento u (m/s)" }, Q: { min: 0.1, max: 20, lab: "vazão Q (kg/s)" }, H: { min: 0, max: 30, lab: "altura da fonte H (m)" } };

// Distância até ½LFL contra o parâmetro chave para as seis classes.
// Devolve { xs, curvas: { A: [...], ... }, atual: [x, y] }.
export function curvasSensibilidade(p, chave, nPts = 28) {
  const S = SENSIBILIDADE[chave], L = GASES[p.gas].LFL;
  const xs = Array.from({ length: nPts }, (_, i) => S.min + (S.max - S.min) * i / (nPts - 1));
  const curvas = {};
  CLASSES.forEach(c => { curvas[c] = xs.map(v => distanciaAte(L / 2, { ...p, cls: c, [chave]: v })); });
  return { xs, curvas, atual: [p[chave], distanciaAte(L / 2, p)] };
}
