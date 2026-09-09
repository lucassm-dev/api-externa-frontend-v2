# RFC-001: Estratégia de UI e escolha de bibliotecas para deixar o produto mais vivo para o investidor

| Campo | Valor |
|---|---|
| **Impacto** | ALTO — atinge todas as telas, o sistema de tokens, o bundle e a constituição do projeto |
| **Status** | COMPLETE — Opção 1 aprovada em 2026-09-09 |
| **Driver** | @Lucas |
| **Approver** | @Lucas |
| **Contributors** | — |
| **Informed** | — |
| **Due Date** | TBD |
| **Resources** | [PRD-001](../prd/PRD-001-v1-visao-produto-frontend.md), [PRD-008](../prd/PRD-008-v1-desempenho-dashboards.md), [PRD-009](../prd/PRD-009-v1-confiabilidade-percebida.md), [ADR-005](../adr/005-cotacao-como-snapshot-com-cache.md), [ADR-006](../adr/006-degradacao-com-avisos-em-vez-de-falha.md), [ADR-010](../adr/010-consultas-paginadas-sem-filtro-e-sem-serie-historica.md), [Constituição](../../.spec/constituicao.md) |
| **Created** | 2026-09-09 |
| **Last Updated** | 2026-09-09 |

---

## Background

**Estado atual.** O frontend é Angular 22 standalone, com signals, `OnPush`, SCSS por componente e Vitest. A camada visual é praticamente toda artesanal:

- **Angular Material** entra só em três pontos: `button` (17 usos), `input` e `form-field` (7 cada). Não há `mat-table`, `mat-icon`, `mat-dialog`, `mat-snack-bar`.
- **Zero biblioteca de ícones.** Os níveis de feedback são desenhados com caracteres literais dentro de um `<span>`: `i`, `!`, `×` ([`mensagem-feedback.ts`](../../src/app/core/feedback/mensagem-feedback.ts)).
- **Zero biblioteca de gráficos.** `grafico-composicao`, `grafico-contribuicao` e `grafico-realizado` são `<svg><rect>` montados à mão com largura em `%`.
- **Tabelas** são `<table>` semântico puro, com paginação por dois botões ([`extrato-operacoes.html`](../../src/app/features/operacoes/extrato/extrato-operacoes.html)).
- **Barra de cotações** é um `flex` estático com `overflow-x: auto`, fundo `--cor-superficie` (claro/branco no tema claro) ([`barra-mercado.scss`](../../src/app/features/painel/blocos/barra-mercado.scss)).
- **Design tokens** existem e são levados a sério: `src/styles/_tokens.scss` é o único lugar do produto onde cor é escrita, em claro e escuro.

**Problema.** O produto é correto, acessível e honesto — mas é visualmente cru para o público-alvo. Um investidor que compara a tela com o Investidor10 ou o StatusInvest vê: sem ícones de ativo, sem hierarquia visual forte nos números, tabelas sem densidade nem ordenação, gráficos que são barras chapadas, uma barra de cotações clara e parada, e mensagens de erro/aviso/sucesso indistinguíveis de um bloco de texto. Não existe sequer o nível "sucesso" — o enum `NivelFeedback` tem apenas `informacao | aviso | erro`.

**Por que agora.** O v1 funcional está completo (8 features especificadas em `.spec/features`, todas com testes). O gargalo de percepção de valor deixou de ser função e passou a ser apresentação. E a decisão é estrutural: adotar Tailwind, uma suíte de componentes ou uma biblioteca de gráficos muda os tokens, o bundle e a constituição — não é algo para ir descobrindo tela a tela.

**O que acontece se não decidirmos.** Cada melhoria visual vira uma escolha ad-hoc dentro do componente; em três meses há três formas diferentes de fazer um card, cor literal vazando no SCSS de tela (violando P-003) e nenhuma reversibilidade.

---

## Achado que redefine o problema

O usuário trouxe 16 bibliotecas. **Nenhuma das 16 é instalável neste projeto.** Verificação, biblioteca a biblioteca:

