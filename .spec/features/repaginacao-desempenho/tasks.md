# Tasks: Repaginacao desempenho

> feature: repaginacao-desempenho

## T-107 — Geometria da rosca [concluida]
- Refs: US-072, AC-259
- Arquivos: src/app/features/desempenho/blocos/setores-da-rosca.ts, src/app/features/desempenho/blocos/setores-da-rosca.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: função pura que recebe as participações e devolve os caminhos SVG dos
  setores. É só trigonometria — sem biblioteca de gráficos, porque o ADR-010 já
  eliminou o caso que justificaria uma (D3 do RFC-001). Trata os casos que
  quebram desenho de rosca: fatia única de 100%, fatias muito pequenas e soma que
  não fecha. Testável sozinha, sem renderizar componente.

## T-108 — Composição em rosca [concluida]
- Refs: US-072, AC-259, AC-260, AC-261, AC-262
- Arquivos: src/app/features/desempenho/blocos/grafico-composicao.ts, src/app/features/desempenho/blocos/grafico-composicao.html, src/app/features/desempenho/blocos/grafico-composicao.scss, src/app/features/desempenho/blocos/grafico-composicao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: troca as barras horizontais pela rosca da T-107, mantendo a legenda com
  ticker, valor e participação em texto (AC-260 — a cor acompanha, nunca carrega).
  Destaque cruzado fatia↔legenda por `:hover` e por estado compartilhado
  (AC-261). A ressalva de soma que não fecha continua exatamente como está — é o
  que impede um gráfico "bonito e mentiroso" (AC-262). Cauda agrupada depende de
  Q-033; total no centro depende de Q-034. As cores de série não mudam.

## T-109 — Contribuição com linha de zero [pendente]

- Refs: US-073, AC-263
- Arquivos: src/app/features/desempenho/blocos/grafico-contribuicao.ts, src/app/features/desempenho/blocos/grafico-contribuicao.html, src/app/features/desempenho/blocos/grafico-contribuicao.scss, src/app/features/desempenho/blocos/grafico-contribuicao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: barras divergentes a partir de uma linha de zero comum, positivas para
  um lado e negativas para o outro, cada valor com sinal em texto. Referência de
  forma: o bloco "Consolidação de aportes" do Investidor10 em `docs/references/`,
  que usa compras acima e vendas abaixo do zero.

## T-110 — Realizado por ticker [pendente]

- Refs: US-073, AC-263
- Arquivos: src/app/features/desempenho/blocos/grafico-realizado.ts, src/app/features/desempenho/blocos/grafico-realizado.html, src/app/features/desempenho/blocos/grafico-realizado.scss, src/app/features/desempenho/blocos/grafico-realizado.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: mesmo tratamento da contribuição, com selo de resultado por ticker.
  Ordenação do maior ganho à maior perda, mantendo o sinal explícito.

## T-111 — Números do desempenho e composição da tela [pendente]

- Refs: US-074, AC-264, AC-265
- Arquivos: src/app/features/desempenho/blocos/numeros-desempenho.ts, src/app/features/desempenho/blocos/numeros-desempenho.html, src/app/features/desempenho/blocos/numeros-desempenho.scss, src/app/features/desempenho/desempenho.html, src/app/features/desempenho/desempenho.scss, src/app/features/desempenho/blocos/numeros-desempenho.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: os números viram cartões de indicador com rótulo pequeno, valor grande em
  fonte numérica e selo de variação, como no consolidado do painel. A tela ganha
  grade e respiro entre blocos. **Nenhum indicador com comparação de período** —
  é o que AC-265 prova, e é a diferença honesta entre nós e o StatusInvest, que
  exibe "em relação ao mês anterior" em todo cartão.
