# Tasks: Repaginacao acesso

> feature: repaginacao-acesso

## T-103 — Moldura da tela de acesso [concluida]
- Refs: US-069, AC-251, AC-252, AC-253
- Arquivos: src/app/features/acesso/moldura-acesso.ts, src/app/features/acesso/moldura-acesso.html, src/app/features/acesso/moldura-acesso.scss, src/app/features/acesso/moldura-acesso.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: componente compartilhado por login e cadastro — formulário de um lado,
  região de marca do outro. A região de marca é decorativa (ASM-061): sem parada
  de tabulação, `aria-hidden` no que for ornamento. Se tiver movimento, ele
  respeita `prefers-reduced-motion` e anima só `transform`/`opacity` (AC-253).
  É o único lugar do produto onde efeito visual é bem-vindo — telas de dado
  financeiro não recebem nenhum. Conteúdo da região depende de Q-032.

## T-104 — Medidor de força de senha [concluida]
- Refs: US-070, AC-255
- Arquivos: src/app/features/acesso/forca-da-senha.ts, src/app/features/acesso/forca-da-senha.html, src/app/features/acesso/forca-da-senha.scss, src/app/features/acesso/forca-da-senha.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: **deriva da política que já existe** em `validadores.ts` — oito
  caracteres, uma letra, um número — em vez de inventar critério próprio
  (ASM-063). O teste amarra as duas coisas: quando o medidor indica senha
  aceitável, `senhaValidator` também aceita, e vice-versa. Sem isso o medidor
  vira uma promessa que o formulário desmente. Comunica por texto e por
  preenchimento, nunca só por cor.

## T-105 — Tela de login [concluida]
- Refs: US-069, US-070, US-071, AC-251, AC-254, AC-256, AC-257, AC-258
- Arquivos: src/app/features/acesso/login/login.ts, src/app/features/acesso/login/login.html, src/app/features/acesso/login/login.scss, src/app/features/acesso/login/login.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: adota a moldura, o botão com indicador de carregamento junto do rótulo —
  hoje o texto vira "Entrando…", o que apaga o rótulo (AC-257) — e o foco no
  primeiro campo. **Preservar o `aria-label` acrescentado pela T-091**: esta
  tarefa reescreve o mesmo arquivo e não pode perder o rótulo acessível.

## T-106 — Tela de cadastro [pendente]

- Refs: US-069, US-070, US-071, AC-251, AC-254, AC-255, AC-256, AC-257, AC-258
- Arquivos: src/app/features/acesso/cadastro/cadastro.ts, src/app/features/acesso/cadastro/cadastro.html, src/app/features/acesso/cadastro/cadastro.scss, src/app/features/acesso/cadastro/cadastro.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: mesma moldura, mais o medidor de senha da T-104. Os quatro campos
  mantêm a máscara de CPF e as mensagens de regra já existentes (`REGRA_CPF`,
  `REGRA_SENHA`, `REGRA_EMAIL`) — são elas que satisfazem AC-254, e já dizem como
  corrigir. **Preservar o `aria-label` da T-091** nos quatro campos.