| # | Biblioteca | Stack real | Usável em Angular 22? |
|---|---|---|---|
| 1 | ReUI | React 19 + Tailwind v4 + Radix/Base UI | ❌ |
| 2 | Liquid Metal | Componente React + shader WebGL | ❌ (shader é portável) |
| 3 | StyleUI | React + Tailwind | ❌ |
| 4 | Skiper UI | React + shadcn + Framer Motion | ❌ |
| 5 | Ali Imam Components | React + shadcn | ❌ |
| 6 | Watermelon UI | React + Tailwind (premium) | ❌ |
| 7 | Cult UI | React + shadcn | ❌ |
| 8 | Dot Matrix | React + TS + Tailwind + shadcn (`npx shadcn add`) | ❌ (CSS é portável) |
| 9 | Componentry.fun | React (premium) | ❌ |
| 10 | Aceternity UI | React + Tailwind + Framer Motion | ❌ |
| 11 | Magic UI | React + Tailwind + Motion | ❌ |
| 12 | HeroUI | React (ex-NextUI) | ❌ |
| 13 | **Balloons.js** | **TypeScript vanilla, MIT, SVG** | ✅ **única agnóstica** |
| 14 | Shadcn Blocks | React + Tailwind | ❌ |
| 15 | Square UI | React + shadcn | ❌ |
| 16 | Eldora UI | React + Tailwind + Motion | ❌ |

Ou seja: 15 das 16 são **referência visual**, não dependência. O valor delas neste projeto é o repertório — como um card de métrica respira, como um loader se comporta, como um shimmer sugere carregamento — reimplementado em Angular sobre os nossos tokens. A única que se instala hoje é a Balloons.js (celebração pontual, ex.: primeira operação registrada).

Isso transforma a pergunta do RFC. Não é "quais das 16 adotar", é: **adotamos o vocabulário shadcn/Tailwind no Angular (via spartan/ui), adotamos uma suíte pronta, ou construímos nossa camada sobre os tokens usando as 16 como moodboard e trazendo só bibliotecas pontuais?**

---

## Restrições do projeto que qualquer opção precisa respeitar

Não são preferências. São regras já escritas e auditadas mecanicamente:

| Restrição | Origem | Consequência para este RFC |
|---|---|---|
| Nenhuma cor literal (`#`, `rgb()`, `hsl()`) em `src/app/**/*.scss` | **P-003**, verificado por regex no audit | Qualquer biblioteca com tema próprio precisa ser re-tematizada por variáveis, ou o audit quebra |
| Claro e escuro obrigatórios | PRD-001 | Todo componente novo nasce nos dois temas |
| Nada é comunicado só por cor | `_tokens.scss` | Alta/baixa levam sinal; ícone nunca substitui rótulo |
| **Sem tempo real, sem polling** — todo preço é snapshot datado | **ADR-005** | O ticker pode *rolar*, mas nunca pode *parecer* ao vivo: "Atualizado às HH:MM" continua obrigatório |
| **Sem série histórica** | **ADR-010** | Proibido gráfico de evolução/linha do tempo. Isso elimina o principal motivo para trazer ECharts/TradingView |
| Aviso nunca parece erro; degradação vira aviso | ADR-006 | O redesenho de feedback precisa manter 3 níveis distinguíveis sem cor |
| Desktop apenas no v1, `--largura-minima-app: 1024px` | `_tema.scss` | Sem custo de responsividade mobile agora |
| Erro tratado por código, nunca por texto | P-004 | Toast/snackbar precisa carregar `codigo` |

---

## Suposições

| # | Suposição | Confiança | Gatilho de invalidação |
|---|---|---|---|
| 1 | O time é uma pessoa (@Lucas); não há custo de alinhamento, mas há custo de manutenção de código próprio | Alta | Entrada de outra pessoa no projeto |
| 2 | ADR-005 e ADR-010 continuam valendo no v1 — sem streaming e sem histórico | Alta | Backend passar a expor série histórica ou websocket |
| 3 | O orçamento de bundle atual (500 kB warning / 1 MB error, inicial) é para ser respeitado | Alta | Alteração explícita em `angular.json` |
| 4 | Logos de ativos podem ser servidos por nós; **hotlink do `investidor10.com.br/storage/...` não é uma opção** (imagens de terceiros, sem licença, sem estabilidade de URL, bloqueio de referer provável) | Média | Contratação de um provedor de logos com licença |
| 5 | Não há verba para licença paga (Syncfusion, AG Grid Enterprise, PrimeNG pós-fechamento, blocos premium) | Média | Decisão de investir |
| 6 | O motor de validação `@onovoprogramador/onp-ui-ux` (já em devDependencies) continua sendo o gate de UI | Alta | Remoção da dependência |

---

## Critérios de decisão

Definidos **antes** das opções.

