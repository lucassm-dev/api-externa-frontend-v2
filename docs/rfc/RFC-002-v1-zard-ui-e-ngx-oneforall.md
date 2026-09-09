# RFC-002: Adotar Zard UI e/ou ngx-oneforall no frontend

| Campo | Valor |
|---|---|
| **Impacto** | Zard UI: ALTO (reabre a decisão do RFC-001). ngx-oneforall: MÉDIO (não toca estilo nem tokens) |
| **Status** | COMPLETE — Opção 1 aprovada em 2026-09-09 |
| **Driver** | @Lucas |
| **Approver** | @Lucas |
| **Due Date** | TBD |
| **Resources** | [RFC-001](RFC-001-v1-estrategia-de-ui-e-bibliotecas.md), [Constituição](../../.spec/constituicao.md), [ADR-005](../adr/005-cotacao-como-snapshot-com-cache.md), [ADR-010](../adr/010-consultas-paginadas-sem-filtro-e-sem-serie-historica.md) |
| **Created** | 2026-09-09 |
| **Last Updated** | 2026-09-09 |

---

## Background

O [RFC-001](RFC-001-v1-estrategia-de-ui-e-bibliotecas.md) foi decidido em 2026-09-09 pela **Opção 1**: camada própria sobre os tokens, com `@lucide/angular`, `@tanstack/angular-table` e `balloons-js` como únicas dependências novas. Tailwind foi avaliado e rejeitado (D6). A especificação da primeira feature (`fundacao-visual`) tinha acabado de começar quando surgiram duas bibliotecas Angular que o levantamento anterior não cobriu.

Isso importa porque o achado central do RFC-001 foi que **as 16 bibliotecas do repertório inicial eram React/Tailwind** — nenhuma instalável. Essas duas são Angular. Se alguma delas resolver parte do inventário de 35 itens, é melhor descobrir agora do que no meio da spec.

**São dois assuntos distintos, e tratá-los como um só seria erro:**

- **Zard UI** é biblioteca de componentes de UI. Cai exatamente no espaço que o RFC-001 já avaliou e recusou.
- **ngx-oneforall** não tem um único componente de UI nem uma linha de estilo. É utilitário: pipes, diretivas, validadores, sinais e serviços. É **ortogonal** ao RFC-001 — cabe dentro da Opção 1 sem mexer na decisão.

---

## Dados levantados

Coletado em 2026-09-09 via API do GitHub, registro do npm e código-fonte.

| | **Zard UI** | **ngx-oneforall** |
|---|---|---|
| Repositório | `zard-ui/zardui` | `love1024/ngx-oneforall` |
| Licença | MIT | MIT |
| Criado em | 2025-03-05 | 2025-03-25 |
| Estrelas | 1.142 | 186 |
| Último push | 2026-09-05 (ativo) | 2026-07-05 (2 meses) |
| Versão atual | **`1.0.0-beta.120`** | **`2.1.0`** (estável) |
| Downloads/mês | 15.986 (`zard-cli`) | 2.018 |
| Angular suportado | não declarado na doc | **`^17.1 \|\| 18 \|\| 19 \|\| 20 \|\| 21 \|\| 22`** — explícito |
| Exige Tailwind | **Sim — "Tailwind is the core of the project"** | Não |
| Entrega | CLI copia para `src/app/shared/components/` | pacote npm, 126 subcaminhos |
| Tree-shaking | n/a (código copiado) | `sideEffects: false` + exports granulares |
| Tem UI/estilo? | é só isso | **nenhum** |

**Comparação de referência** (downloads/mês): `@tanstack/angular-table` 198k · `@spartan-ng/brain` 196k · `@lucide/angular` 195k · `zard-cli` 16k · `ngx-oneforall` 2k.

---

## Parte A — Zard UI

### O que é, de fato

Componentes Angular no estilo shadcn/ui, inspirados também no ng-zorro. O código é moderno e bem escrito: standalone, `ChangeDetectionStrategy.OnPush`, `input()` com signals. Fonte real do `badge`:

```ts
export const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full
   border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap
   transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] ...',
  { variants: { zType: {
      default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
      destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20 ...',
  } } },
);
```

O componente é `ViewEncapsulation.None` e toda a aparência vem de `cva` + `clsx` sobre classes Tailwind com a paleta semântica do shadcn (`bg-primary`, `text-destructive`, `border-ring`).

### O catálogo bate com o nosso inventário

