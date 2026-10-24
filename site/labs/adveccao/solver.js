// Advecção 1D periódica, u_t + a u_x = 0 em [0, 1] (Módulo 2).
// Funções puras, sem DOM: upwind, Lax–Wendroff, TVD com limitadores e o
// esquema escrito pelo usuário no editor.

export const EXEMPLO = `// Passo de tempo do SEU esquema (JavaScript).
// un  -> solução no passo n (só leitura)
// u   -> solução no passo n+1 (preencha)
// C   -> número de Courant, N -> número de células
// idx(j) -> índice periódico: idx(-1) = N-1, idx(N) = 0
//
// Exemplo: upwind de 1.ª ordem. Experimente trocar por
// Lax-Friedrichs: u[j] = 0.5*(un[idx(j+1)] + un[idx(j-1)])
//                      - 0.5*C*(un[idx(j+1)] - un[idx(j-1)]);
for (let j = 0; j < N; j++) {
  u[j] = un[j] - C * (un[j] - un[idx(j - 1)]);
}`;

export const NOMES = { upwind: "Upwind", lw: "Lax–Wendroff", minmod: "TVD minmod", vanleer: "TVD van Leer", superbee: "TVD superbee", meu: "Meu esquema" };

// Limitadores de fluxo ψ(r).
export const LIMITADORES = {
  minmod: r => Math.max(0, Math.min(1, r)),
  vanleer: r => (r + Math.abs(r)) / (1 + Math.abs(r)),
  superbee: r => Math.max(0, Math.min(2 * r, 1), Math.min(r, 2))
};

// Perfil inicial, periódico de período 1.
export function perfilInicial(perfil, x) { x = ((x % 1) + 1) % 1; return perfil === "quadrado" ? (x > 0.3 && x < 0.5 ? 1 : 0) : Math.exp(-(((x - 0.4) / 0.06) ** 2)); }

export const centros = N => Array.from({ length: N }, (_, j) => (j + 0.5) / N);

// Razão de gradientes r_j = (u_j − u_{j−1}) / (u_{j+1} − u_j); 0 se o
// denominador for nulo.
export function razaoGradientes(un, j, N) {
  const idx = k => (k + N) % N;
  const d = un[idx(j + 1)] - un[idx(j)], dm = un[idx(j)] - un[idx(j - 1)];
  return Math.abs(d) > 1e-14 ? dm / d : 0;
}

// Devolve passo(u, un, C), que escreve em u o passo n+1 a partir de un.
// meu: função compilada do editor (ou null). Devolve null se não houver
// esquema.
export function criarPasso(esq, N, meu = null) {
  const idx = j => (j + N) % N;
  if (esq === "upwind") return (u, un, C) => { for (let j = 0; j < N; j++) u[j] = un[j] - C * (un[j] - un[idx(j - 1)]); };
  if (esq === "lw") return (u, un, C) => { for (let j = 0; j < N; j++) { const p = un[idx(j + 1)], m = un[idx(j - 1)]; u[j] = un[j] - C / 2 * (p - m) + C * C / 2 * (p - 2 * un[j] + m); } };
  if (LIMITADORES[esq]) { const psi = LIMITADORES[esq], F = new Float64Array(N);
    return (u, un, C) => {
      for (let j = 0; j < N; j++) { const d = un[idx(j + 1)] - un[j], dm = un[j] - un[idx(j - 1)]; const r = Math.abs(d) > 1e-14 ? dm / d : 0; F[j] = un[j] + 0.5 * psi(r) * (1 - C) * d; }
      for (let j = 0; j < N; j++) u[j] = un[j] - C * (F[j] - F[idx(j - 1)]);
    }; }
  if (esq === "meu" && meu) return (u, un, C) => meu(u, un, C, N, idx);
  return null;
}

// Compila o código do editor com assinatura (u, un, C, N, idx) e testa num
// caso pequeno. Devolve { f } ou { erro }.
export function compilarCodigo(src) {
  try {
    const f = new Function("u", "un", "C", "N", "idx", src);
    const N = 8, un = new Float64Array(N).fill(1), u = new Float64Array(N);
    f(u, un, 0.5, N, j => (j + N) % N);
    return { f };
  } catch (e) { return { erro: e.message }; }
}

// Mínimo, máximo, erro L1 contra o perfil exato deslocado de s e variação total.
export function metricas(u, x, s, perfil) {
  let mn = Infinity, mx = -Infinity, l1 = 0;
  for (let j = 0; j < u.length; j++) { mn = Math.min(mn, u[j]); mx = Math.max(mx, u[j]); l1 += Math.abs(u[j] - perfilInicial(perfil, x[j] - s)) / u.length; }
  let tv = 0; for (let j = 0; j < u.length; j++) tv += Math.abs(u[(j + 1) % u.length] - u[j]);
  return { mn, mx, l1, tv };
}

// Roda cada esquema por round(N/C) passos (cerca de uma volta).
// Devolve { passos, s, linhas: [{ esq, nome, erro } ou { esq, nome, ...metricas }] }.
export function torneio({ N, C, perfil, meu = null }) {
  const passos = Math.round(N / C), s = passos * C / N, x = centros(N), linhas = [];
  Object.keys(NOMES).forEach(k => {
    const st = criarPasso(k, N, meu); if (!st) return;
    const u = new Float64Array(N), un = new Float64Array(N);
    for (let j = 0; j < N; j++) u[j] = perfilInicial(perfil, x[j]);
    try { for (let n = 0; n < passos; n++) { un.set(u); st(u, un, C); } }
    catch (e) { linhas.push({ esq: k, nome: NOMES[k], erro: true }); return; }
    linhas.push({ esq: k, nome: NOMES[k], ...metricas(u, x, s, perfil) });
  });
  return { passos, s, linhas };
}
