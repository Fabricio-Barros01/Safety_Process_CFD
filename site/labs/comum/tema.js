// Cores dos laboratórios via variáveis CSS e aviso de troca de tema.

// Valor atual de uma variável CSS da raiz (ex.: cor("--num")).
export const cor = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

// Chama cb quando o tema do sistema ou o atributo data-theme muda.
export function aoMudarTema(cb) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", cb);
  new MutationObserver(cb).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
}
