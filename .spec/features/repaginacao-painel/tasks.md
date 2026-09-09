# Tasks: Repaginacao painel

> feature: repaginacao-painel

## T-092 — Barra de mercado: chips, superfície escura e rolagem [concluida]
- Refs: US-063, AC-233, AC-234, AC-235, AC-236, AC-237
- Arquivos: src/app/features/painel/blocos/barra-mercado.ts, src/app/features/painel/blocos/barra-mercado.html, src/app/features/painel/blocos/barra-mercado.scss, src/app/features/painel/blocos/barra-mercado.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: o coração da feature. A lista de itens é duplicada uma vez e o conjunto
  desliza com `transform: translateX(-50%)` em `animation` linear infinita —
  quando a primeira cópia sai, a segunda já está no lugar, e o loop não tem
  emenda (ASM-055). `animation-play-state: paused` no `:hover` e no `:focus-within`
  (AC-234). Bloco `@media (prefers-reduced-motion: reduce)` desliga a animação e
  devolve `overflow-x: auto` (AC-235). O carimbo "Atualizado às HH:MM" sai do
  contêiner que rola e vira região fixa à direita (AC-236, ADR-005). Usa os
  tokens `--cor-barra-mercado-*` e o selo da `fundacao-visual`. Duração da volta
  depende de Q-029.

## T-093 — Consolidado com hierarquia de número [concluida]
- Refs: US-064, AC-238, AC-239
- Arquivos: src/app/features/painel/blocos/consolidado.ts, src/app/features/painel/blocos/consolidado.html, src/app/features/painel/blocos/consolidado.scss, src/app/features/painel/blocos/consolidado.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: troca a `<dl>` chapada por cartões de indicador — rótulo pequeno em
  cima, valor grande em `--fonte-numero` com `tabular-nums`, resultado com selo
  de variação. Referência de geometria: cartões de "Patrimônio total" e "Lucro
  total" do Investidor10 em `docs/references/`. **Sem** a linha "em relação ao mês
  anterior" que aparece no StatusInvest: não há série histórica (AC-239,
  ADR-010). O seletor de carteira ganha tratamento visual, mantendo `<select>`
  nativo.

## T-094 — Últimas movimentações com monograma e selo [concluida]
- Refs: US-065, AC-240
- Arquivos: src/app/features/painel/blocos/ultimas-movimentacoes.ts, src/app/features/painel/blocos/ultimas-movimentacoes.html, src/app/features/painel/blocos/ultimas-movimentacoes.scss, src/app/features/painel/blocos/ultimas-movimentacoes.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: monograma ao lado do ticker e tipo da operação como selo com texto —
  padrão da tela "Lançamentos" do Investidor10. Valores à direita em fonte
  numérica.

## T-095 — Carteiras e convite ao próximo passo [concluida]
- Refs: US-065, AC-241
- Arquivos: src/app/features/painel/blocos/carteiras-do-investidor.ts, src/app/features/painel/blocos/carteiras-do-investidor.html, src/app/features/painel/blocos/carteiras-do-investidor.scss, src/app/features/painel/blocos/convite-proximo-passo.ts, src/app/features/painel/blocos/convite-proximo-passo.html, src/app/features/painel/blocos/convite-proximo-passo.scss, src/app/features/painel/blocos/carteiras-do-investidor.spec.ts, src/app/features/painel/blocos/convite-proximo-passo.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: carteiras viram cartões; o convite passa a usar a primitiva de estado
  vazio, com ícone, explicação e ação. A ordem obrigatória corretora → carteira →
  ação (ADR-003) continua ditando qual é o próximo passo — só a apresentação muda.

## T-096 — Composição da tela do painel [concluida]
- Refs: US-064, AC-238
- Arquivos: src/app/features/painel/painel.html, src/app/features/painel/painel.scss, src/app/features/painel/painel.spec.ts
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: grade da página, respiro entre blocos e substituição dos esqueletos de
  `<span>` vazio pela primitiva de esqueleto. Depende das quatro tarefas
  anteriores.
