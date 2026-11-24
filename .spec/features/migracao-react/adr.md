<!-- onp-spec:documentation-contract=v1 -->

# ADR: migracao react

> feature: migracao-react
> status: aceito

[PRD](prd.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## Identificação e contexto

- **Decisão:** reescrever o frontend em React + TypeScript, com Tailwind v4, shadcn/ui e componentes gratuitos das bibliotecas da lista do cliente, preservando toda a lógica e os 298 critérios de aceite.
- **Responsável:** Lucas (cliente e mantenedor). Redação: Claude Code, 2026-11-22.
- **Domínio:** todos os sete domínios de produto e o transversal de confiabilidade.
- **Requisitos atendidos:** os do [PRD](prd.md#requisitos-e-prioridades); critérios AC-299 a AC-305 da [spec](spec.md).

## Restrições e regras anteriores

| Regra anterior | Situação |
|---|---|
| PRD-001 a PRD-009 | Continuam válidos. A migração não muda comportamento |
| ADR-001 a ADR-010 | Continuam válidos (sessão de prazo fixo, snapshot de cotação, degradação com aviso, erro por código, sem série histórica etc.) |
| Constituição P-001 (prova executável) | Continua válida. Cada critério portado mantém sua tag `@spec:AC-xxx` |
| Constituição P-003 (cor só nos tokens) | O princípio continua válido. A verificação mecânica cobre `src/app/**/*.scss` e não alcança o React; o AC-300 cobre o React durante a convivência. No corte (T-138), a linha de verificação precisa de proposta de revisão em versão separada (Q-040) |
| Constituição P-004 (erro por código) | Continua válida. O catálogo de erros é portado sem mudança |
| [RFC-001](../../../docs/rfc/RFC-001-v1-estrategia-de-ui-e-bibliotecas.md), Opção 1 e D6 (Tailwind recusado) | **Substituído por este ADR.** A premissa era um projeto Angular, em que as bibliotecas não eram instaláveis. Mantido como histórico, sem edição |
| [RFC-002](../../../docs/rfc/RFC-002-v1-zard-ui-e-ngx-oneforall.md), Opção 1 (ngx-oneforall, Zard recusado) | **Substituído por este ADR.** O ngx-oneforall é exclusivo de Angular; seus dois usos (iniciais do monograma e validadores) são reescritos com o mesmo comportamento. Mantido como histórico |
| Decisão do cliente de 2026-11-15 (barra de cotações sem borda e sem horário) | Continua válida e é portada como está (AC-236 da feature repaginacao-painel) |

## Alternativas consideradas

| Alternativa | Benefício | Custo | Reversível | Por que não |
|---|---|---|---|---|
| **A. React + Tailwind v4 + shadcn/ui + bibliotecas gratuitas da lista** (escolhida) | Usa de fato as bibliotecas pedidas, que são shadcn/Tailwind (RFC-001). Ecossistema de componentes acessíveis (Radix) | Reescrita total; disciplina de token precisa de regra mecânica nova (AC-300) | Sim: o Angular fica no backup e no histórico do git até o corte | — |
| B. React + CSS Modules usando os tokens SCSS atuais | Preserva a forma atual do P-003 sem mudança | As bibliotecas viram só referência visual, recriadas à mão; não atende "utilizando as bibliotecas que te passei" | Sim | Contraria o pedido literal |
| C. React + HeroUI (sistema de design completo) | Um único sistema pronto | Briga com shadcn; tema próprio que substitui os tokens | Difícil | Uma das 16, mas exclui as outras 14 que são shadcn |
| D. Manter Angular | Nenhum custo | Não atende o pedido | — | Contraria o pedido |

## Decisão e justificativa

Alternativa A, aceita pelo cliente com as palavras literais registradas no [PRD](prd.md#validação-com-o-cliente).

Justificativa: o RFC-001 (2026-09-09) verificou que 15 das 16 bibliotecas são React + Tailwind e quase todas se instalam pela CLI do shadcn. Em React, "usar as bibliotecas" passa a ser literal.

O risco que fez o D6 recusar Tailwind era perder a prova de que não há cor solta. Ele é tratado assim:

1. A paleta padrão do Tailwind é zerada (`@theme { --color-*: initial; }`). Uma classe como `bg-red-500` deixa de existir.
2. As cores do Tailwind e do shadcn apontam para os tokens portados de `_tokens.scss`, nos temas claro e escuro.
3. O teste do AC-300 varre o código React em busca de cor literal (hex, `rgb()`, `hsl()`, `oklch()`) e de classe arbitrária de cor (`bg-[#…]`). Ele vale para todos os arquivos, exceto o de tokens.

Convivência: o React nasce em `web/`, com `package.json` próprio, ao lado do Angular, e cada domínio é portado numa rodada. O gate roda as duas suítes. O Angular só sai no corte (T-138), quando todos os critérios estiverem provados pela suíte React.

## Consequências e riscos

- **Ganho:** componentes acessíveis prontos (Radix), repertório visual pedido pelo cliente e movimento real (Magic UI, Aceternity) controlado por `prefers-reduced-motion`.
- **Perda:** a verificação atual do P-003 deixa de alcançar o código após o corte, até a revisão da constituição (Q-040). Até lá, quem prova é o AC-300.
- **Custo:** cerca de 12 rodadas do loop (T-127 a T-138), com risco de regressão concentrado nos testes de estrutura de CSS, que passam de "ler o SCSS" para "ler as classes".
- **Mitigação:** detalhada no [TDD](design.md#6-riscos-e-mitigação).

## Validade, revisão e substituição

Revisar esta decisão se:

- uma biblioteca adotada mudar de licença ou deixar de ter versão gratuita;
- o React precisar de renderização no servidor (hoje é um SPA);
- o cliente pedir para voltar ao Angular. Nesse caso, a restauração é pelo backup e pela `main`.

Esta decisão substitui o RFC-001 (Opção 1/D6) e o RFC-002 (Opção 1) **apenas no ponto da stack de apresentação**. Os demais achados dos RFCs (inventário visual de 35 itens, monograma no lugar do logo de terceiro, amarelo só como preenchimento) continuam valendo.

## Respostas e aprovação

| Pergunta | Resposta literal | Autor / origem | Data | Documentos afetados |
|---|---|---|---|---|
| Trocar Angular por React com as bibliotecas enviadas? | "quero que faz a troca para react, utilizando as bibliotecas que te passei para melhorar componentes, deixar o front mais bonito não quero que muda a logica de como esta, somente a linguagem e deixa mais bonito" | Lucas, chat do Claude Code | 2026-11-22 | RFC-001 (D6), RFC-002, constituição P-003 (verificação) |