E bate bem: **Table, Pagination, Empty, Skeleton, Sonner (toast), Alert, Badge, Card, Tooltip, Chart**, além de Dialog, Sheet, Sidebar, Tabs, Combobox, Date Picker e ~40 outros. É praticamente a lista de primitivas que a feature `fundacao-visual` ia construir à mão.

### Por que ainda assim não entra

**Zard UI não é uma opção nova — é um terceiro candidato para a vaga da Opção 2 do RFC-001**, disputando com o spartan/ui. Ela não muda nada na conta do Tailwind; muda só qual biblioteca Tailwind se usaria. Tudo que está escrito na Opção 2 e na nota D6 continua valendo:

1. **Tailwind é obrigatório e assumido como tal.** A doc de instalação diz que Tailwind é o núcleo do projeto e **"não recomendamos usar outros pré-processadores"**. Nosso produto é 100% SCSS, com `_tokens.scss` e `_tema.scss` como espinha dorsal.
2. **Tema em modelo incompatível.** Zard usa variáveis OKLCH no padrão shadcn (`--background`, `--primary`, `--ring`) com `@theme inline`, e **modo escuro pela classe `.dark`**. Nós usamos `--cor-*` em `data-tema='escuro'`. Adotar Zard é migrar o sistema de cores inteiro — o mesmo custo da Opção 2.
3. **O argumento D6 se aplica igual.** A configuração que respeita P-003 (apagar a paleta padrão do Tailwind e expor só nossos tokens) quebra as strings de classe que os componentes do Zard trazem prontos. Configuração constitucional e benefício são mutuamente exclusivos.
4. **`ViewEncapsulation.None` em todos os componentes.** Estilo vazando para o documento inteiro, exatamente o oposto do isolamento por componente que temos hoje.

### E se um dia formos de Tailwind: Zard ou spartan?

Vale registrar, porque a pergunta vai voltar.

| | Zard UI | spartan/ui |
|---|---|---|
| Maturidade | `1.0.0-beta.120` — **18 meses, 120 betas, nunca chegou a estável** | **1.0 estável**, versionamento semântico |
| Adoção | 16k downloads/mês | 196k downloads/mês |
| Arquitetura | camada única copiada | Brain (npm, acessível, mantido por eles) + Helm (copiado, seu) |
| Acessibilidade | por conta dos componentes copiados | Brain é primitivo acessível e recebe correção via npm |
| Angular declarado | não documentado | signals, zoneless-ready, SSR |
| Catálogo | ~50 componentes, inclui Chart | 55+, inclui Data Table, Sidebar, Calendar |

O ponto que mais pesa: no Zard, **todo o código copiado vira responsabilidade sua para sempre**, inclusive as correções de acessibilidade. No spartan, a metade acessível continua chegando por npm. Para um projeto de um desenvolvedor só, isso é a diferença entre manter 50 componentes e manter 50 folhas de estilo. **Se algum dia for Tailwind, é spartan — e via RFC próprio.**

---

## Parte B — ngx-oneforall

### O que é

Biblioteca utilitária. **Zero componentes, zero CSS, zero opinião visual.** 126 subcaminhos de importação, `sideEffects: false`, peer de Angular declarando `^22` explicitamente. `libphonenumber-js` aparece nos peers mas está marcado `optional`, então não entra se não for usado.

Categorias: `directives/` (17) · `validators/` (24, metade em versão para signals) · `signals/` (12) · `services/` (12) · `pipes/` (11) · `rxjs/` (6) · `interceptors/` (7) · `guards/` (3) · `decorators/` (7) · `utils/` (13).

### O que serve para o nosso inventário

| Peça | Onde entra | Item |
|---|---|---|
| `pipes/initials` | monograma do ativo quando não há logo — resolve D1 sem trabalho manual nem risco jurídico | #7 |
| `validators/signals/match-field` | confirmação de senha no cadastro | #22 |
| `validators/signals/min-length-trimmed`, `not-blank` | validação de cadastro sem aceitar espaço em branco | #22 |
| `pipes/first-error-key` | escolher qual erro do formulário exibir, sem `if` encadeado no template | #22 |
| `directives/numbers-only`, `directives/number-input` | quantidade e preço no formulário de operação | E |
| `directives/auto-focus` | foco ao abrir diálogo de confirmação e telas de acesso | #28 |
| `directives/click-outside` | fechar o seletor de carteira e menus | #12 |
| `rxjs/loading-status` | padronizar os estados de carregamento hoje espalhados em signals soltos | #25 |
| `services/clipboard` | copiar ticker e código de erro (P-004 exige código visível) | #19 |
| `directives/hover-class` | realce de linha e de fatia do gráfico | #16 |
| `pipes/truncate` | nomes longos de carteira e corretora em célula de tabela | #9 |

