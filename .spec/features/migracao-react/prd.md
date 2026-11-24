<!-- onp-spec:documentation-contract=v1 -->

# PRD: migracao react

> feature: migracao-react
> status: revisado

[ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Pedido original do cliente

> quero que migra a linguagem desse projeto api-externa-frontend-v2 que hoje esta em angular, quero que faz a troca para react, utilizando as bibliotecas que te passei para melhorar componentes, deixar o front mais bonito não quero que muda a logica de como esta, somente a linguagem e deixa mais bonito, utilize a skill /onp-spec-driven-claude-v4-0-0 para fazer isso, vamos fazer em loop e utliza a skill /impeccable para ajudar na estilização.

Origem: mensagem de Lucas no chat do Claude Code, 2026-11-22, reenviada com `/loop` depois de recusar a bateria de perguntas. Antes do pedido, o cliente mandou fazer uma cópia de segurança do projeto Angular (`../api-externa-frontend-v2-backup-angular`, criada no mesmo dia).

"As bibliotecas que te passei" são as 16 da lista de 2026-09-09 (ReUI, Liquid Metal, StyleUI, Skiper UI, Ali Imam, Watermelon UI, Cult UI, Dot Matrix, Componentry, Aceternity UI, Magic UI, HeroUI, Balloons.js, Shadcn Blocks, Square UI, Eldora UI), registradas no [RFC-001](../../../docs/rfc/RFC-001-v1-estrategia-de-ui-e-bibliotecas.md).

## Problema, público e contexto

**Nas palavras do cliente:** trocar a linguagem para React, usar as bibliotecas que ele escolheu e deixar o front mais bonito, sem mudar a lógica.

**Interpretação da equipe (IA):** o investidor continua com o mesmo produto: as mesmas telas, rotas, regras, mensagens, chamadas ao backend e degradações. Muda a tecnologia de apresentação, e a camada visual passa a usar o ecossistema React + Tailwind + shadcn/ui, onde vivem 15 das 16 bibliotecas. Em Angular elas eram só referência visual (RFC-001, "Achado que redefine o problema"); em React viram dependência real.

Público: o investidor pessoa física descrito no [PRD-001](../../../docs/prd/PRD-001-v1-visao-produto-frontend.md). Mantenedor: Lucas, desenvolvedor único.

## Resultados desejados e métricas

| Resultado | Linha de base (2026-11-22) | Meta | Fonte |
|---|---|---|---|
| Comportamento preservado | 298 critérios de aceite, 298 com teste, 295 provados (3 com prova desatualizada) | 298/298 provados por testes React depois do corte | `onp-spec audit --ci` |
| Sem Angular no produto | 12 pacotes `@angular/*`, `@lucide/angular`, `@tanstack/angular-table`, `ngx-oneforall` | nenhum pacote Angular em `package.json` | AC-305 |
| Cor só nos tokens | P-003 verificado em `src/app/**/*.scss` | mesma regra verificada no código React | AC-300 |
| Mais bonito | sem métrica objetiva | crítica da skill `impeccable` por tela, com as recomendações aplicadas ou registradas | revisão por rodada |

"Mais bonito" não tem métrica numérica honesta. A prova é a crítica da skill `impeccable` aplicada a cada tela, mais os critérios mecânicos de contraste, movimento reduzido e ausência de cor literal.

## Requisitos e prioridades

| Requisito | Palavras do cliente / origem | Prioridade | Critérios na spec |
|---|---|---|---|
| Trocar Angular por React | "faz a troca para react" | DEVE | AC-299, AC-305 |
| Não mudar a lógica | "não quero que muda a logica de como esta, somente a linguagem" | DEVE | os 298 critérios existentes, portados com a mesma tag; AC-299 |
| Usar as bibliotecas enviadas | "utilizando as bibliotecas que te passei para melhorar componentes" | DEVE | AC-303 |
| Deixar mais bonito | "deixar o front mais bonito" | DEVE | AC-302, AC-304; crítica `impeccable` |
| Manter as regras visuais já aprovadas | constituição P-003, PRD-001 (dois temas) | DEVE | AC-300, AC-301 |
| Corrigir os bugs achados no Angular | "quero que corriga os bugs que achou em angular para react" (2026-11-23) | DEVE | AC-306 a AC-310 |
| Trabalhar em loop, com a skill onp e a impeccable | "vamos fazer em loop", "utilize a skill", "utliza a skill /impeccable" | DEVE | processo (tarefas T-127 a T-138) |

## Escopo e exclusões

**Entra:** reescrever `core/`, `shared/`, `layout/` e as 7 features em React + TypeScript; portar os testes com a mesma tag `@spec:AC-xxx`; adotar Tailwind v4 + shadcn/ui e componentes das bibliotecas gratuitas da lista; aplicar a skill `impeccable` tela a tela; fazer o corte final (remover Angular e promover o React à raiz).

**Não entra:**
- Mudar regra, contrato com o backend, mensagem de erro, rota ou fluxo.
- Funcionalidade nova. Exemplo: série histórica e "vs mês anterior" continuam proibidos pelo [ADR-010](../../../docs/adr/010-consultas-paginadas-sem-filtro-e-sem-serie-historica.md).
- Bibliotecas pagas da lista (Watermelon UI, Componentry, Skiper UI Pro, Aceternity Pro). Só entram componentes gratuitos.
- Trocar a casca de navegação no topo por barra lateral. O RFC-001 registrou isso como mudança de layout, não de estilo.

## Regras de produto e domínios

Continuam valendo sem exceção:

- os PRD-001 a PRD-009;
- os ADR-001 a ADR-010;
- a constituição v1.2.0 (P-001 a P-004).

Domínios atingidos: todos os sete (acesso, painel, corretoras, carteiras, ações, operações, desempenho), mais o transversal de confiabilidade (PRD-009).

Decisões anteriores que o pedido contraria:

- [RFC-001](../../../docs/rfc/RFC-001-v1-estrategia-de-ui-e-bibliotecas.md), Opção 1 e D6: Tailwind recusado.
- [RFC-002](../../../docs/rfc/RFC-002-v1-zard-ui-e-ngx-oneforall.md), Opção 1: Zard recusado por exigir Tailwind; ngx-oneforall adotado.

As duas foram tomadas para um projeto Angular. O pedido novo troca a premissa: em React, as bibliotecas escolhidas exigem Tailwind. A decisão está registrada no [ADR](adr.md) e os RFCs ficam preservados como histórico.

## Dependências, riscos e suposições

- **Dependências:** Node ≥ 18, npm, backend em `http://localhost:8080` (o mesmo de hoje) e registros públicos do npm e do shadcn.
- **Riscos:** teste portado que deixa de provar o mesmo comportamento; regressão visual; componente de biblioteca que anima sem respeitar movimento reduzido. Detalhes no [TDD](design.md#6-riscos-e-mitigação).
- **Suposições:** ASM-073 a ASM-076 na [spec](spec.md#suposições).

## Validação com o cliente

| Pergunta | Resposta literal | Origem | Data |
|---|---|---|---|
| Migrar para React usando as bibliotecas enviadas, sem mudar a lógica? | "quero que faz a troca para react, utilizando as bibliotecas que te passei para melhorar componentes, deixar o front mais bonito não quero que muda a logica de como esta" | chat, 2026-11-22 | 2026-11-22 |
| Estilo (Tailwind + shadcn ou CSS Modules), local, loop e testes | A bateria de perguntas foi recusada e o pedido foi reenviado com `/loop`. Adotados: Tailwind + shadcn (exigência das bibliotecas pedidas), migração nesta pasta na branch `migracao-react` (backup já feito), loop dinâmico e porte de todos os testes (P-001) | chat, 2026-11-22 | 2026-11-22 |
| Corrigir os bugs da auditoria do Angular no porte? | "quero que corriga os bugs que achou em angular para react" | chat, 2026-11-23 | 2026-11-23 |
