# Tasks: Moeda das posições na carteira

> feature: moeda-na-carteira

## T-159 — Posições abertas na moeda da ação [concluida]

- Refs: US-109, AC-391, AC-392, AC-393
- Arquivos: .spec/features/carteiras/spec.md, src/shared/valor-com-horario.tsx, src/features/desempenho/moeda-das-posicoes.ts, src/features/desempenho/desempenho.service.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/moeda-das-posicoes.spec.tsx
- Notas: issue #62. A busca do mapa de moedas sai do serviço do Desempenho para
  `moeda-das-posicoes.ts` e é usada pelas duas telas. ASM-025 da carteira invalidada.
