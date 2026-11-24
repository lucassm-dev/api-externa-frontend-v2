<!-- onp-spec:documentation-contract=v1 -->

# TDD: migracao react

> feature: migracao-react
> status: revisado

[PRD](prd.md) · [ADR](adr.md) · [Spec](spec.md) · [Tarefas](tasks.md) · [Pesquisa](research.md)

## 1. Identificação e responsáveis

- **Autor:** Claude Code (Opus 5.5), sessão de 2026-11-22.
- **Responsável técnico e aprovador:** Lucas.
- **Versão:** 1. **Estado:** revisado. A decisão do cliente está no [ADR](adr.md#respostas-e-aprovação).

## 2. Contexto e sistema atual

SPA Angular 22 standalone (signals, `OnPush`, SCSS por componente), testada com Vitest pelo builder do Angular. São 101 arquivos de teste, 617 testes e 298 critérios, todos com teste.

| Camada | Hoje (Angular) | Responsabilidade |
|---|---|---|
| `core/api` | `HttpClient`, `Pagina`, `ErroPadrao` | Contrato com o backend (paginação Spring, erro padrão) |
| `core/sessao` | `SessaoService`, `sessaoGuard`, `autenticacaoInterceptor` | Token de prazo fixo sem renovação ([ADR-001](../../../docs/adr/001-sessao-por-token-de-prazo-fixo-sem-renovacao.md)) |
| `core/erros` | `erroInterceptor`, catálogo, `traduzirErro`, `aplicarErroNoFormulario` | Erro por código ([ADR-009](../../../docs/adr/009-contrato-unico-de-erro-com-codigo-por-dominio.md), P-004) |
| `core/feedback` | `FeedbackService`, `NotificacaoService` (MatSnackBar), `MensagemFeedback` | Avisos de sucesso, aviso e erro (PRD-009) |
| `core/formatacao`, `core/dados`, `core/tema` | `formatarMoeda`, defasagem de 15 min, `TemaService` | pt-BR, cotação defasada, claro/escuro |
| `shared/` | 14 primitivas | Apresentação sem regra |
| `layout/casca` | navegação no topo, relógio da sessão | Moldura das telas autenticadas |
| `features/` | 7 domínios, carregados por rota | Telas de produto |

Proxy de desenvolvimento: `/auth`, `/investidores`, `/corretoras`, `/carteiras`, `/acoes`, `/operacoes` e `/mercado` vão para `http://localhost:8080`.

## 3. Problema e motivação

O cliente pediu React com as bibliotecas que escolheu ([PRD](prd.md)). Em Angular elas não são instaláveis (RFC-001), então "mais bonito com essas bibliotecas" só é possível trocando a stack. Se nada for feito, as bibliotecas continuam sendo só referência visual e o pedido não é atendido.

## 4. Escopo e não objetivos

**Escopo:** reescrever `core`, `shared`, `layout` e as 7 features em React; portar os 617 testes com as mesmas tags; adotar Tailwind v4 + shadcn/ui + Magic UI/Aceternity gratuitos; fazer o corte final. Critérios novos: AC-299 a AC-305.

**Não objetivos:** os listados em [spec, Fora de escopo](spec.md#fora-de-escopo).

## 5. Solução e arquitetura

```text
web/                      (convivência; vira a raiz no corte T-138)
  index.html
  vite.config.ts          proxy idêntico ao proxy.conf.json; Vitest com jsdom
  src/
    main.tsx              createRoot + RouterProvider + Toaster + tema inicial
    rotas.tsx             tabela de rotas = app.routes.ts (lazy por área)
    styles/tokens.css     ÚNICO lugar com cor: :root (claro) e [data-tema='escuro']
    styles/global.css     @import "tailwindcss"; @theme { --color-*: initial; ... }
    lib/utils.ts          cn() = clsx + tailwind-merge
    components/ui/        kit shadcn + Magic UI/Aceternity copiados
    core/                 mesma divisão de src/app/core
    shared/               primitivas de produto sobre o kit
    layout/               casca
    features/<dominio>/   uma pasta por PRD, sem import entre features
```

**Tradução das peças Angular:**

| Angular | React | Lógica preservada |
|---|---|---|
| `signal`/`computed` | `useState`/`useMemo`; estado global em módulo com `useSyncExternalStore` | Mesmos valores derivados |
| `HttpClient` + interceptores | `api.ts`: `fetch` que injeta `Authorization`, converte o erro em `ErroPadrao` e chama `traduzirErro` | Mesma ordem: token antes da tradução |
| `Observable` | `Promise` + `AbortController` no desmonte | Mesmas chamadas, sem chamada a mais |
| `sessaoGuard` | componente de rota `ExigeSessao` com `<Navigate to="/entrar">` | Não renderiza sem sessão nem por um instante |
| `Reactive Forms` + validadores | formulário controlado + validadores puros portados (`min-length-trimmed`, `not-blank`, `match-field` sem ngx-oneforall) | Mesmas mensagens e regras |
| `MatSnackBar` | `sonner` (`<Toaster/>`) | Mesmos níveis e textos |
| `@lucide/angular`, `@tanstack/angular-table` | `lucide-react`, `@tanstack/react-table` | Mesmos ícones e ordenação |
| `pipes/initials` (ngx-oneforall) | função `iniciais()` | Mesmo monograma |

**Tokens e Tailwind (AC-300, AC-301, AC-304):** `tokens.css` recebe os valores de `_tokens.scss` e as escalas de `_tema.scss` (espaço, raio, texto, altura da faixa de cotações, alvo de toque). `global.css` zera a paleta (`--color-*: initial`) e declara `--color-<nome>: var(--cor-<nome>)`, de modo que `bg-superficie` resolve no token. As variáveis do shadcn (`--background`, `--primary` etc.) apontam para os mesmos tokens.

**Falhas:** ficam como hoje. Erro de rede ou servidor vira mensagem do catálogo; falta parcial vira aviso sem derrubar a tela ([ADR-006](../../../docs/adr/006-degradacao-com-avisos-em-vez-de-falha.md)).

## 6. Riscos e mitigação

| Risco | Evidência / hipótese | Probabilidade | Impacto | Mitigação | Responsável |
|---|---|---|---|---|---|
| Teste portado prova menos que o original | Uns 20 testes leem SCSS; jsdom não calcula Tailwind | Média | Alto | ASM-074: a asserção troca SCSS por classe, mantendo cada exigência; a revisão compara original e porte | Claude |
| Componente copiado anima sem respeitar movimento reduzido | Marquee e NumberTicker usam animação contínua | Média | Médio | AC-302 com `matchMedia` simulado | Claude |
| Cor literal vinda do código copiado do shadcn/Magic UI | Os componentes trazem `bg-neutral-*`, `oklch(...)` | Alta | Médio | Paleta zerada + AC-300 varrendo `web/src` | Claude |
| Conflito de versões entre Angular e React no mesmo `node_modules` | Angular 22 fixa vite/vitest próprios | Média | Alto | `web/` com `package.json` próprio até o corte | Claude |
| Código de registro externo (shadcn CLI) com comportamento inesperado | Código de terceiros copiado | Baixa | Médio | Ler o código copiado antes de usar; só registros da lista do cliente | Claude |
| Cota acabar no meio de uma rodada | Loop longo, cerca de 12 rodadas | Média | Baixo | Uma tarefa por rodada; estado no `tasks.md`; parar com ≤ 5% | Claude |

## 7. Plano de implementação

Uma tarefa por rodada do loop, na ordem de [tasks.md](tasks.md): T-127 (base) → T-128 (núcleo) → T-129 (kit) → T-130 (casca e rotas) → T-131 a T-137 (domínios) → T-138 (corte).

T-127 a T-130 são sequenciais, porque cada uma importa a anterior. De T-131 a T-137 os domínios tocam pastas disjuntas e poderiam correr em paralelo. Executar em sequência, inline, evita `node_modules` duplicado em worktrees (problema já registrado na fundacao-visual) e permite aplicar a skill `impeccable` com contexto entre telas.

Entrega verificável por rodada: testes React da área passando, `onp-spec verify migracao-react` e `onp-spec audit --ci` mostrando só as pendências esperadas das tarefas ainda não feitas.

## 8. Segurança e privacidade

- **Autenticação:** o token continua em `localStorage` sob a mesma chave (`CHAVE_SESSAO`), com prazo fixo e sem renovação (ADR-001). Ele vai só no cabeçalho `Authorization` das rotas do backend.
- **Dados pessoais:** nome e e-mail do investidor, como hoje. Nenhum dado novo é coletado.
- **XSS:** o React escapa conteúdo por padrão. `dangerouslySetInnerHTML` é proibido (o teste do AC-303 também procura por ele).
- **Segredos:** nenhum no código (P-002).
- **Dependências:** só pacotes do npm e registros shadcn das bibliotecas da lista; o código copiado é lido antes de entrar.

## 9. Estratégia de testes

- **Regressão:** cada `*.spec.ts` Angular ganha um par `*.spec.tsx` em `web/src` com o mesmo título `@spec:AC-xxx`. Testing Library consulta pelos mesmos `data-*` (331 seletores `data-*`, zero por classe), e o teste porta quase linha a linha.
- **Critérios novos:** AC-299 (tabela de rotas e guarda), AC-300/301/304 (leitura de `tokens.css`/`global.css` e varredura de `web/src`), AC-302 (`matchMedia` reduzido), AC-303 (varredura de telas), AC-305 (leitura do `package.json` após o corte).
- **Runner:** `vitest run --reporter=tap-flat` em `web/`. O `testCommand` do motor roda Angular e React; o parser TAP lê as duas saídas.
- **Prova:** `onp-spec verify <feature>` e `onp-spec audit --ci`. Nenhum teste é pulado ou enfraquecido (contrato da skill).

## 10. Operação e observabilidade

Não aplicável a produção: o produto é um SPA servido em ambiente local, sem telemetria hoje, e a migração não acrescenta nenhuma. O diagnóstico de desenvolvimento é a saída do Vitest, do `audit` e o console do navegador. O `provideBrowserGlobalErrorListeners` do Angular vira um `ErrorBoundary` na raiz, que mostra a mensagem genérica do catálogo.

## 11. Reversão e recuperação

- **Até o corte:** o Angular continua inteiro em `src/`, e o gate prova os dois. Reverter = apagar `web/`.
- **Depois do corte:** a `main` continua Angular até o cliente aprovar a integração da branch `migracao-react`. Há ainda o backup `../api-externa-frontend-v2-backup-angular`.
- **Gatilho:** qualquer critério antigo que não consiga ser provado em React sem mudar a regra para a rodada e vira pergunta ao cliente.

## 12. Métricas de sucesso

| Indicador | Referência | Meta | Medição |
|---|---|---|---|
| Critérios provados pela suíte React | 0/305 | 305/305 | `onp-spec audit` após T-138 |
| Pacotes Angular | 15 | 0 | AC-305 |
| Cor literal fora dos tokens no React | — | 0 | AC-300 |
| Pares de contraste ≥ 4,5:1 | 100% hoje (AC-226) | 100% com as cores do kit | AC-304 |
| Crítica `impeccable` por tela | — | cada tela revisada, recomendações aplicadas ou registradas | relato da rodada |

## 13. Glossário e domínios

- **Corte:** a rodada que remove o Angular e promove `web/` à raiz.
- **Kit:** `web/src/components/ui`, os componentes shadcn e das bibliotecas da lista copiados para o projeto.
- **Porte:** reescrita de uma área em React com seus testes, mantendo as tags.
- **Domínios:** acesso (PRD-002), painel (PRD-003), corretoras (PRD-004), carteiras (PRD-005), ações (PRD-006), operações (PRD-007), desempenho (PRD-008) e confiabilidade (PRD-009, transversal). Responsável por todos: Lucas.

## 14. Alternativas e decisões

Resumo do [ADR](adr.md#alternativas-consideradas): React + Tailwind + shadcn (escolhida), CSS Modules, HeroUI ou manter Angular.

Decisões técnicas deste TDD:

- `web/` separado até o corte;
- Vitest 5 com TAP;
- react-router 8 com carregamento por rota;
- TypeScript 6 (o 7 nativo, de 1 dia, fica fora);
- sem biblioteca de estado nem de requisições, porque a lógica atual não precisa e acrescentaria comportamento (cache, refetch).

Ainda em aberto: Q-040 (verificação do P-003 após o corte).

## 15. Dependências e compatibilidade

As versões estão na [pesquisa](research.md#evidências-e-dados). Node ≥ 18 (o motor já exige) e backend em `localhost:8080` sem mudança de contrato. Navegadores: os mesmos do Angular (evergreen); o Tailwind v4 exige navegador com `@property` e `color-mix`, que o produto já usa nos SCSS atuais.

Sem acesso ao registro npm, a rodada para e registra o impedimento.

## 16. Performance e capacidade

Orçamento: o bundle inicial do React não deve passar o do Angular de hoje, medido com `ng build` e `vite build` no mesmo commit.

Referência medida na T-127 (2026-11-22, `npx ng build`, configuração de produção, branch `migracao-react` antes de qualquer código React de produto): **bundle inicial de 378,08 kB brutos, 89,16 kB de transferência estimada** (main 205,29 kB / 39,61 kB; styles 13,52 kB / 2,74 kB). A comparação com o React é feita no corte (T-138), com o app completo; antes disso o número do React não é comparável.

Carga: um investidor por navegador; não há concorrência a projetar. Os componentes animados animam só `transform`/`opacity` (AC-230 existente).

## 17. Migração e implantação

- **Dados:** não há transformação. A chave de sessão (`CHAVE_SESSAO`) e a de tema (`CHAVE_TEMA`) são as mesmas, então quem estiver logado ou com tema escolhido continua igual.
- **Rollout:** a branch `migracao-react` só é integrada à `main` com o pedido do cliente (a regra dele: commit e integração só quando pedir).
- **Validação:** gate verde com 305/305 e revisão visual do cliente.

## 18. Perguntas e suposições

ASM-073 a ASM-076 e Q-040 na [spec](spec.md#suposições), todas com Lucas como responsável. Q-040 bloqueia só a parte da T-138 que mexe na constituição; as demais tarefas seguem.

## 19. Marcos e acompanhamento

| Marco | Tarefas | Critério de avanço |
|---|---|---|
| Base pronta | T-127 | `vite build` e `vitest` rodando; AC-300, 301 e 304 provados |
| Núcleo, kit e casca | T-128 a T-130 | testes de `core`, `shared`, `app` e `layout` portados e passando; AC-299 provado |
| Domínios | T-131 a T-137 | testes de cada feature portados; AC-302 e 303 provados |
| Corte | T-138 | AC-305 provado; `audit --ci` = 0 |

O acompanhamento é feito pelo `tasks.md` (`onp-spec tarefa`) e por um relato no chat ao fim de cada rodada do loop. Estimativa: cerca de 12 rodadas, com incerteza alta nas features grandes (operações e desempenho).

## 20. Revisão e rastreabilidade

- **Revisor:** Lucas. Decisão do cliente: 2026-11-22 ([ADR](adr.md#respostas-e-aprovação)).
- **Cadeia:** [PRD](prd.md) (requisitos) → [ADR](adr.md) (stack) → este TDD → [spec](spec.md) (AC-299 a AC-305 + 298 existentes) → [tarefas](tasks.md) (T-127 a T-138) → testes `*.spec.tsx` com `@spec:AC-xxx`.

Estrutura baseada no [Technical Design Doc Creator, Tech Leads Club](https://github.com/tech-leads-club/agent-skills/blob/main/packages/skills-catalog/skills/%28creation%29/create-technical-design-doc/SKILL.md); texto e requisitos de rastreabilidade adaptados para este projeto.