### O que NÃO usar, e por quê

| Peça | Motivo |
|---|---|
| `pipes/time-ago` | ADR-005 exige hora exata do snapshot. "há 5 minutos" pode acompanhar, nunca substituir |
| `directives/infinite-scroll` | ADR-010 é paginado por decisão; rolagem infinita contradiz |
| `interceptors/jwt`, `services/jwt`, `guards/*` | já temos `autenticacao.interceptor.ts` e `sessao.guard.ts`, testados e ancorados em spec |
| `services/idle` | tentador para o aviso de expiração, mas ADR-001 é prazo fixo sem renovação — a lógica atual em `casca.ts` já está provada |
| `signals/breakpoint-matcher` | desktop apenas no v1 |
| `validators/phone`, `credit-card` | não existem esses campos no produto |
| `signals/storage-signal` | `TemaService` e `carteira-preferida.ts` já resolvem, com teste |

### O risco honesto

Três coisas desconfortáveis, ditas sem maquiagem:

1. **2.018 downloads/mês e um mantenedor só.** Para pipes e validadores isso é aceitável — cada peça tem dezenas de linhas e é reescrevível numa tarde. Para interceptor, guard ou serviço em caminho crítico, não seria. Daí a regra da tabela acima.
2. **Último lançamento em 2026-07-05.** Dois meses sem release não é abandono, mas também não é o ritmo do `@tanstack` ou do Lucide.
3. **Tensão com a preferência do projeto de não criar abstração prematura.** Trazer uma dependência para ganhar um pipe de dez linhas é ruim negócio. O caso forte do ngx-oneforall está no **grupo de validadores e ergonomia de formulário**, onde há lógica de verdade (comparação entre campos, primeiro erro, máscara, entrada numérica) — não nos pipes de conveniência.

---

## Suposições

| # | Suposição | Confiança | Gatilho de invalidação |
|---|---|---|---|
| 1 | A decisão do RFC-001 (Opção 1, sem Tailwind) continua de pé | Alta | Reabertura explícita via novo RFC |
| 2 | Peças folha (pipe, validador, diretiva) do ngx-oneforall são reescrevíveis em horas se a biblioteca parar | Alta | Uso se espalhar para serviços e interceptors |
| 3 | Zard UI não chega a 1.0 estável dentro do horizonte desta repaginação | Média | Lançamento de 1.0 estável |
| 4 | `libphonenumber-js` não entra no bundle por estar marcado opcional e não ser importado | Alta | Uso de `validators/phone` |

---

## Critérios de decisão

Herdados do RFC-001, mais dois que este caso exige.

| # | Critério | Peso |
|---|---|---|
| 1 | Não exigir Tailwind nem renegociar P-003 | **Must-have** |
| 2 | Compatível com Angular 22 standalone/signals | **Must-have** |
| 3 | Licença livre e projeto não arquivado | **Must-have** |
| 4 | Preservar ADR-001/005/010 | **Must-have** |
| 5 | **Não desfazer código já testado e ancorado em spec** (novo) | **Must-have** |
| 6 | **Maturidade proporcional à criticidade do uso** (novo) | Alto |
| 7 | Custo de bundle | Alto |
| 8 | Reversibilidade | Alto |
| 9 | Redução real de código próprio a escrever | Médio |

---

## Opções consideradas

### Opção 1: ngx-oneforall pontual, sem Zard UI ⭐ (Recomendada)

**Descrição.** Manter o RFC-001 intacto. Recusar Zard UI. Adotar `ngx-oneforall` como quarta dependência da Opção 1, restrita a peças folha e **só onde não existe código nosso** — validadores e ergonomia de formulário, `pipes/initials` para o monograma de ativo, `rxjs/loading-status`, e as diretivas de foco/clique-fora/hover.

**Prós.**
- Passa em todos os Must-have. Nada de Tailwind, nada de tema estranho, nada de reescrever o que já tem teste.
- Resolve D1 (monograma do logo) e boa parte do item #22 (validação do cadastro) sem código novo.
- Tree-shakable com importação por subcaminho: entra só o que for usado.
- Reversível peça a peça, como o resto da Opção 1.
- Angular 22 declarado explicitamente no peer — não é suposição.

