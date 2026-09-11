# Tasks: Confirmação de senha no cadastro

> feature: confirmacao-senha-cadastro

## T-125 — Validar a confirmação de senha no cadastro [concluida]

- Refs: US-081, AC-291, AC-292, AC-293, AC-294
- Arquivos: src/app/features/acesso/cadastro/cadastro.ts, src/app/features/acesso/cadastro/cadastro.html, src/app/features/acesso/cadastro/cadastro.spec.ts
- Notas: a comparação pertence ao formulário por depender de dois controles; o campo é somente local e nunca integra o corpo de `POST /auth/cadastro`.
