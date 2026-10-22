// Página avulsa com os três laboratórios em abas (equivalente ao protótipo).

import { montarDifusao } from "./difusao/pagina.js";
import { montarAdveccao } from "./adveccao/pagina.js";
import { montarPluma } from "./pluma/pagina.js";
import { aoMudarTema } from "./comum/tema.js";
import { quandoMathJaxPronto } from "./comum/equacao.js";

const labs = { difusao: montarDifusao(), adveccao: montarAdveccao(), pluma: montarPluma() };
let ativo = "difusao";

const redesenhar = () => labs[ativo].redesenhar();

function mostrar(aba) {
  if (!document.getElementById("lab-" + aba)) aba = "difusao";
  ativo = aba;
  document.querySelectorAll("nav.tabs button").forEach(b => b.setAttribute("aria-selected", String(b.dataset.tab === aba)));
  document.querySelectorAll(".lab").forEach(s => s.classList.toggle("active", s.id === "lab-" + aba));
  Object.keys(labs).forEach(k => { if (k !== aba) labs[k].parar(); });
  redesenhar();
}

document.querySelector("nav.tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) mostrar(b.dataset.tab); });
let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(redesenhar, 120); });
aoMudarTema(redesenhar);
window.addEventListener("hashchange", () => mostrar(location.hash.slice(1)));
quandoMathJaxPronto(redesenhar);

mostrar((location.hash || "#difusao").slice(1));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(redesenhar);
