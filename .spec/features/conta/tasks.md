# Tasks: Conta

> feature: conta

## T-144 — Página Minha conta: senha e e-mail [concluida]

- Refs: US-091, AC-325, US-092, AC-326, AC-327, AC-328, US-094, AC-333, AC-334, AC-335
- Arquivos: src/core/sessao/sessao.service.ts, src/features/conta/conta.ts, src/features/conta/minha-conta.tsx, src/layout/casca.tsx, src/rotas.tsx, src/features/conta/conta.spec.tsx
- Notas: `sessao.atualizar` troca token, e-mail ou identidade sem recomeçar a sessão.
  Senha nova reaproveita `validarSenha` e a força da senha do cadastro.

## T-145 — Foto de perfil na página e no topo [concluida]

- Refs: US-095, AC-336, AC-337, AC-338, AC-339
- Arquivos: src/core/api/http.ts, src/test/servidor.ts, src/features/conta/conta.ts, src/features/conta/minha-conta.tsx, src/features/conta/foto-de-perfil.tsx, src/layout/casca.tsx, src/features/conta/conta.spec.tsx
- Notas: depende de T-144. `http` passa a enviar `FormData` e a ler blob; a foto vira
  `URL.createObjectURL` e é revogada ao sair. Depois de enviar ou remover, recarrega
  `/auth/me` (as duas respostas são 204).

## T-146 — Esqueci a senha [concluida]

- Refs: US-093, AC-329, AC-330, AC-331, AC-332
- Arquivos: .spec/features/acesso/spec.md, src/features/acesso/login.spec.tsx, scripts/orcamento-bundle.mjs, src/features/acesso/acesso.ts, src/features/acesso/acesso.model.ts, src/features/acesso/esqueci-senha.tsx, src/features/acesso/login.tsx, src/rotas.tsx, src/features/acesso/esqueci-senha.spec.tsx
- Notas: substitui AC-038 (Q-048). Rota pública com o loader `visitante`, na moldura de acesso. Independe de T-144.

## T-156 — Dados pessoais e excluir a própria conta [concluida]

- Refs: US-107, AC-383, AC-384, AC-385, AC-386
- Arquivos: src/features/conta/conta.ts, src/features/conta/minha-conta.tsx, src/features/acesso/login.tsx, src/features/conta/dados-pessoais.spec.tsx
- Notas: issue #48. Só o investidor: o ADMIN recebe 403 em `/investidores`.