| # | Critério | Descrição | Peso |
|---|---|---|---|
| 1 | Compatibilidade com Angular 22 standalone/signals/zoneless | Sem wrapper morto, sem `NgModule` legado | **Must-have** |
| 2 | Não violar P-003 nem quebrar o audit | Tema por variáveis CSS, sem cor literal em tela | **Must-have** |
| 3 | Preservar honestidade do dado (ADR-005/006/010) | Nada pode sugerir tempo real nem histórico inexistente | **Must-have** |
| 4 | Licença livre e sustentável | Sem lock-in comercial, sem repositório arquivado | **Must-have** |
| 5 | Ganho visual percebido pelo investidor | Quanto a tela muda de patamar aos olhos do usuário final | Alto |
| 6 | Custo de bundle | Cabe no orçamento inicial sem lazy-load acrobático | Alto |
| 7 | Reversibilidade | Dá para desfazer sem reescrever telas | Alto |
| 8 | Esforço de implementação | Dias de trabalho até o primeiro resultado visível | Médio |
| 9 | Consistência com o que já existe | Aproveita tokens, `MensagemFeedback`, `Variacao`, estrutura `blocos/` | Médio |
| 10 | Acessibilidade preservada | Tabela semântica, `role`, foco visível, contraste nos dois temas | Médio |

**Regra de decisão:** a opção precisa passar em todos os Must-have; entre as sobreviventes, vence a de maior ganho percebido por unidade de esforço e maior reversibilidade.

---

## Dados relevantes

- **Superfície a mexer:** 8 features, ~40 componentes, 3 "gráficos", 4 tabelas/listas, 2 telas de acesso, 1 barra de mercado, 1 casca.
- **Dependências de UI hoje:** `@angular/material` + `@angular/cdk` apenas. Nenhuma outra.
- **Referências de mercado analisadas:** 12 capturas em [`docs/references/`](../references/) — 4 do Investidor10, 4 do StatusInvest e 4 mocks de dashboard financeiro. Análise detalhada na seção "Leitura das referências visuais" abaixo.
- **Alerta de mercado:** **PrimeNG fechou o código e teve o repositório arquivado em 28/06/2026**, com fork comunitário (OpenNG) ainda em beta. Isso rebaixa fortemente a opção "suíte pronta".
- **Estado das alternativas Angular-native (setembro/2026):** spartan/ui está em 1.0 estável, 55+ componentes, arquitetura Brain (npm, sem estilo) + Helm (copiado para o projeto, estilizado), signals e zoneless — mas **exige Tailwind v4**. TanStack Table v9 saiu estável em 04/08/2026 com adapter Angular oficial baseado em signals. `@lucide/angular` é o pacote atual (o antigo `lucide-angular` está deprecado), tree-shakable, um componente standalone por ícone.

---

## Leitura das referências visuais

Fonte: [`docs/references/`](../references/) — 12 capturas. Elas não mudam a escolha da opção; mudam o **alvo** e acrescentam itens ao inventário.

### O que confirma o que já estava planejado

| Padrão observado | Onde | Item do inventário |
|---|---|---|
| Card de métrica: ícone em círculo suave + rótulo pequeno + número grande + métricas secundárias na base | Investidor10 Posições, StatusInvest Dashboard | #12 |
| Variação como **badge** (fundo suave + seta + sinal), não texto colorido solto | Investidor10 Posições (`6,80% ▲` / `-2,21% ▼`) | #10 |
| Seta `↑`/`↓` antes do número, redundante com a cor | StatusInvest Análise de Resultados | reforça a regra "nada só por cor" |
| Logo do ativo em chip quadrado arredondado, à esquerda do ticker | Investidor10 Posições e Lançamentos | #7 |
| Ordenação com glifo de duas setas no cabeçalho | Investidor10, StatusInvest | #8 |
| Donut com rótulos externos e legenda | mock Farmaku | #14 |
| Zebra sutil + hover de linha + números à direita | todas as tabelas | #9 |
| Badge de status com fundo tonal (`Available` / `Low Stock` / `Empty`) | mock Farmaku | #10, #17 |

### O que as referências acrescentaram ao inventário

| # | Item novo | Referência |
|---|---|---|
| 29 | **Paginador completo**: seletor de linhas por página, números de página, "Exibindo 1–10 de 135". Hoje temos dois botões e "Página X de Y" | mock Clientes; StatusInvest |
| 30 | **Célula de dois níveis**: valor principal grande + valor de comparação menor embaixo, na mesma célula | StatusInvest Análise de Resultados |
| 31 | **Cabeçalho de tabela agrupado** em duas linhas (grupo → colunas) | StatusInvest Análise de Resultados |
| 32 | **Ícones de ação por linha** (ver / editar / excluir) em vez de botões com texto — recupera muita largura no extrato | mock Clientes; mock Farmaku |
| 33 | **Estado vazio com desenho**: texto centralizado + ação primária, dentro do card | StatusInvest (card Metas) |
| 34 | **Barra de progresso + fileira de mini-cards**, com o card do objetivo em contraste invertido | Investidor10 Metas |
| 35 | **Chip de cotação em pílula** no topo: ícone + símbolo + preço + badge de variação | mock cripto (barra superior) |

