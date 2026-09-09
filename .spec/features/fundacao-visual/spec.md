# Spec: Fundacao visual

> feature: fundacao-visual
> status: rascunho

## Contexto

A camada visual comum que todas as telas vão consumir na repaginação decidida no
RFC-001 (Opção 1) e no RFC-002 (Opção 1): os tokens que faltam, o nível de
comunicação que não existe, os ícones que hoje são caracteres soltos e as
primitivas de apresentação que cada tela hoje refaz do zero. Nenhuma tela de
produto é repaginada aqui — o que se constrói é o que as quatro features de
repaginação seguintes vão usar.

O problema é concreto: o produto tem três níveis de comunicação (informação,
aviso, erro) e **nenhuma forma de dizer que deu certo**; desenha os símbolos de
feedback com os caracteres `i`, `!` e `×` dentro de um `<span>`; e repete
esqueleto, estado vazio e paginação em cada tela, cada vez de um jeito.

## Histórias

### US-056 — Saber que a ação deu certo

Como investidor, quero uma confirmação visível quando uma ação minha é concluída,
para que eu não fique em dúvida se a operação foi registrada.

#### AC-212 — O produto sabe dizer "deu certo"

- **Dado** que o produto comunica em níveis (informação, aviso, erro)
- **Quando** uma mensagem de nível sucesso é exibida
- **Então** ela aparece com rótulo próprio ("Sucesso"), símbolo próprio e papel
  de status, distinguível dos outros três níveis sem depender da cor (ADR-006)

#### AC-213 — Confirmação temporária de ação concluída

- **Dado** que o investidor concluiu uma ação que altera dados
- **Quando** a ação termina com êxito
- **Então** uma notificação temporária anuncia o resultado e desaparece sozinha,
  sem exigir clique e sem bloquear a tela

#### AC-214 — Notificação de falha carrega o código

- **Dado** que uma ação falhou e o servidor devolveu um código de erro
- **Quando** a notificação da falha é exibida
- **Então** ela mostra o código junto da mensagem, permanece na tela até o
  investidor dispensá-la, e o comportamento é decidido pelo código, nunca pelo
  texto (P-004)

### US-057 — Ler a interface pelos ícones

Como investidor, quero ícones reconhecíveis no lugar de caracteres soltos, para
que eu identifique o tipo de aviso e as ações da tela sem ler tudo.

#### AC-215 — Cada nível de comunicação tem ícone próprio

- **Dado** uma mensagem de qualquer nível
- **Quando** ela é exibida
- **Então** apresenta um ícone próprio do nível, marcado como decorativo para
  leitores de tela, e o rótulo textual do nível continua presente

#### AC-216 — Botão de ícone tem nome acessível

- **Dado** um botão cujo conteúdo visível é apenas um ícone
- **Quando** ele é renderizado
- **Então** possui nome acessível descrevendo a ação, e o ícone é decorativo

#### AC-217 — Alvo de clique com tamanho mínimo

- **Dado** um controle acionável apenas por ícone
- **Quando** ele é renderizado
- **Então** sua área acionável tem pelo menos 24 por 24 pixels (WCAG 2.5.8, regra
  T01 do motor de UI)

### US-058 — Reconhecer o ativo de relance

Como investidor, quero identificar visualmente cada ativo na lista, para que eu
localize o que procuro sem ler ticker por ticker.

#### AC-218 — Ativo sem logo exibe monograma

- **Dado** um ativo cujo logo não está disponível
- **Quando** ele é exibido em lista, tabela ou cartão
- **Então** aparece um monograma com as iniciais do ticker no lugar do logo

#### AC-219 — A cor do monograma é estável por ativo

- **Dado** o mesmo ticker exibido em telas diferentes ou em momentos diferentes
- **Quando** o monograma é gerado
- **Então** a cor é sempre a mesma para aquele ticker e vem da paleta de séries
  já definida em tokens, nunca de cor literal

#### AC-220 — O monograma se identifica

- **Dado** um monograma exibido no lugar do logo
- **Quando** um leitor de tela percorre o elemento
- **Então** o ticker do ativo é anunciado

### US-059 — Ver as telas falarem a mesma língua

Como investidor, quero que carregamento, listas vazias e paginação se comportem
igual em todo o produto, para que eu não precise reaprender cada tela.

#### AC-221 — Esqueleto de carregamento com a silhueta do conteúdo

- **Dado** um bloco que ainda está carregando
- **Quando** o esqueleto é exibido
- **Então** ele ocupa a mesma silhueta do conteúdo que vai substituí-lo e é
  ignorado por leitores de tela

#### AC-222 — Selo comunica por texto, não só por cor

- **Dado** um selo de situação (alta, baixa, estável, sucesso, aviso, erro)
- **Quando** ele é exibido
- **Então** traz texto legível além da cor, e nenhuma informação depende
  exclusivamente da cor

#### AC-223 — Lista vazia diz o próximo passo

- **Dado** uma lista sem nenhum item
- **Quando** o estado vazio é exibido
- **Então** ele explica por que está vazio e indica a ação seguinte, em vez de
  apenas informar ausência

#### AC-224 — Paginador informa posição e limites

- **Dado** um conjunto paginado de resultados
- **Quando** o paginador é exibido
- **Então** ele informa a página atual, o total de páginas e a faixa de itens
  exibida, e desabilita o controle de avançar na última página e o de voltar na
  primeira

#### AC-225 — Cartão agrupa com hierarquia previsível