**Contras.**
- Mais uma dependência de baixa adoção (2k/mês) e mantenedor único.
- Alguns dos ganhos são pequenos demais para justificar dependência isolada; só compensa pelo conjunto.
- Exige disciplina para não deixar o uso escorregar dos pipes para os interceptors.

**Custo:** PEQUENO — ~0,5 dia de integração, diluído nas features já planejadas. Risco: BAIXO.

---

### Opção 2: ngx-oneforall amplo (inclusive substituindo código próprio)

**Descrição.** Adotar a biblioteca inteira, trocando `validadores.ts`, `cnpj.ts`, o relógio de sessão em `casca.ts` e `storage` do tema pelos equivalentes.

**Prós.** Menos código próprio no total; um vocabulário único para utilidades.

**Contras.** Falha no Must-have #5. Cada troca invalida testes existentes e gera retrabalho de auditoria (teste órfão, código órfão, critério sem prova) numa base que hoje está limpa. E coloca um mantenedor único no caminho crítico de sessão e autenticação.

**Custo:** MÉDIO em esforço, ALTO em risco. **Desqualificada pelo Must-have #5.**

---

### Opção 3: Adotar Zard UI (com ou sem ngx-oneforall)

**Descrição.** Instalar Tailwind v4 e copiar os componentes do Zard, substituindo a feature `fundacao-visual` quase inteira.

**Prós.** Table, Pagination, Sonner, Skeleton, Empty, Badge, Card, Chart prontos. Código Angular moderno. MIT. Cobre grande parte do inventário de uma vez.

**Contras.** Falha no Must-have #1: Tailwind é obrigatório e a doc desaconselha SCSS, que é a base do nosso produto. Falha por consequência no #4 do RFC-001 quanto à maturidade: `1.0.0-beta.120` após 18 meses. `ViewEncapsulation.None` em toda a biblioteca. Migração completa de `_tokens.scss` para o modelo OKLCH do shadcn e do seletor de tema para `.dark`. E, se o destino é mesmo Tailwind, o spartan/ui é a escolha melhor pelos motivos da tabela acima.

**Custo:** GRANDE — equivalente à Opção 2 do RFC-001 (20–30 dias). Risco: ALTO. **Desqualificada pelo Must-have #1.**

---

### Opção 4: Nenhuma das duas

**Descrição.** Seguir o RFC-001 exatamente como aprovado e retomar a spec de `fundacao-visual`.

**Prós.** Zero dependência nova, zero avaliação adicional, caminho já decidido.

**Contras.** Deixa na mesa o monograma pronto (D1) e o grupo de validadores do cadastro, que teriam de ser escritos e testados à mão sem ganho de aprendizado.

**Custo:** PEQUENO. Perde pouco — é a segunda melhor opção.

---

## Comparação

| Critério | Peso | Opção 1 | Opção 2 | Opção 3 (Zard) | Opção 4 |
|---|---|---|---|---|---|
| Sem Tailwind / P-003 intacto | Must | ✅ | ✅ | ❌ | ✅ |
| Angular 22 signals | Must | ✅ | ✅ | ⚠️ não declarado | ✅ |
| Licença livre, não arquivado | Must | ✅ | ✅ | ✅ (mas beta) | ✅ |
| Preserva ADR-001/005/010 | Must | ✅ | ⚠️ | ⚠️ | ✅ |
| Não desfaz código provado | Must | ✅ | ❌ | ❌ | ✅ |
| Maturidade vs criticidade | Alto | ✅ uso folha | ❌ | ❌ beta.120 | ✅ |
| Bundle | Alto | ✅ tree-shaking | ⚠️ | ❌ | ✅ |
| Reversibilidade | Alto | Alta | Baixa | Muito baixa | — |
| Reduz código próprio | Médio | Moderado | Alto | Muito alto | Nenhum |

**Recomendação: Opção 1.** O ngx-oneforall é o achado útil aqui, justamente porque não é biblioteca de UI — ele resolve lacunas dentro da Opção 1 do RFC-001 sem tocar em uma linha de estilo. O Zard UI é bom trabalho e não serve a este projeto: ele traz de volta a mesma pergunta do Tailwind que o RFC-001 já respondeu, com uma biblioteca menos madura do que a alternativa que já havia sido recusada.

---

## Decisões abertas

| # | Decisão | Recomendação |
|---|---|---|
| E1 | Adotar `ngx-oneforall`? | Sim, restrito à lista "o que serve" |
| E2 | D1 (logo do ativo) passa a usar `pipes/initials`? | Sim — monograma como padrão, SVG curado por cima para os mais comuns |
| E3 | Escrever a fronteira de uso na constituição (proibir interceptors/guards da biblioteca)? | Sim, como princípio [RECOMENDADO] com verificação por regex de importação |
| E4 | Zard UI fica registrado como recusado? | Sim, e qualquer retomada de Tailwind vira RFC próprio com spartan/ui |

