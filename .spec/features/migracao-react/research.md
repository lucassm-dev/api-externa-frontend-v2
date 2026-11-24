<!-- onp-spec:documentation-contract=v1 -->

# Pesquisa de produto: migracao react

> feature: migracao-react
> status: revisado

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Tarefas](tasks.md)

## Pergunta e hipótese

**Pergunta:** com quais pacotes React é possível reescrever o frontend usando as bibliotecas do cliente sem mudar comportamento, e quais delas entram de fato?

**Hipótese falsificável:** os 298 critérios de aceite podem ser provados por testes React (Vitest + Testing Library) com a mesma tag. Ela é falsa se algum critério depender de algo que só existe no Angular. Achado até aqui: só o AC-024 cita "servidor de desenvolvimento do Angular", e o comportamento dele, a mesma origem, é reproduzível no proxy do Vite (ASM-073).

**Decisão que a evidência informa:** quais pacotes e componentes entram na [ADR](adr.md) e no [TDD](design.md#15-dependências-e-compatibilidade).

## Concorrentes e alternativas

As 16 bibliotecas foram analisadas no [RFC-001](../../../docs/rfc/RFC-001-v1-estrategia-de-ui-e-bibliotecas.md) em 2026-09-09, lendo a documentação de cada uma. Resumo, com a decisão para esta migração:

| Biblioteca | Comportamento observado (RFC-001) | Fonte primária | Consulta | Entra? |
|---|---|---|---|---|
| shadcn/ui (base das demais) | Componentes copiados para o projeto, Radix + Tailwind | ui.shadcn.com; npm `shadcn` 4.23.0 | 2026-09-09 / 2026-11-22 | Sim: botão, cartão, selo, tabela, campo, diálogo de confirmação, esqueleto, paginação, toast (sonner) |
| Magic UI | Componentes animados, registro shadcn | magicui.design | 2026-09-09 | Sim: Marquee (barra de cotações), NumberTicker (números do consolidado) |
| Aceternity UI (gratuito) | Tailwind + Motion, efeitos de fundo e cartão | ui.aceternity.com | 2026-09-09 | Sim: efeito de fundo da moldura de acesso |
| Cult UI | Componentes e blocos shadcn | cult-ui.com | 2026-09-09 | Avaliar por tela com a `impeccable` |
| Eldora UI | 150+ componentes animados | eldoraui.site | 2026-09-09 | Avaliar por tela |
| Dot Matrix | Loaders | dotmatrix.zzzzshawn.cloud | 2026-09-09 | Não: o produto usa esqueleto, não spinner (fundacao-visual) |
| ReUI, Square UI, Shadcn Blocks, Ali Imam, StyleUI | Catálogos e blocos shadcn | sites da lista | 2026-09-09 | Referência de layout por tela |
| Liquid Metal | Shader WebGL em botão | metal.jakubantalik.com | 2026-09-09 | Não: custo de GPU num produto de consulta, sem ganho de leitura |
| HeroUI | Sistema de design completo | heroui.com | 2026-09-09 | Não: concorre com shadcn ([ADR](adr.md), alternativa C) |
| Balloons.js | Animação de celebração | GitHub arturbien/balloons-js | 2026-09-09 | Não: celebração seria funcionalidade nova, e o pedido é não mudar lógica |
| Watermelon UI, Componentry, Skiper UI Pro | Premium/pagos | sites da lista | 2026-09-09 | Não: pagos ([PRD](prd.md#escopo-e-exclusões)) |
| Manter Angular | Funciona, 295/298 provados | `onp-spec audit` | 2026-11-22 | Não: contraria o pedido |

Limitação: a leitura de 2026-09-09 tem 2,5 meses. Cada componente é conferido de novo na instalação (registro shadcn e código copiado), e o que mudar é registrado aqui.

## Evidências e dados

Versões no registro npm, consultadas com `npm view` em 2026-11-22:

| Pacote | Versão | Uso |
|---|---|---|
| react / react-dom | 19.3.1 | interface |
| react-router | 8.5.2 | rotas, guarda de sessão |
| vite / @vitejs/plugin-react | 8.3.8 / 6.3.0 | build e servidor com proxy |
| tailwindcss / @tailwindcss/vite | 4.3.5 | estilo |
| vitest | 5.1.1 | test runner (reporter TAP) |
| @testing-library/react / user-event / jest-dom | 16.3.3 / 14.6.13 / 8.0.0 | testes de tela |
| jsdom | 31.0.1 | ambiente de teste |
| lucide-react | 1.77.0 | ícones (substitui `@lucide/angular`) |
| @tanstack/react-table | 9.3.1 | tabelas (substitui `@tanstack/angular-table` 9) |
| sonner | 2.0.8 | toast (substitui `MatSnackBar`) |
| motion | 14.14.0 | animações dos componentes Magic UI/Aceternity |
| radix-ui, class-variance-authority, clsx, tailwind-merge | 1.8.1, 0.7.1, 2.1.1, 3.7.1 | base do shadcn/ui |
| typescript | 6.0.x (já em uso) | 7.0.2 é o compilador nativo novo, publicado há 1 dia; fica fora até amadurecer |

Inventário do Angular (2026-11-22): 115 arquivos `.ts` de produção, 101 arquivos de teste com 617 testes, 53 templates e 56 SCSS. Material só em campo de formulário e snack-bar. Uns 20 testes leem SCSS para verificar estrutura de CSS.

## Viabilidade matemática e estatística

Não há experimento com usuários. O custo é estimado em rodadas do loop, uma por tarefa: 12 tarefas (T-127 a T-138), sem estimativa de horas confiável. O benefício pedido é qualitativo (mais bonito) e não cabe em benefício líquido numérico sem inventar dados.

A métrica de preservação é exata: numerador = critérios provados pela suíte React; denominador = 298 critérios existentes + 7 novos (AC-299 a AC-305). Meta: 305/305.

## Proposta e alternativas ao pedido

A recomendação está no [ADR](adr.md). Duas propostas que não mudam o escopo:

1. Manter a navegação no topo em vez da barra lateral dos blocos shadcn. A troca seria mudança de layout, fora de "só a linguagem".
2. Usar os componentes animados só onde já há movimento ou número em destaque (barra de cotações, números do consolidado, moldura de acesso), sempre com movimento reduzido.

## Decisão e experimento

Decisão do cliente registrada no [PRD](prd.md#validação-com-o-cliente) e no [ADR](adr.md#respostas-e-aprovação), em 2026-11-22. A validação é o gate mecânico (`verify` + `audit --ci`) a cada rodada, mais a crítica da skill `impeccable` por tela. Critérios: AC-299 a AC-305 da [spec](spec.md).
