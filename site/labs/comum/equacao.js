// Formatação de números (texto e TeX) e renderização das equações ao vivo.
// As funções de formatação são puras; só renderizar() toca o DOM.

// Texto com vírgula decimal e d casas.
export const nf = (x, d = 3) => Number.isFinite(x) ? x.toFixed(d).replace(".", ",") : "∞";

// Texto em notação científica para valores muito grandes ou pequenos.
export const sci = x => !Number.isFinite(x) ? "∞" : (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-3 && x !== 0)) ? x.toExponential(2).replace(".", ",") : nf(x, 4);

// Rótulo de eixo: 3 algarismos significativos, vírgula decimal.
export const tf = t => (Math.abs(t) >= 1000 ? t.toFixed(0) : String(+t.toPrecision(3))).replace(".", ",");

// Número em TeX: até 4 casas, vírgula decimal ({,}) e potência de 10 fora
// de [1e-3, 1e4).
export const T = x => {
  if (!Number.isFinite(x)) return "\\infty";
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e4)) {
    const e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
    return `${m.toFixed(2).replace(".", "{,}")}\\times10^{${e}}`;
  }
  let s = x.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  if (s === "-0" || s === "") s = "0";
  return s.replace(".", "{,}");
};

// Prefixo TeX para destacar em vermelho coeficientes ou avisos.
export const VERMELHO = "\\color{#C0392B}";

// A página define window.__mjok e dispara "mathjax-pronto" quando o MathJax
// termina de carregar (ver a configuração no HTML).
export function quandoMathJaxPronto(cb) {
  if (window.__mjok) cb();
  else document.addEventListener("mathjax-pronto", cb, { once: true });
}

// Renderiza tex no elemento id. Sem force, limita a uma renderização a cada
// 180 ms (durante a animação).
export function renderizar(id, tex, force) {
  const el = document.getElementById(id);
  if (!el || !window.__mjok || !window.MathJax || !MathJax.tex2svg) return;
  const agora = performance.now();
  if (!force && agora - (el._t || 0) < 180) return;
  el._t = agora;
  try { el.replaceChildren(MathJax.tex2svg(tex, { display: true })); } catch (e) { el.textContent = tex; }
}
