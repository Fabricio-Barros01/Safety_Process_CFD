#!/usr/bin/env julia

"""
Tarefa 0.1 — Difusão transiente em meio semi-infinito

Gera uma figura da solução analítica para uma face mantida à temperatura Ts:

    (T(x,t) - T0)/(Ts - T0) = erfc(x / (2√(αt)))

Uso (após instalar as dependências uma única vez):
    julia --project=. tarefa0.1.jl

Dependências: Plots.jl e SpecialFunctions.jl.
"""

using Plots
using SpecialFunctions: erfc

# Propriedades e condição de contorno (valores ilustrativos; substitua pelos
# dados do problema real quando disponíveis).
const α = 1.0e-5       # difusividade térmica [m²/s]
const T0 = 20.0        # temperatura inicial do meio [°C]
const Ts = 100.0       # temperatura imposta na face x = 0 [°C]
const tempos = [60.0, 300.0, 900.0, 1800.0]  # instantes [s]

# Domínio espacial longo o suficiente para mostrar a aproximação de T0.
xmax = 2 * 4 * sqrt(α * maximum(tempos))
x = range(0.0, xmax; length=500)

p = plot(
    xlabel="Distância da face, x [m]",
    ylabel="Temperatura, T(x,t) [°C]",
    title="Difusão transiente em meio semi-infinito",
    xlim=(0, xmax),
    ylim=(T0 - 2, Ts + 5),
    legend=:right,
    linewidth=2,
    grid=true,
)

for t in tempos
    T = [T0 + (Ts - T0) * erfc(xi / (2 * sqrt(α * t))) for xi in x]
    plot!(p, x, T; label="t = $(Int(t)) s")
end

figura = joinpath(@__DIR__, "difusao_meio_semiinfinito.png")
savefig(p, figura)
println("Figura salva em: $figura")

