{
  description = "CFD para Segurança de Processos — curso, laboratórios e site";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        # TeX Live mínimo para compilar curso/minicurso_cfd_seguranca.tex.
        # O scheme-small já traz babel, hyperref, amsmath, geometry, xcolor,
        # listings etc.; aqui entram só os pacotes que faltam nele.
        tex = pkgs.texliveSmall.withPackages (ps: with ps; [
          latexmk
          babel-portuges
          lm            # fontes Latin Modern (pacote lmodern)
          microtype
          enumitem
          tcolorbox
          pgf
          environ
          tikzfill
          pdfcol
          listingsutf8
          fancyhdr
          titlesec
          truncate
          booktabs
        ]);
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.julia-bin   # binario oficial; o gerenciador de pacotes do
                             # proprio Julia (Pkg) cuida das dependencias no
                             # Project.toml / Manifest.toml do projeto.

            # Ferramentas de build que alguns pacotes Julia com componente
            # nativo (ex.: os que compilam via BinaryBuilder localmente) pedem:
            pkgs.gcc
            pkgs.gnumake

            pkgs.quarto      # site (site/_quarto.yml)
            tex              # PDF do curso (latexmk)
            pkgs.nodejs_24   # testes dos laboratorios (node:test), LTS ativa

            # Python so para scripts auxiliares. O Cantera nao existe no
            # nixpkgs: ver docs/decisoes.md (instalacao via pip num venv).
            pkgs.python3
          ];

          shellHook = ''
            echo "Julia   $(julia --version | cut -d' ' -f3)"
            echo "Quarto  $(quarto --version)"
            echo "Node    $(node --version)"
            echo "latexmk $(latexmk -v | grep -o 'Version [^ ]*' | head -1)"
            echo "-> julia --project=.          (ambiente das tarefas)"
            echo "-> latexmk curso/minicurso_cfd_seguranca.tex   (PDF em build/curso/)"
          '';
        };
      });
}
