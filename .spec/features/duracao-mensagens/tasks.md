# Tasks: Duração das mensagens do painel

> feature: duracao-mensagens

## T-162 — Tempo de saída e botão de dispensar no painel de feedback [concluida]

- Refs: US-112, AC-406, AC-407, AC-408
- Arquivos: src/core/feedback/feedback.service.ts, src/core/feedback/painel-feedback.tsx, src/core/feedback/painel-feedback.spec.tsx, src/core/feedback/conteudo-notificacao.tsx, src/core/feedback/notificacao.tsx, src/core/feedback/notificacao.spec.tsx, src/components/ui/padrao-unico.spec.ts
- Notas: issue #68. Reaproveita o conteúdo da notificação (mensagem e botão de dispensar), que sai para um arquivo próprio para não puxar o sonner ao bundle inicial.