- **Dado** um bloco de conteúdo apresentado como cartão
- **Quando** ele é exibido
- **Então** apresenta título como cabeçalho de seção e conteúdo em região
  própria, com a mesma estrutura em todas as telas

### US-060 — Enxergar bem nos dois temas

Como investidor que usa o produto de dia e de noite, quero legibilidade e foco
visíveis nos dois temas, para que eu não perca informação por causa da aparência.

#### AC-226 — Todo par de cor novo passa em contraste

- **Dado** os pares texto/fundo dos tokens introduzidos por esta feature
- **Quando** o contraste de cada par é calculado no tema claro e no escuro
- **Então** todos alcançam pelo menos 4.5:1 (WCAG AA, regra C01 do motor de UI)

#### AC-227 — A barra de mercado tem superfície própria e escura

- **Dado** a barra de contexto de mercado
- **Quando** ela é exibida em qualquer um dos dois temas
- **Então** usa tokens de superfície próprios, escuros nos dois temas, e não a
  superfície padrão do produto

#### AC-228 — Foco sempre visível

- **Dado** qualquer elemento interativo das primitivas
- **Quando** ele recebe foco pelo teclado
- **Então** exibe indicador de foco visível, e nenhum estilo remove o contorno
  sem oferecer substituto (regras F01 e F02 do motor de UI)

#### AC-232 — A cor de destaque entra como preenchimento, nunca como texto

- **Dado** a cor de destaque do produto (`#eaef1b`, extraída da referência em
  `docs/references/`)
- **Quando** ela é aplicada em qualquer superfície, em qualquer um dos dois temas
- **Então** serve de preenchimento com texto escuro por cima, com contraste de
  pelo menos 4.5:1, e não é usada como cor de texto sobre os fundos do produto —
  onde alcança apenas 1.16:1 no tema claro

### US-061 — Não ser atrapalhado pelo movimento

Como investidor sensível a movimento, quero poder desligar as animações, para que
a interface não me atrapalhe.

#### AC-229 — Toda animação respeita a preferência do sistema

- **Dado** um usuário com preferência por movimento reduzido
- **Quando** qualquer animação das primitivas seria executada
- **Então** ela é desativada ou reduzida (regras M01 e M04 do motor de UI)

#### AC-230 — Animação não causa reflow

- **Dado** qualquer animação das primitivas
- **Quando** ela é executada
- **Então** anima apenas `transform` e `opacity`, nunca propriedades de layout
  (regra M02 do motor de UI)

### US-062 — Preencher formulário com leitor de tela

Como investidor que usa leitor de tela, quero que todo campo anuncie o que
espera de mim, para que eu preencha o formulário sem adivinhar.

#### AC-231 — Todo campo tem rótulo verificável sem executar a tela

- **Dado** qualquer campo de formulário do produto
- **Quando** o código da tela é analisado estaticamente
- **Então** o campo tem nome acessível declarado no próprio template, sem
  depender de associação criada em tempo de execução (regra A02 do motor de UI)

## Fora de escopo

- Repaginar qualquer tela de produto — painel, extrato, desempenho, acesso. Esta
  feature entrega as peças; as telas vêm nas quatro features seguintes.
- A **barra de mercado em si**: aqui só nascem os tokens de superfície dela. O
  comportamento (chips, rolagem, D7 do RFC-001) é da `repaginacao-painel`.
- Ordenação e colunas de tabela via `@tanstack/angular-table` — é da
  `repaginacao-tabelas`. Aqui só nasce a apresentação do paginador.
- Gráficos, donut e micro-interações — da `repaginacao-desempenho`.
- Celebração com `balloons-js` — da `repaginacao-painel`.
- Trocar validadores, interceptors ou guards já existentes por equivalentes do
  `ngx-oneforall` (proibido pelo RFC-002, Opção 2 desqualificada).
- Qualquer outra mudança nas telas tocadas por T-091 além do rótulo acessível:
  a tarefa acrescenta `aria-label` e nada mais.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-051 | `pipes/initials` do `ngx-oneforall` gera o monograma a partir do ticker sem adaptação | aberta | — |
| ASM-052 | `@lucide/angular` mantém o bundle dentro do orçamento inicial (500 kB de aviso) por importar um componente por ícone | aberta | — |
| ASM-053 | Os valores escolhidos para `--cor-sucesso-*` e `--cor-barra-mercado-*` passam em 4.5:1 nos dois temas sem precisar mexer nos tokens já existentes | aberta | — |
| ASM-054 | As primitivas cobrem as quatro features seguintes sem precisar de uma sexta primitiva | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-026 | Os 11 alertas A02 do motor de UI são falso-positivo do Angular Material (o `mat-label` vira `label for` só em tempo de execução). Resolver com `aria-label` explícito nos campos, ou desabilitar A02 em `.onp-uiux.json`? | respondida | `aria-label` explícito nos 11 campos, em 7 arquivos. A regra A02 continua ativa para campos futuros. Virou AC-231 e T-091 |
| Q-027 | A notificação temporária (AC-213) usa `MatSnackBar`, já instalado, ou componente próprio com `@angular/animations`? | respondida | `MatSnackBar`, com `MensagemFeedback` como conteúdo — posicionamento, fila e anúncio já resolvidos, sem criar um segundo vocabulário de comunicação. O tema do Material é sobrescrito por tokens |
| Q-028 | Quanto tempo a notificação de sucesso permanece na tela, e a de erro deve exigir dispensa manual? | respondida | Sucesso desaparece sozinho em ~5s; erro permanece até o investidor dispensar, para que a mensagem e o código (P-004) não se percam |
