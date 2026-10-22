// Utilitários de DOM para os controles dos laboratórios.

export const $ = s => document.querySelector(s);

// Grupo de botões segmentados: marca aria-pressed no botão clicado e chama
// cb com o data-v dele.
export function ligarSegmentado(id, cb) {
  const el = $(id);
  el.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    el.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    cb(b.dataset.v);
  });
}