### O que as referências desmentem ou restringem

1. **A barra superior do Investidor10 nas capturas é navegação, não ticker.** Fundo escuro, logo, seletor de carteira, ações à direita. A rolagem de cotações que motivou o pedido está no site ao vivo, não nessas telas. Vale separar as duas coisas: **escurecer a casca** (item novo) e **animar a barra de mercado** (#2) são decisões independentes.
2. **A alternativa ao marquee é melhor do que o marquee.** O mock cripto resolve o mesmo problema com chips em pílula, estáticos. Com ~5 itens, rolar não acrescenta informação — só movimento — e movimento contínuo é justamente o que sugere tempo real, que ADR-005 proíbe afirmar. Fica como decisão aberta (D7).
3. **"+0,00% em relação ao mês anterior"** aparece em todo card do StatusInvest e **é impossível para nós**: exige mês anterior, e ADR-010 não guarda série. Nossos cards precisam de um terceiro elemento próprio no lugar dessa linha.
4. **Sparkline por ativo** aparece no mock cripto e continua proibido pelo mesmo motivo.
5. **Três dos quatro mocks usam sidebar lateral**; nossa casca usa navegação no topo. Adotar sidebar é mudança de layout, não de estilo — fora do escopo desta rodada salvo decisão explícita.
6. **Todas as referências são tema claro**, exceto o mock cripto, que é neon e destoa da nossa paleta escura sóbria. O tema escuro não tem referência utilizável: precisa ser desenhado a partir dos nossos tokens, não copiado.

---

## O que dá para fazer hoje — inventário de melhorias

Levantamento independente da opção escolhida. Cada item aponta a tela real e a restrição que o limita.

### A. Barra de cotações (pedido explícito)
1. Fundo escuro fixo nos dois temas — exige tokens novos (`--cor-barra-mercado-fundo/-texto/-borda`), porque hoje ela usa `--cor-superficie` e P-003 proíbe cor literal na tela.
2. Rolagem contínua horizontal em loop (marquee), com `animation-play-state: paused` no `:hover` e respeito a `prefers-reduced-motion` — CSS puro, sem biblioteca.
3. Logo do ativo antes do símbolo, variação com seta + sinal, preço em `--fonte-numero`.
4. **Manter "Atualizado às HH:MM" visível** — ADR-005. Rolar não pode virar promessa de tempo real.

### B. Ícones (pedido explícito)
5. Trocar os caracteres `i` / `!` / `×` do feedback por ícones reais.
6. Ícones na navegação da casca, nas ações de tabela (editar/excluir), nos estados vazios.
7. **Logos de ativo**: precisa de solução própria — não hotlinkar o Investidor10 (suposição 4). Caminhos: (a) pasta `public/ativos/{TICKER}.svg` curada manualmente; (b) monograma gerado — círculo com as 4 letras do ticker, cor derivada de hash sobre a paleta de séries; (c) provedor licenciado. O monograma é o único que escala para o catálogo inteiro sem trabalho manual nem risco jurídico, e serve de fallback nos outros dois.

### C. Tabelas (pedido explícito)
8. Ordenação por coluna no extrato e nas posições (client-side na página atual — ADR-010 proíbe filtro/ordenação server-side no v1).
9. Densidade e legibilidade: números alinhados à direita em `--fonte-numero`, `tabular-nums`, zebra sutil, cabeçalho fixo, hover de linha.
10. Sinalização de compra/venda e resultado com badge (cor + sinal + rótulo).
11. Estado vazio e skeleton com a mesma silhueta da tabela.

### D. Dashboards (pedido explícito)
12. Cards de métrica com hierarquia real: rótulo pequeno, número grande, variação em badge — hoje `consolidado.html` é um `<dl>` chapado.
13. Animação de contagem nos números ao carregar (curta, respeitando `prefers-reduced-motion`).
14. Donut/rosca na composição em vez de barras horizontais — mesmo dado, muito mais legível.
15. Sparkline **é proibido** (ADR-010 — não há série). O substituto honesto é a barra de participação com rótulo, que já existe.
16. Micro-interações: hover destacando a fatia e a linha correspondente da legenda.

### E. Feedback (pedido explícito)
17. **Criar o nível `sucesso`** — hoje não existe em `NivelFeedback`. Precisa de tokens `--cor-sucesso-*` e de um símbolo próprio.
18. Toast/snackbar para ações concluídas (operação salva, carteira criada), hoje inexistente — carregando `codigo` quando houver (P-004).
19. Animação de entrada/saída das mensagens e ícone por nível, mantendo os 3 (4) níveis distinguíveis sem depender de cor (ADR-006).
20. Celebração pontual na primeira operação registrada — é onde Balloons.js caberia.

### F. Acesso — login e cadastro (pedido explícito)
21. Layout em duas colunas: formulário à esquerda, painel de marca à direita.
22. Validação inline com estado visual progressivo; medidor de força de senha no cadastro.
23. Botão com estado de carregamento próprio em vez de trocar o texto para "Entrando…".
24. Fundo animado discreto no painel de marca — é aqui, e só aqui, que um efeito tipo Liquid Metal se justificaria.

### G. Transversal
25. Skeletons decentes — hoje são três `<span>` vazios.
26. Transições de rota e `@angular/animations` (já instalado, nunca usado).
27. Tipografia numérica (`Roboto Mono` já está no token, pouco aplicado) e escala tipográfica mais contrastada.
28. Foco visível consistente e alvo de clique adequado — o gate `onp-ui-ux` já cobra isso.

---

## Opções consideradas

### Opção 1: Camada própria sobre os tokens + bibliotecas pontuais agnósticas ⭐ (Recomendada)

**Descrição.** Manter Angular Material no papel mínimo que já tem, tratar as 16 bibliotecas como **moodboard** e construir um pequeno conjunto de primitivas próprias (`shared/ui/`: card, badge, tabela, skeleton, toast, ticker) sobre `_tokens.scss`. Trazer apenas três dependências, cada uma resolvendo um problema que não vale a pena reimplementar.

**Como funciona.**
1. `@lucide/angular` para ícones — tree-shakable, standalone, um `svg[lucideX]` por ícone, herda `currentColor` (nenhuma cor literal → P-003 intacto).
2. `@tanstack/angular-table` v9 (headless, signals) para ordenação/colunas do extrato, mantendo o `<table>` semântico atual — a biblioteca dá a lógica, o HTML e o CSS continuam nossos.
3. `balloons-js` (MIT, ~kB) para a celebração da primeira operação.
4. Ampliar `_tokens.scss`: `--cor-sucesso-*`, `--cor-barra-mercado-*`, escala de sombra e de raio.
5. Gráficos continuam SVG à mão — a composição vira donut (~60 linhas de trigonometria), sem biblioteca de charts, porque ADR-010 já matou o único caso que justificaria uma.
6. Ticker, skeletons, contagem de números e transições: CSS + `@angular/animations`, ambos já disponíveis.

**Prós.**
- Passa em todos os Must-have por construção; o audit não corre risco.
- Bundle quase inalterado — Lucide é por ícone, TanStack Table headless são poucos kB, Balloons é minúsculo.
- Reversibilidade máxima: cada peça sai sem tocar as outras.
- Aproveita 100% do que já existe (`MensagemFeedback`, `Variacao`, `blocos/`, tokens).
- Permite copiar as *ideias* das 16 bibliotecas sem herdar Tailwind, React ou tema alheio.

**Contras.**
- Nada vem pronto: cada card, badge e toast é código nosso para manter e testar.
- Depende de disciplina de design; sem direção, vira inconsistência — mitigado pelo gate `onp-ui-ux`.
- O ganho visual chega em incrementos, não num "antes e depois" de uma tacada.

**Custo estimado:** MÉDIO — ~8 a 12 dias para os 28 itens do inventário. Risco: BAIXO.

---

### Opção 2: Adotar spartan/ui + Tailwind v4 (o "shadcn do Angular")

**Descrição.** Instalar Tailwind v4 e spartan/ui, que traz exatamente o vocabulário shadcn das 16 bibliotecas para Angular: Brain (primitivas acessíveis via npm) + Helm (estilos copiados para o projeto, nossos para editar). Traduzir os blocos de ReUI/Cult UI/Shadcn Blocks para os equivalentes Helm.

**Como funciona.**
1. Instalar Tailwind v4 + preset spartan; migrar `_tokens.scss` para as variáveis do tema shadcn (`--background`, `--foreground`, `--primary`…).
2. Copiar os componentes Helm necessários (card, table, badge, sonner/toast, dialog, sheet, tabs).
3. Reescrever as telas trocando SCSS por classes utilitárias.
4. Angular Material sai ou convive (dois sistemas de botão/input).

**Prós.**
- É o caminho mais direto para a estética que o usuário reconheceu nas 16 referências.
- 55+ componentes prontos, 1.0 estável, signals e zoneless — alinhado com o Angular 22.
- Data Table, Sidebar, Calendar e Date Picker prontos, cobrindo tabelas e mais.
- Código Helm fica no projeto: sem lock-in de runtime.

**Contras.**
- **Conflito direto com P-003.** Tailwind traz cor por classe utilitária (`bg-emerald-500`) — o regex do audit mira `.scss`, então a cor passaria pelo HTML sem ser vista, que é exatamente o buraco que P-003 existe para fechar. Ou reescrevemos P-003, ou proibimos classes de cor do Tailwind, ou aceitamos a regressão.
- Dois sistemas de design convivendo (Material + spartan) até a migração terminar.
- Migração de `_tokens.scss` para o modelo shadcn é uma reescrita do sistema de cores existente, que hoje é bem pensado (daltonismo validado, séries de ordem fixa).
- **Baixa reversibilidade** — sair depois significa reescrever as telas de novo.
- Esforço concentrado antes de qualquer ganho visível.

**Custo estimado:** GRANDE — ~20 a 30 dias. Risco: MÉDIO-ALTO (constituição + retrabalho de tokens).

---

### Opção 3: Suíte de componentes pronta (PrimeNG / Syncfusion / AG Grid)

**Descrição.** Adotar uma suíte comercial ou semicomercial que entrega tabela, gráficos, toasts e cards prontos.

**Prós.**
- Tabela profissional e componentes ricos imediatamente.
- Muito pouco código próprio.

**Contras.**
- **Falha em Must-have #4.** PrimeNG fechou o código e arquivou o repositório em 28/06/2026; o fork comunitário (OpenNG) está em beta. Syncfusion e AG Grid Enterprise são licença paga (contraria a suposição 5).
- Tema próprio e pesado, difícil de amarrar nos tokens sem cor literal.
- Bundle grande contra um orçamento de 500 kB.
- Lock-in alto, reversibilidade baixa.
- Resolve tabela — mas o pedido do usuário é sobretudo estética e micro-interação, que suíte corporativa não entrega.

**Custo estimado:** MÉDIO em esforço, ALTO em risco e possivelmente financeiro. **Desqualificada pelo Must-have #4.**

---

### Opção 4: Não fazer nada (status quo)

**Descrição.** Manter a UI atual e investir só em função.

**Prós.**
- Custo zero, risco zero, audit continua limpo.
- A UI atual é acessível, honesta e correta — não é uma UI ruim, é uma UI crua.

**Contras.**
- A lacuna com Investidor10/StatusInvest continua sendo o primeiro julgamento do investidor.
- Nível `sucesso` continua inexistente e ações concluídas seguem sem confirmação visível — isso é lacuna funcional de feedback (PRD-009), não só estética.
- Cada melhoria pontual futura vira decisão ad-hoc, sem critério, com risco de cor literal vazando.

**Custo estimado:** PEQUENO agora, crescente depois.

---

## Comparação

| Critério | Peso | Opção 1 (própria + pontuais) | Opção 2 (spartan + Tailwind) | Opção 3 (suíte pronta) | Opção 4 (nada) |
|---|---|---|---|---|---|
| Angular 22 signals/zoneless | Must | ✅ | ✅ | ⚠️ parcial | ✅ |
| Não viola P-003 / audit | Must | ✅ | ❌ exige rever P-003 | ⚠️ tema difícil de amarrar | ✅ |
| Preserva ADR-005/006/010 | Must | ✅ | ✅ | ⚠️ componentes sugerem tempo real/histórico | ✅ |
| Licença livre e sustentável | Must | ✅ | ✅ | ❌ PrimeNG fechado / pagos | ✅ |
| Ganho visual percebido | Alto | Alto | Muito alto | Médio | Nenhum |
| Custo de bundle | Alto | Muito baixo | Médio | Alto | Zero |
| Reversibilidade | Alto | Muito alta | Baixa | Muito baixa | — |
| Esforço | Médio | 8–12 dias | 20–30 dias | 5–10 dias | 0 |
| Consistência com o existente | Médio | Muito alta | Baixa (reescreve tokens) | Baixa | Total |
| Acessibilidade | Médio | Mantida (HTML nosso) | Boa (Brain é acessível) | Variável | Mantida |

**Recomendação: Opção 1.** É a única que passa nos quatro Must-have sem negociar a constituição, entrega ganho visível em dias e sai barato se estiver errada. A Opção 2 é a mais bonita no papel e continua sendo o caminho natural **se** houver disposição de reescrever P-003 e o sistema de cores — é uma decisão de constituição, não de biblioteca, e merece um RFC próprio. A Opção 3 está desqualificada.

---

## Decisões abertas para discussão

A Opção 1 recomendada deixa cinco escolhas em aberto, cada uma independente das outras:

| # | Decisão | Alternativas | Recomendação |
|---|---|---|---|
| D1 | Logos de ativo | (a) SVGs curados em `public/ativos/` · (b) monograma gerado por ticker · (c) provedor licenciado · (d) hotlink Investidor10 | ✅ **DECIDIDO (2026-09-09): (b) monograma como padrão, via `pipes/initials` do `ngx-oneforall` (RFC-002), com (a) por cima para os tickers mais comuns.** (d) está fora: imagem de terceiro sem licença |
| D2 | Tabelas | (a) `<table>` atual + ordenação própria (~80 linhas) · (b) TanStack Table v9 · (c) `mat-table` + `MatSort` | ✅ **DECIDIDO (2026-09-09): (b) TanStack Table v9.** Headless com signals; o `<table>` semântico e o CSS continuam nossos |
| D3 | Gráficos | (a) SVG à mão (atual) · (b) uPlot (~20 kB) · (c) ECharts/ngx-echarts | **(a).** ADR-010 elimina o caso de uso das outras duas |
| D4 | Toast/snackbar | (a) componente próprio + `@angular/animations` · (b) `MatSnackBar` (já instalado) | **(b)** para chegar rápido, com o conteúdo sendo o nosso `MensagemFeedback` |
| D5 | Efeitos "wow" (Liquid Metal, Balloons, Dot Matrix) | (a) nenhum · (b) só Balloons na primeira operação · (c) Balloons + fundo animado no login | **(b)**, avaliar (c) depois. Nada disso entra em tela de dado financeiro |
| D6 | Tailwind CSS dentro da Opção 1 | (a) não · (b) Tailwind v4 com `@theme { --color-*: initial }` mapeado nos tokens | **(a) — rejeitado.** Ver "Nota sobre Tailwind" abaixo |
| D7 | Barra de mercado | (a) marquee rolando em loop · (b) chips em pílula estáticos, fundo escuro · (c) chips com rolagem só quando não couberem | ✅ **DECIDIDO (2026-09-09): (a) marquee rolando para a esquerda, em loop contínuo**, como no Investidor10. Sobrepõe a recomendação original (c) |

**Nota sobre D7.** A recomendação inicial era (c), pelo receio de que movimento contínuo sugerisse cotação ao vivo, que o ADR-005 proíbe afirmar. O dono do produto decidiu por (a). A preocupação é endereçada por três exigências que passam a valer para a barra:

1. O carimbo "Atualizado às HH:MM" continua visível e fora da área que rola — é ele que diz a verdade sobre a idade do dado (ADR-005).
2. A animação para no `:hover` e no foco por teclado, para que qualquer cotação possa ser lida com calma.
3. A rolagem respeita `prefers-reduced-motion` e usa apenas `transform: translateX()` — nunca `left` ou `margin` (regras M02 e M04 do motor de UI).

### Nota sobre Tailwind (D6)

Avaliado e rejeitado, mas não pelo motivo que a Opção 2 dá. Dois achados corrigem o que está escrito lá:

1. Angular 22 traz Tailwind como `--style` de primeira classe — o CLI instala, escreve o `.postcssrc.json` e liga no `styles.scss`. O atrito de setup é quase zero.
2. `@theme { --color-*: initial; }` apaga a paleta padrão do Tailwind v4. Com ela apagada, `bg-red-500` **não compila** — garantia mecânica mais forte que o regex atual do audit, que só enxerga `.scss`.

Ou seja, a frase "conflito direto com P-003" na Opção 2 vale só para Tailwind com defaults ligados.

O motivo real da rejeição é outro: **a configuração que respeita a constituição anula o benefício**. O único ganho concreto seria transportar snippets das 16 bibliotecas, e esses snippets são `bg-zinc-900`, `gap-4`, `text-emerald-500`. Zerando `--color-*` e mapeando `--spacing-*` nos nossos `--espaco-1..6`, nenhuma dessas classes compila — reescreve-se tudo de qualquer jeito. Sobra a conveniência de digitação, contra três custos que ficam de pé: custo de migração (o ganho só aparece migrando os 36 SCSS; adotar só em componente novo deixa dois idiomas de estilo convivendo), escala errada (1 dev, ~40 componentes, SCSS já escopado — o problema de cascata que o Tailwind resolve não existe aqui) e convivência com Material via `@layer`. Fica também um furo residual: `bg-[#0b0f14]` continua escrevível e exigiria regra nova de audit sobre `*.html`.

**Correção (2026-09-09):** a primeira redação desta nota dizia que sair do Tailwind depois significaria "reescrever ~40 templates", sugerindo risco de quebra. Verificado no código, isso está errado: **Tailwind não quebraria a base**. Nenhum teste se acopla a CSS (331 seletores são `data-*`, zero são classe, zero usam `classList` ou `toHaveClass`), nenhum componente declara `ViewEncapsulation` e há apenas 3 usos de `:host`/`::ng-deep`. A instalação seria segura e, em adoção incremental, reversível. O que decide não é risco de quebra — é o custo de migração contra o benefício, que a configuração constitucional anula. O outro efeito real é que P-003 deixaria de ser **provável**: o regex olha `src/app/**/*.scss` e a cor passaria a morar no `.html`, fora do alcance da prova.

Se em algum momento o objetivo virar o ecossistema shadcn, o caminho é a Opção 2 inteira com spartan/ui — não Tailwind avulso, que paga quase todo o custo da Opção 2 sem entregar nenhum dos 55 componentes.

---

## Action Items

| Ação | Owner | Prazo | Status |
|---|---|---|---|
| Decidir entre Opção 1, 2 e 4 | @Lucas | TBD | NOT STARTED |
| Fechar D1–D5 | @Lucas | TBD | NOT STARTED |
| Se Opção 2: abrir RFC-002 para revisar P-003 antes de qualquer instalação | @Lucas | TBD | NOT STARTED |
| Ampliar `_tokens.scss` (`--cor-sucesso-*`, `--cor-barra-mercado-*`, sombra) | @Lucas | TBD | NOT STARTED |
| Adicionar `sucesso` a `NivelFeedback` + testes | @Lucas | TBD | NOT STARTED |
| Especificar via `onp-spec-driven` em 5 features (decidido 2026-09-09): `fundacao-visual` primeiro; depois `repaginacao-tabelas`, `repaginacao-painel`, `repaginacao-desempenho` e `repaginacao-acesso`, que tocam arquivos disjuntos e podem ir em faixas paralelas | @Lucas | TBD | IN PROGRESS |
| Rodar o gate `@onovoprogramador/onp-ui-ux` a cada tela repaginada | @Lucas | TBD | NOT STARTED |

---

## Outcome

**Decisão:** **Opção 1** — camada própria sobre os tokens, com `@lucide/angular`, `@tanstack/angular-table` e `balloons-js` como únicas dependências novas. Tailwind rejeitado (D6).

**Data:** 2026-09-09

**Decidido por:** @Lucas

**Racional:** é a única opção que passa nos quatro Must-have sem renegociar a constituição. As outras caem assim: a Opção 3 morre no Must-have #4 (PrimeNG fechou o código em 28/06/2026; Syncfusion e AG Grid Enterprise são pagos); a Opção 2 exige reescrever P-003 e migrar `_tokens.scss` para o modelo shadcn, o que é decisão de constituição e não de biblioteca; a Opção 4 deixa de pé uma lacuna funcional real — não existe nível `sucesso` e ações concluídas não têm confirmação visível (PRD-009). A Opção 1 entrega ganho visível em dias, mantém o bundle praticamente intacto e é reversível peça a peça.

**Fatores decisivos:**
- 15 das 16 bibliotecas do repertório inicial são React/Tailwind — são moodboard, não dependência. Isso removeu "adotar biblioteca X" do cardápio antes da comparação começar.
- ADR-010 (sem série histórica) elimina gráfico de evolução e sparkline, que eram o único caso capaz de justificar ECharts ou uPlot. Sem eles, gráfico continua sendo SVG nosso.
- Reversibilidade foi o critério que separou a Opção 1 da 2: cada dependência da 1 sai sozinha; Tailwind, não.

**Condições:**
- D1–D5 e D7 precisam ser fechadas antes da implementação começar.
- Toda tela repaginada passa pelo gate `@onovoprogramador/onp-ui-ux` e mantém o audit em exit 0.
- Se surgir necessidade real do ecossistema shadcn, reabrir como RFC-002 (Opção 2 completa), não como Tailwind avulso.

---

## Referências

- spartan/ui — <https://spartan.ng/documentation/introduction> · <https://github.com/spartan-ng/spartan>
- TanStack Table v9 — <https://tanstack.com/blog/announcing-tanstack-table-v9> · <https://www.npmjs.com/package/@tanstack/angular-table>
- Lucide para Angular — <https://lucide.dev/guide/angular/getting-started> · <https://www.npmjs.com/package/@lucide/angular>
- Balloons.js — <https://github.com/arturbien/balloons-js>
- ReUI (instalação/stack) — <https://reui.io/docs/installation>
- Dot Matrix — <https://dotmatrix.zzzzshawn.cloud/>
- PrimeNG fechando o código — <https://github.com/orgs/primefaces/discussions/4780>
- Investidor10 (referência visual) — <https://investidor10.com.br/>
- StatusInvest — <https://statusinvest.com.br/> (não inspecionável programaticamente: HTTP 403)
