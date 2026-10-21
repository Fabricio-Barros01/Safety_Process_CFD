# CFD para Segurança de Processos

Tarefas do minicurso, em Julia, num ambiente reprodutível.

## Requisitos

- Julia 1.12 (versão registrada no `Manifest.toml`: 1.12.6)
- Opcional: Nix (`nix develop` usa o `flake.nix` e fornece o Julia e as ferramentas de build)

## Execução

Na raiz do repositório:

```bash
julia --project=. -e 'using Pkg; Pkg.instantiate()' && julia --project=. Tarefa0.1/tarefa0.1.jl
```

O primeiro comando instala as versões exatas listadas no `Manifest.toml`. O segundo gera
`Tarefa0.1/difusao_meio_semiinfinito.png`.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Tarefa0.1/` | Solução analítica da difusão em meio semi-infinito (`erfc`) |

## Dependências

Plots, SpecialFunctions e BenchmarkTools. As versões estão fixadas no `Manifest.toml`.
