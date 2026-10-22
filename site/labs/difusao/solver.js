// Difusão 1D, u_t = u_xx em [0, 1] com u = 0 nas bordas (Módulo 1).
// Funções puras, sem DOM: método θ (FTCS, BTCS, Crank–Nicolson) e TDMA.

// θ de cada esquema: 0 explícito, 1 implícito, ½ Crank–Nicolson.
export const THETA = { ftcs: 0, btcs: 1, cn: 0.5 };

// Coeficientes de Fourier em seno do pulso unitário em [0,4; 0,6].
const NMODOS = 400;
const bn = [];
for (let k = 1; k <= NMODOS; k++) bn[k] = 2 / (k * Math.PI) * (Math.cos(k * Math.PI * 0.4) - Math.cos(k * Math.PI * 0.6));

export function condicaoInicial(ic, x) { return ic === "seno" ? Math.sin(Math.PI * x) : (x > 0.4 && x < 0.6 ? 1 : 0); }

// Solução exata: um modo para o seno; série de Fourier truncada para o pulso.
export function solucaoExata(ic, x, t) {
  if (ic === "seno") return Math.exp(-Math.PI * Math.PI * t) * Math.sin(Math.PI * x);
  let s = 0;
  for (let k = 1; k <= NMODOS; k++) { const e = Math.exp(-k * k * Math.PI * Math.PI * t); if (e < 1e-12) break; s += bn[k] * e * Math.sin(k * Math.PI * x); }
  return s;
}

// Estado inicial com N células (N + 1 nós) e r = αΔt/Δx² (α = 1).
export function criarEstado({ esq, ic, r, N }) {
  const x = Array.from({ length: N + 1 }, (_, j) => j / N);
  const u = new Float64Array(N + 1); for (let j = 0; j <= N; j++) u[j] = condicaoInicial(ic, x[j]);
  u[0] = u[N] = 0;
  return { esq, ic, r, N, dx: 1 / N, x, u, t: 0, n: 0 };
}

export const passoDeTempo = e => e.r * e.dx * e.dx;

// Algoritmo de Thomas para a·u[i-1] + b·u[i] + c·u[i+1] = d[i], i = 0..n-1,
// com coeficientes constantes. Escreve a solução em s[desl .. desl+n-1].
export function tdma(a, b, c, d, s, desl = 0) {
  const n = d.length, cp = new Float64Array(n), dp = new Float64Array(n);
  cp[0] = c / b; dp[0] = d[0] / b;
  for (let i = 1; i < n; i++) { const mm = b - a * cp[i - 1]; cp[i] = c / mm; dp[i] = (d[i] - a * dp[i - 1]) / mm; }
  s[desl + n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) s[desl + i] = dp[i] - cp[i] * s[desl + i + 1];
  return s;
}

// Avança um passo de tempo no lugar (e.u, e.t, e.n).
export function passo(e) {
  const N = e.N, r = e.r, u = e.u;
  if (e.esq === "ftcs") {
    const un = u.slice();
    for (let j = 1; j < N; j++) u[j] = un[j] + r * (un[j + 1] - 2 * un[j] + un[j - 1]);
  } else {
    const th = THETA[e.esq], n = N - 1;
    const d = new Float64Array(n);
    for (let i = 0; i < n; i++) { const j = i + 1; d[i] = u[j] + r * (1 - th) * (u[j + 1] - 2 * u[j] + u[j - 1]); }
    tdma(-r * th, 1 + 2 * r * th, -r * th, d, u, 1);
  }
  e.t += r * e.dx * e.dx; e.n++;
}

// Fator de amplificação de von Neumann G(kΔx) do método θ.
export function fatorAmplificacao(esq, r, kdx) {
  const s = Math.sin(kdx / 2) ** 2;
  return esq === "ftcs" ? 1 - 4 * r * s : esq === "btcs" ? 1 / (1 + 4 * r * s) : (1 - 2 * r * s) / (1 + 2 * r * s);
}

// Máximo de |u| e erro máximo contra a solução exata no instante atual.
export function medidas(e) {
  let mx = 0, er = 0;
  for (let j = 0; j <= e.N; j++) { mx = Math.max(mx, Math.abs(e.u[j])); er = Math.max(er, Math.abs(e.u[j] - solucaoExata(e.ic, e.x[j], e.t))); }
  return { mx, er };
}
