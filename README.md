# CFD para Segurança de Processos

Minicurso autodirigido de CFD aplicado a dispersão de gases, incêndio e
explosão, com laboratórios interativos e tarefas em Julia. O objetivo é um site
público no GitHub Pages com uma página por módulo, simulações no navegador,
notebooks Pluto executáveis no Binder e o PDF do curso gerado a cada *push*.

O andamento segue o plano de implementação por fases. As decisões e versões
verificadas estão em [`docs/decisoes.md`](docs/decisoes.md).

## Requisitos

- Nix com *flakes* (recomendado): `nix develop` fornece Julia 1.12, Quarto,
  TeX Live, Node.js 24 e Python 3.
- Sem Nix: Julia 1.12 (versão registrada em `tarefas/Manifest.toml`: 1.12.6), uma
  distribuição TeX com `latexmk`, Quarto e Node.js LTS.

## Uso

Entrar no ambiente:

```bash
nix develop
```

Compilar o PDF do curso (sai em `build/curso/minicurso_cfd_seguranca.pdf`):

```bash
latexmk curso/minicurso_cfd_seguranca.tex
```

Rodar uma tarefa em Julia, na raiz do repositório:

```bash
julia --project=tarefas -e 'using Pkg; Pkg.instantiate()' && julia --project=tarefas tarefas/Tarefa0.1/tarefa0.1.jl
```

O primeiro comando instala as versões exatas listadas em
`tarefas/Manifest.toml`. O segundo gera
`tarefas/Tarefa0.1/difusao_meio_semiinfinito.png`.

O protótipo dos laboratórios abre direto no navegador:
`prototipo/laboratorio_cfd.html`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `curso/` | Fonte LaTeX do curso (17 módulos + Oficina de Julia) |
| `prototipo/` | Protótipo dos laboratórios de difusão, advecção e pluma (referência para a Fase 1) |
| `tarefas/` | Tarefas do curso resolvidas pelo autor e o ambiente Julia delas; `Tarefa0.1/` traz a solução analítica da difusão em meio semi-infinito (`erfc`) |
| `site/` | Projeto Quarto do site e JavaScript dos laboratórios (a partir da Fase 1) |
| `julia/` | Pacote de referência `CFDSeguranca.jl` (Fase 2) |
| `notebooks/` | Notebooks Pluto, um por tarefa (Fase 4) |
| `dados/` | Dados de validação, cada um com cabeçalho de fonte |
| `fixtures/` | Saídas do Julia usadas nos testes JavaScript (Fase 2) |
| `scripts/` | Geração de *fixtures*, exportação de notebooks, tabelas do Cantera |
| `testes-js/` | Testes `node:test` dos laboratórios |
| `docs/` | Decisões de projeto e versões verificadas |

## Dependências das tarefas

Plots, SpecialFunctions e BenchmarkTools, com versões fixadas em
`tarefas/Manifest.toml`.

## Licenças

- Código: MIT (ver `LICENSE`).
- Texto do curso e conteúdo do site: CC BY-SA 4.0 (ver
  `LICENSE-CC-BY-SA-4.0.txt`).
