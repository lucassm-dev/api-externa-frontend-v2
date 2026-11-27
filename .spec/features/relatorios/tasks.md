# Tasks: Relatórios do investidor

> feature: relatorios

## T-160 — Área Relatórios com filtros, totais e tabela; Operações sem filtros [concluida]

- Refs: US-110, AC-394, AC-395, AC-396, AC-397, AC-398, AC-399, AC-400, AC-401
- Arquivos: .spec/features/filtros-extrato/spec.md, .spec/features/filtros-extrato/tasks.md, .spec/features/painel/spec.md, .spec/features/painel/tasks.md, .spec/features/identidade-papel/spec.md, .spec/features/identidade-papel/tasks.md, src/layout/casca.spec.tsx, src/features/identidade-papel.spec.tsx, src/layout/areas.ts, src/rotas.tsx, src/features/operacoes/operacoes.model.ts, src/features/operacoes/operacoes.tsx, src/features/operacoes/extrato-operacoes.tsx, src/features/operacoes/filtros-extrato.spec.tsx, src/features/relatorios/relatorios.tsx, src/features/relatorios/totais-do-recorte.ts, src/features/relatorios/relatorios.spec.tsx
- Notas: issue #64. Substitui AC-340, AC-342 a AC-344, AC-346 e AC-347 (Q-055). Reaproveita
  a barra de filtros e a tabela do extrato, que ganha modo só leitura.