---

## Action Items

| Ação | Owner | Prazo | Status |
|---|---|---|---|
| Decidir entre as Opções 1–4 | @Lucas | TBD | NOT STARTED |
| Fechar E1–E4 | @Lucas | TBD | NOT STARTED |
| Se Opção 1: acrescentar `ngx-oneforall` às dependências previstas na spec `fundacao-visual` | @Lucas | TBD | NOT STARTED |
| Se Opção 1: atualizar D1 no RFC-001 apontando `pipes/initials` | @Lucas | TBD | NOT STARTED |
| Retomar `onp-spec especificar fundacao-visual` | @Lucas | TBD | BLOQUEADO por esta decisão |

---

## Outcome

**Decisão:** **Opção 1** — adotar `ngx-oneforall` de forma pontual, restrito à lista "o que serve"; **Zard UI recusado**. E1 a E4 aprovados como recomendados.

**Data:** 2026-09-09

**Decidido por:** @Lucas

**Racional:** a conta de cobertura não fecha. Dos 35 itens do inventário do RFC-001, o Zard cobre bem 8 e pela metade outros 3 — e os 8 estão todos dentro da `fundacao-visual`, a menor das cinco features, algo como 3 a 4 dias de trabalho. O preço é Tailwind: migrar `_tokens.scss` para o modelo OKLCH do shadcn, trocar `data-tema='escuro'` pelo seletor `.dark` e reescrever 36 arquivos SCSS — 20 a 30 dias na adoção completa, 5 a 8 na parcial, que ainda deixa dois idiomas de estilo convivendo. Paga-se entre 5 e 30 dias para economizar 3 ou 4.

Os 24 itens que o Zard não cobre são exatamente os que motivaram a repaginação: barra de cotações, monograma de ativo, célula de variação, card de consolidado, célula de dois níveis, cabeçalho agrupado, login em duas colunas. São componentes de domínio financeiro — nenhuma biblioteca genérica os tem.

O `ngx-oneforall` entra porque resolve o problema oposto: não é UI, não tem estilo, e preenche lacunas de lógica (validadores de cadastro, monograma via `pipes/initials`, estados de carregamento) sem tocar em token nem em tema.

**Fatores decisivos:**
- O `Chart` do Zard é wrapper de ECharts (`echarts ^6.1.0` + `ngx-echarts ^21`) — a biblioteca mais pesada disponível, cuja necessidade o ADR-010 já havia eliminado.
- Zard segue em `1.0.0-beta.120` após 18 meses, com 16k downloads/mês; o workspace do projeto está em `@angular/core 21.2.13` e a doc não declara faixa de Angular suportada.
- O catálogo profundo do Zard (Combobox, Date Picker, Command, Context Menu) — que é onde uma biblioteca de componentes realmente se paga — ficaria quase todo sem uso, porque o ADR-010 tira filtros do v1 e nossos formulários são campos simples.
- **Verificação importante:** Tailwind não quebraria a base. Nenhum dos testes se acopla a CSS (331 seletores são `data-*`, zero são classe, zero usam `classList`), nenhum componente declara `ViewEncapsulation` e há só 3 usos de `:host`/`::ng-deep`. A recusa é por custo de migração e imaturidade da biblioteca — não por risco de quebra.

**Condições:**
- O uso do `ngx-oneforall` fica restrito a peças folha (pipe, validador, diretiva, operador rxjs). Interceptors, guards e serviços de sessão continuam sendo código nosso, já testado (E3).
- Se o roadmap passar a exigir Combobox, Date Picker ou Command, a conta muda e a decisão deve ser reaberta — com spartan/ui, não com Zard.
- As decisões de geometria do Zard (raio, espaçamento, escala tipográfica) podem ser usadas como referência visual, do mesmo modo que o Investidor10 — sem instalar nada.

---

## Referências

- Zard UI — <https://github.com/zard-ui/zardui> · <https://www.zardui.com/docs/components> · <https://www.zardui.com/docs/installation/angular>
- ngx-oneforall — <https://github.com/love1024/ngx-oneforall> · <https://www.npmjs.com/package/ngx-oneforall>
- spartan/ui (comparativo) — <https://spartan.ng/documentation/introduction>
