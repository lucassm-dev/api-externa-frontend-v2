# Tasks: Repaginacao tabelas

> feature: repaginacao-tabelas

## T-097 — Dependência de tabela e ordenação compartilhada [pendente]

- Refs: US-066, AC-242, AC-243
- Arquivos: package.json, package-lock.json, src/app/shared/tabela/ordenacao.ts, src/app/shared/tabela/ordenacao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: instala `@tanstack/angular-table` (D2 do RFC-001) e cria o utilitário que
  todas as tabelas usam: recebe as linhas da página e a coluna escolhida, devolve
  a ordem, alterna o sentido e expõe o estado para o cabeçalho anunciar
  (`aria-sort`). Ordena só o que já está carregado — sem nova consulta, sem
  troca de página (AC-243, ADR-010). Bloqueia as demais tarefas desta feature.

## T-098 — Cabeçalho ordenável [pendente]

- Refs: US-066, AC-242
- Arquivos: src/app/shared/tabela/cabecalho-ordenavel.ts, src/app/shared/tabela/cabecalho-ordenavel.html, src/app/shared/tabela/cabecalho-ordenavel.scss, src/app/shared/tabela/cabecalho-ordenavel.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: `<th>` com botão interno, glifo de duas setas indicando o sentido e
  `aria-sort` refletindo o estado — padrão observado no Investidor10 e no
  StatusInvest em `docs/references/`. O glifo é decorativo; quem anuncia é o
  `aria-sort` e o nome do botão.

## T-099 — Estilo base de tabela [pendente]

- Refs: US-067, AC-244, AC-245
- Arquivos: src/app/shared/tabela/tabela.scss
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: folha compartilhada com densidade, zebra sutil, destaque de linha sob o
  ponteiro, cabeçalho fixo e alinhamento numérico à direita com `tabular-nums` em
  `--fonte-numero`. Só tokens, nenhuma cor literal (P-003).

## T-100 — Extrato de operações [pendente]

- Refs: US-066, US-067, US-068, AC-244, AC-246, AC-247, AC-248, AC-249, AC-250
- Arquivos: src/app/features/operacoes/extrato/extrato-operacoes.ts, src/app/features/operacoes/extrato/extrato-operacoes.html, src/app/features/operacoes/extrato/extrato-operacoes.scss, src/app/features/operacoes/extrato/extrato-operacoes.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: a tabela mais visível do produto. Ganha ordenação, monograma no ticker,
  selo no tipo e no resultado, botões de ícone no lugar de "Editar"/"Excluir", e o
  paginador da `fundacao-visual` no lugar dos dois botões atuais. O diálogo de
  confirmação de exclusão continua exatamente como está (ADR-007). Colunas
  ordenáveis dependem de Q-031.

## T-101 — Posições e movimentações da carteira [pendente]

- Refs: US-066, US-067, AC-244, AC-246, AC-247, AC-250
- Arquivos: src/app/features/carteiras/detalhe/posicoes-carteira.ts, src/app/features/carteiras/detalhe/posicoes-carteira.html, src/app/features/carteiras/detalhe/posicoes-carteira.scss, src/app/features/carteiras/detalhe/movimentacoes-carteira.ts, src/app/features/carteiras/detalhe/movimentacoes-carteira.html, src/app/features/carteiras/detalhe/movimentacoes-carteira.scss, src/app/features/carteiras/detalhe/posicoes-carteira.spec.ts, src/app/features/carteiras/detalhe/movimentacoes-carteira.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: mesmo tratamento do extrato. As posições são a tela mais parecida com o
  bloco "Posições" do Investidor10 — usar aquela referência para a ordem e o peso
  das colunas. O aviso de cotação defasada continua com marcação além da cor.

## T-102 — Listas de ações, corretoras e carteiras [pendente]

- Refs: US-067, US-068, AC-245, AC-247, AC-248, AC-249, AC-250
- Arquivos: src/app/features/acoes/lista/lista-acoes.ts, src/app/features/acoes/lista/lista-acoes.html, src/app/features/acoes/lista/lista-acoes.scss, src/app/features/corretoras/lista/lista-corretoras.ts, src/app/features/corretoras/lista/lista-corretoras.html, src/app/features/corretoras/lista/lista-corretoras.scss, src/app/features/carteiras/lista/lista-carteiras.ts, src/app/features/carteiras/lista/lista-carteiras.html, src/app/features/carteiras/lista/lista-carteiras.scss, src/app/features/acoes/lista/lista-acoes.spec.ts, src/app/features/corretoras/lista/lista-corretoras.spec.ts, src/app/features/carteiras/lista/lista-carteiras.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: as três listas do catálogo. Ações ganham monograma; corretoras mantêm o
  selo de uso já existente, agora sobre a primitiva de selo; carteiras viram
  cartões clicáveis. Estado vazio e esqueleto padronizados nas três.
