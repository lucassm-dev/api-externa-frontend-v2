# Tasks: Identidade e papel

> feature: identidade-papel

## T-140 — Identidade na sessão, papel no menu e nas rotas [concluida]

- Refs: US-086, AC-311, AC-312, AC-313, US-087, AC-316
- Arquivos: src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.ts, src/core/sessao/sessao.guard.ts, src/features/acesso/acesso.ts, src/features/acesso/login.tsx, src/layout/areas.ts, src/layout/casca.tsx, src/rotas.tsx, src/features/identidade-papel.spec.tsx
- Notas: a identidade (`papel`, `nome`, `fotoUrl`) entra na sessão guardada; o login só
  termina depois de `GET /auth/me`. Dois loaders novos (`exigirInvestidor`, `exigirAdmin`)
  em cima de `exigirSessao`.

## T-141 — Corretora só leitura para investidor [concluida]

- Refs: US-088, AC-317, AC-318
- Arquivos: src/features/corretoras/lista-corretoras.tsx, src/features/corretoras/detalhe-corretora.tsx, src/features/corretoras/corretoras.spec.tsx, src/rotas.tsx, src/features/identidade-papel.spec.tsx
- Notas: depende de T-140 (`sessao.papel()` e `exigirAdmin`).

## T-142 — Ação entra pela pesquisa, sem remover [concluida]

- Refs: US-089, AC-319, AC-320, AC-321
- Arquivos: src/features/acoes/acoes.service.ts, src/features/acoes/cadastro-acao.tsx, src/features/acoes/detalhe-acao.tsx, src/features/acoes/acoes.spec.tsx, src/features/identidade-papel.spec.tsx
- Notas: substitui AC-125 a AC-129 e AC-143 a AC-146 (marcados na spec de ações).

## T-143 — Códigos de erro novos do contrato [concluida]

- Refs: US-090, AC-322, AC-323, AC-324
- Arquivos: src/core/erros/catalogo-erros.ts, src/core/erros/tradutor-erro.spec.ts, src/features/identidade-papel.spec.tsx, scripts/orcamento-bundle.mjs
- Notas: textos a partir de `docs/erros.md` do backend. Teto do bundle sobe para 475/142 kB (Q-046).
