# Tasks: Administração

> feature: administracao

## T-149 — Área de usuários: entrada do ADMIN, lista, filtros e totais [concluida]

- Refs: US-098, AC-348, AC-349, AC-350, US-099, AC-351, AC-352, AC-353, AC-354
- Arquivos: .spec/features/identidade-papel/spec.md, .spec/features/identidade-papel/tasks.md, src/core/sessao/sessao.model.ts, src/core/sessao/sessao.guard.ts, src/layout/areas.ts, src/layout/casca.tsx, src/rotas.tsx, src/features/identidade-papel.spec.tsx, src/features/admin/admin.model.ts, src/features/admin/admin.service.ts, src/features/admin/usuarios.tsx, src/features/admin/usuarios.spec.tsx
- Notas: issue #31. Substitui AC-314 e AC-315 (Q-050).

## T-150 — Bloquear e desbloquear usuário [concluida]

- Refs: US-100, AC-355, AC-356, AC-357, AC-358, AC-359
- Arquivos: src/components/ui/dialogo-confirmacao.tsx, src/features/admin/admin.service.ts, src/features/admin/usuarios.tsx, src/features/admin/bloqueio.spec.tsx
- Notas: issue #32. O diálogo de confirmação ganha um espaço para campo, que a descontinuação
  de corretora (#35) também usa.

## T-151 — Criar administrador [concluida]

- Refs: US-101, AC-360, AC-361, AC-362, AC-363, AC-364
- Arquivos: src/rotas.tsx, src/features/admin/admin.service.ts, src/features/admin/usuarios.tsx, src/features/admin/novo-admin.tsx, src/features/admin/novo-admin.spec.tsx
- Notas: issue #33. Mesma política de senha, confirmação e força da senha do cadastro.

## T-152 — Relatório de uso da API [concluida]

- Refs: US-102, AC-365, AC-366, AC-367, AC-368, AC-369, AC-370
- Arquivos: scripts/orcamento-bundle.mjs, src/layout/areas.ts, src/rotas.tsx, src/features/admin/admin.model.ts, src/features/admin/admin.service.ts, src/features/admin/uso.tsx, src/features/admin/uso.spec.tsx
- Notas: issue #34. Barras na cor `--cor-serie-1`, validada no tema claro e no escuro com o
  validador da skill dataviz; o valor fica em texto ao lado da barra. Teto do bundle sobe para
  480/144 kB (Q-051).
