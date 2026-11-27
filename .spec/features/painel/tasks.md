# Tasks: Painel

> feature: painel

## T-020 — Contratos e serviço do painel [concluida]

- Refs: AC-050, AC-051, AC-053, AC-057, AC-059
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/barra-mercado.spec.tsx, src/features/painel/blocos/barra-mercado.tsx, src/features/painel/blocos/consolidado.spec.tsx, src/features/painel/blocos/consolidado.tsx, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx, src/features/painel/proximo-passo.ts
- Notas: as cinco chamadas do painel — barra de cotações, carteiras (`sort=id,desc`), consolidado de UMA carteira, cinco operações e a sonda do catálogo de corretoras (`size=1`). A barra de mercado nunca propaga erro: falha vira barra ausente (ADR-006). Nenhuma soma de carteiras acontece aqui.

## T-021 — Regra do próximo passo único [concluida]

- Refs: AC-060, AC-061, AC-062, AC-063
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx, src/features/painel/proximo-passo.spec.ts, src/features/painel/proximo-passo.ts
- Notas: função pura sobre três respostas (catálogo tem corretora? investidor tem carteira? tem operação?) devolvendo um passo só, na ordem do ADR-003. Corretora é catálogo compartilhado — a pergunta é do catálogo, não do investidor (ASM-011).

## T-022 — Lembrar a carteira escolhida no consolidado [concluida]

- Refs: AC-054
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/consolidado.spec.tsx, src/features/painel/blocos/consolidado.tsx, src/features/painel/carteira-preferida.spec.ts, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx
- Notas: guarda o identificador no armazenamento local, como o tema e a sessão já fazem, e tolera navegador sem armazenamento. Carteira guardada que não existe mais cai na mais recente.

## T-023 — Shell: navegação das áreas, tema e sair [concluida]

- Refs: AC-048, AC-049
- Arquivos: src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.ts, src/core/tema/tema.service.ts, src/layout/casca.spec.tsx, src/layout/casca.tsx
- Notas: barra superior desktop, sem menu compacto (PRD-001). Sair continua na barra (ADR-001) e o aviso de sessão acabando permanece como está. As áreas ainda sem tela recebiam rota mínima; o painel de verdade entra pela T-029. (O destino de área em construção saiu na T-079, com a última área ganhando tela.)

## T-024 — Bloco 1: barra de mercado [concluida]

- Refs: AC-050, AC-052
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/barra-mercado.spec.tsx, src/features/painel/blocos/barra-mercado.tsx, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts
- Notas: símbolo, preço e variação por item, horário de `atualizadoEm` na faixa, avisos no nível aviso e discretos. Item que não veio simplesmente não aparece.

## T-025 — Bloco 2: consolidado de uma carteira [concluida]

- Refs: AC-053, AC-054, AC-055, AC-056
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/consolidado.spec.tsx, src/features/painel/blocos/consolidado.tsx, src/features/painel/carteira-preferida.spec.ts, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx
- Notas: seletor de carteira no topo, valores em real, taxa e horário junto do número via o componente de valor com horário da fundação (marcação de defasagem incluída). Avisos do consolidado são aviso, nunca erro.

## T-026 — Bloco 3: cartões das carteiras [concluida]

- Refs: AC-057, AC-058
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/proximo-passo.ts
- Notas: nome, corretora e atalho para abrir (ASM-012 — sem valores no cartão no v1). A ordem vem do servidor; o cliente não reordena.

## T-027 — Bloco 4: últimas movimentações [concluida]

- Refs: AC-059
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/proximo-passo.ts
- Notas: cinco linhas no máximo, com atalho para o extrato. Campos conforme ASM-013, omitindo o que não vier.

## T-028 — Convite do próximo passo [concluida]

- Refs: AC-060, AC-061, AC-062, AC-064
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx, src/features/painel/proximo-passo.spec.ts, src/features/painel/proximo-passo.ts
- Notas: um convite por vez, com o texto e o atalho de cada passo. Nunca renderiza dois.

## T-029 — Tela do painel: orquestração, esqueletos e degradação [concluida]

- Refs: AC-051, AC-063, AC-064, AC-065
- Arquivos: src/core/api/pagina.ts, src/features/painel/blocos/barra-mercado.spec.tsx, src/features/painel/blocos/barra-mercado.tsx, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx, src/features/painel/proximo-passo.spec.ts, src/features/painel/proximo-passo.ts
- Notas: monta os quatro blocos na ordem, troca 2/3/4 pelo convite quando há próximo passo, mantém a barra de mercado sempre, mostra esqueleto por bloco enquanto carrega e sobrevive à falha de qualquer chamada (ASM-016). Substitui o painel provisório do passo 2.
