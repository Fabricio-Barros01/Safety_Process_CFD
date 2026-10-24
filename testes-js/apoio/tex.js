// Renderiza TeX com o MathJax 3.2.2 no Node (mesma versão das páginas) e
// lança exceção em qualquer erro de parse ou macro indefinida.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { mathjax } = require("mathjax-full/js/mathjax.js");
const { TeX } = require("mathjax-full/js/input/tex.js");
const { SVG } = require("mathjax-full/js/output/svg.js");
const { liteAdaptor } = require("mathjax-full/js/adaptors/liteAdaptor.js");
const { RegisterHTMLHandler } = require("mathjax-full/js/handlers/html.js");
const { AllPackages } = require("mathjax-full/js/input/tex/AllPackages.js");

RegisterHTMLHandler(liteAdaptor());
// Sem noerrors/noundefined: erros viram exceções em vez de texto vermelho.
const pacotes = AllPackages.filter(p => p !== "noerrors" && p !== "noundefined");
const tex = new TeX({ packages: pacotes, formatError: (_jax, err) => { throw err; } });
const doc = mathjax.document("", { InputJax: tex, OutputJax: new SVG({ fontCache: "none" }) });

export function renderizarTex(s, display = true) { return doc.convert(s, { display }); }

// Equações estáticas de um HTML: \[...\] (exibidas) e \(...\) (no texto).
export function equacoesDoHtml(caminho) {
  const html = readFileSync(caminho, "utf8");
  const ent = s => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  const out = [];
  for (const m of html.matchAll(/\\\[([\s\S]*?)\\\]/g)) out.push({ tex: ent(m[1]), display: true });
  for (const m of html.matchAll(/\\\(([\s\S]*?)\\\)/g)) out.push({ tex: ent(m[1]), display: false });
  return out;
}
