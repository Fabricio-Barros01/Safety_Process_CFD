# Decisões e verificações

Registro das versões escolhidas e do que foi verificado em cada fase. Datas de
publicação conferidas nas *tags* dos repositórios oficiais.

## Fase 0 — verificado em 22/10/2026

### Ambiente local (`flake.nix`)

O `flake.lock` continua fixado no commit `fd14620` do canal `nixos-26.05`
(19/07/2026), o mesmo que o autor já usava. Não foi atualizado: o Julia desse
commit (1.12.6) é o registrado no `Manifest.toml` da raiz.

| Ferramenta | Versão no devShell | Observação |
|---|---|---|
| Julia (`julia-bin`) | 1.12.6 | igual ao `Manifest.toml` |
| Quarto (`quarto`) | 1.9.37 | ver “Quarto” abaixo |
| TeX Live | `texliveSmall` + pacotes extras | latexmk 4.87 |
| Node.js (`nodejs_24`) | 24.18.0 | linha LTS ativa |
| Python (`python3`) | 3.13.14 | só para scripts auxiliares |

Pacotes TeX acrescentados ao `scheme-small`: `latexmk`, `babel-portuges`, `lm`
(Latin Modern, carregada por `\usepackage{lmodern}`), `microtype`, `enumitem`,
`tcolorbox` e suas dependências da opção `most` (`pgf`, `environ`, `tikzfill`,
`pdfcol`, `listingsutf8`), `fancyhdr`, `titlesec`, `truncate`, `booktabs`.

Resultado: `latexmk curso/minicurso_cfd_seguranca.tex` gera
`build/curso/minicurso_cfd_seguranca.pdf` (59 páginas) sem erros. Avisos
restantes, todos vindos do `.tex` e não corrigidos (o texto é do autor):

- `babel`: o nome `brazil` está obsoleto (o novo é `brazilian`);
- `pdfTeX`: destino `page.1` duplicado (a capa e o sumário recomeçam a numeração);
- 2 *overfull* e 32 *underfull hbox*.

O pacote `quarto` do nixpkgs traz R e `rmarkdown` como dependências, o que
aumenta o primeiro download do `devShell`. Não afeta o uso.

### Quarto

- Última versão estável: **1.10.19**, publicada em 06/10/2026. As *tags*
  `v1.11.x` são pré-lançamentos.
- O nixpkgs 26.05 fixado traz a **1.9.37**.
- **Decisão pendente:** na Fase 5, o CI pode (a) usar o mesmo `devShell` do
  Nix, garantindo a mesma versão local e no CI (1.9.37), ou (b) instalar a
  1.10.19 com a Action oficial do Quarto, e então local e CI diferem.
  Recomendo (a).

### Pluto, PlutoSliderServer e Binder

Versões atuais:

| Pacote | Versão | Publicação |
|---|---|---|
| Pluto.jl | 1.0.4 | 04/10/2026 |
| PlutoSliderServer.jl | 1.9.0 | 04/07/2026 |
| `fonsp/pluto-on-binder` | `v1.0.4` | acompanha o Pluto |

Como o botão do Binder funciona hoje (lido no código-fonte de
PlutoSliderServer 1.9.0, `src/Configuration.jl` e `src/Actions.jl`, e de
Pluto 1.0.4, `src/notebook/Export.jl` e `frontend/common/Binder.js`):

1. `PlutoSliderServer.export_directory` gera um HTML estático por notebook. A
   opção `Export.offer_binder` (padrão `true`) inclui o botão “Edit or run this
   notebook”, que oferece “Run on Binder”.
2. O endereço do Binder é `Export.binder_url`. Por padrão vale
   `https://mybinder.org/v2/gh/fonsp/pluto-on-binder/v<versão do Pluto>`: uma
   imagem genérica com Julia e Pluto, mantida pelo autor do Pluto. **Não** é
   construída a partir do nosso repositório.
3. Quando o Binder sobe, o navegador do visitante envia o próprio arquivo `.jl`
   ao servidor Pluto do Binder. Com `Export.baked_notebookfile = true`
   (padrão), o `.jl` vai embutido em base64 no HTML. Com `false`, é publicado
   ao lado do HTML.
4. Consequência: **só o arquivo do notebook chega ao Binder**. Cada notebook
   precisa ser autocontido, com os pacotes declarados no próprio arquivo (o
   gerenciador de pacotes embutido do Pluto grava `Project.toml` e
   `Manifest.toml` dentro do `.jl`). O notebook não enxerga `julia/CFDSeguranca`
   nem `dados/`.
5. A imagem `pluto-on-binder v1.0.4` roda **Julia 1.10.12** (LTS), enquanto o
   ambiente local tem 1.12.6. Um Manifest gravado com 1.12 pode não servir em
   1.10. Nesse caso o Pluto tenta resolver de novo (usa `GracefulPkg`), o que
   deixa a primeira abertura ainda mais lenta.
6. Na primeira abertura, o Binder ainda instala e pré-compila os pacotes do
   notebook. Com `Plots` isso pode levar vários minutos.

Propostas para a Fase 4 (dependem de aprovação):

- os notebooks trazem o código que usam (o solver do exercício fica no próprio
  notebook); nada de `using CFDSeguranca`;
- os notebooks são gravados e exportados com Julia 1.10 (a mesma do Binder),
  via `juliaup` ou `nix shell` com `julia_110-bin`, para o Manifest embutido
  funcionar sem resolver de novo;
- medir o tempo de abertura com `Plots` e, se passar do aceitável, avaliar um
  pacote de gráficos mais leve ou um *fork* próprio de `pluto-on-binder` com os
  pacotes pré-instalados (`Export.binder_url`). O *fork* é mais rápido para o
  aluno e dá mais manutenção.

### Cantera

O Cantera não existe no nixpkgs 26.05. A alternativa, usada só para
`scripts/tabelas_cantera.py` (Fase 6), é instalar num ambiente virtual
dentro do `devShell`:

```bash
python -m venv .venv && . .venv/bin/activate && pip install cantera==3.2.0
```

A versão 3.2.0 (PyPI, 18/11/2025) era a mais recente na data da verificação.
Outra opção é o `conda-forge`. Conferir de novo a versão na Fase 6.

### Estrutura do repositório

- O repositório se chama `Safety_Process_CFD`, não `cfd-seguranca` como no
  plano. O site publicado ficará em
  `https://fabricio-barros01.github.io/Safety_Process_CFD/`.
- O `Project.toml`, o `Manifest.toml` e a pasta `Tarefa0.1/` da raiz são o
  ambiente das tarefas do autor e foram mantidos como estavam. O pacote de
  referência fica separado em `julia/CFDSeguranca/` (Fase 2).
- A saída do `latexmk` vai para `build/curso/` (configurado em `.latexmkrc`)
  e fica fora do Git.
