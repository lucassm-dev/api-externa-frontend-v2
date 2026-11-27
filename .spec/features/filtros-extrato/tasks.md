# Tasks: Filtros no extrato

> feature: filtros-extrato

## T-147 — Filtros de período, ticker, carteira e tipo no extrato [concluida]

- Refs: US-096, AC-341, AC-345
- Arquivos: .spec/features/operacoes/spec.md, .spec/features/operacoes/tasks.md, .spec/features/operacoes/tasks-angular.md, src/features/operacoes/operacoes.service.ts, src/features/operacoes/operacoes.service.spec.ts, src/features/operacoes/filtros-extrato.tsx, src/features/operacoes/extrato-operacoes.tsx, src/features/operacoes/extrato-operacoes.spec.tsx, src/features/operacoes/operacoes.tsx, src/features/operacoes/operacoes.spec.tsx, src/features/operacoes/filtros-extrato.spec.tsx
- Notas: substitui AC-172 (Q-049). O recorte mora na busca da URL e é a única fonte; a
  página relê o extrato quando ela muda. A contagem do rodapé passa a vir de `totalElements`.

## T-148 — Filtro de lucro ou prejuízo [concluida]

- Refs: US-110
- Arquivos: src/features/operacoes/filtros-extrato.tsx, src/features/operacoes/filtros-extrato.spec.tsx
- Notas: US-097 e os critérios dela passaram para os Relatórios (US-110, #64); o filtro de
  resultado continua lá. depende de T-147. Só vendas entram (ADR-018 do backend).
