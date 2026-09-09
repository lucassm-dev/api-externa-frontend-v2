# Spec: Painel

> feature: painel
> status: pronta

## Contexto

A moldura da área autenticada — barra superior com as áreas do produto, tema e sair —
e a primeira tela que o investidor vê depois de entrar. O painel responde a duas
perguntas em cinco segundos: como está uma carteira minha, e o que eu faço agora.
Quem não tem dado nenhum não vê zeros: vê **um** próximo passo, na ordem que o
domínio obriga (ADR-003). Tudo o que traduz erro, comunica nos três níveis, marca
dado defasado, formata moeda e guarda a sessão já existe na fundação e no acesso;
aqui só se consome.

## Histórias

### US-017 — Circular pelo produto sem perder a saída

Como investidor logado, quero uma barra superior com as áreas do produto, a troca de
tema e o botão de sair sempre à vista, para navegar sem procurar e para encerrar a
sessão em máquina compartilhada com um clique.

#### AC-047 — As seis áreas do produto ficam na barra superior

- **Dado** um investidor com sessão válida em qualquer tela da área autenticada
- **Quando** ele olha a barra superior
- **Então** encontra os atalhos de painel, corretoras, carteiras, ações, operações e desempenho, e a área em que está aparece marcada

#### AC-048 — Sair nunca fica escondido

- **Dado** um investidor com sessão válida
- **Quando** ele olha a barra superior
- **Então** o botão de sair está visível na própria barra, sem depender de abrir menu ou submenu (ADR-001)

#### AC-049 — O tema escolhido sobrevive à visita

- **Dado** um investidor no tema claro
- **Quando** ele aciona a alternância de tema na barra superior
- **Então** o produto passa para o tema escuro e a escolha continua valendo quando ele volta

### US-018 — Ver o mercado antes de olhar a carteira

Como investidor, quero ver preço e variação de alguns papéis de referência assim que
entro, para me situar antes de olhar o que é meu.

#### AC-050 — Cada item traz símbolo, preço, variação e o horário do dado

- **Dado** a barra de mercado respondida com itens e um `atualizadoEm`
- **Quando** o painel a exibe
- **Então** cada item mostra símbolo, preço e variação percentual, e o horário de `atualizadoEm` aparece na barra

#### AC-051 — Barra de mercado fora do ar não derruba o painel

- **Dado** que a chamada da barra de mercado falha
- **Quando** o painel carrega
- **Então** a barra some ou aparece vazia e todos os outros blocos do painel continuam na tela

#### AC-052 — O que faltou na barra vira aviso, nunca erro

- **Dado** uma barra de mercado respondida com `avisos` preenchidos
- **Quando** o painel a exibe
- **Então** os avisos aparecem no nível aviso, discretos e sem bloquear, e nada é apresentado como erro (ADR-006)

### US-019 — Ver o retrato de uma carteira

Como investidor, quero ver quanto investi, quanto vale hoje e qual o resultado de uma
carteira escolhida, sempre em real e com a taxa de câmbio à vista.

#### AC-053 — O consolidado é de uma carteira só, em real, com a taxa visível

- **Dado** um investidor com mais de uma carteira e a carteira escolhida no seletor
- **Quando** o painel exibe o consolidado
- **Então** ele pede o consolidado só da carteira escolhida, mostra valor investido, valor de mercado e resultado não realizado em real, com `taxaCambioAtual` e `dataHoraTaxaCambio` junto do número, e nenhum total somado de várias carteiras aparece na tela (ADR-004)

#### AC-054 — A carteira escolhida é lembrada entre visitas

- **Dado** um investidor que escolheu uma carteira no seletor do consolidado
- **Quando** ele volta ao painel numa visita seguinte
- **Então** o consolidado abre já na mesma carteira, sem ele escolher de novo

#### AC-055 — Câmbio indisponível é aviso, não erro

- **Dado** um consolidado respondido com `avisos` sobre a taxa de câmbio
- **Quando** o painel o exibe
- **Então** os números aparecem com a última taxa conhecida e o horário dela, os avisos saem no nível aviso, e o bloco não é substituído por mensagem de erro (ADR-006)

#### AC-056 — Taxa velha ganha marcação

- **Dado** um consolidado cuja `dataHoraTaxaCambio` tem mais de quinze minutos
- **Quando** o painel o exibe
- **Então** a taxa aparece com a marcação de dado defasado que a fundação já constrói (ADR-005)

### US-020 — Entrar direto numa carteira

Como investidor com várias carteiras, quero ver cada uma resumida e abrir a que me
interessa em um clique.

#### AC-057 — As carteiras chegam da mais recente para a mais antiga

- **Dado** um investidor com carteiras cadastradas
- **Quando** o painel busca a lista
- **Então** ele a pede ao servidor ordenada por identificador decrescente e exibe os cartões nessa ordem, a mais recente primeiro

#### AC-058 — Cada cartão mostra nome e corretora e abre a carteira

- **Dado** a lista de carteiras exibida em cartões
- **Quando** o investidor aciona um cartão
- **Então** o cartão mostrou nome e corretora da carteira e o atalho leva à tela daquela carteira

### US-021 — Ver as últimas movimentações

Como investidor, quero ver minhas movimentações mais recentes no painel, com um
caminho para o extrato completo.

#### AC-059 — No máximo cinco movimentações, com atalho para o extrato

- **Dado** um investidor com mais de cinco operações registradas
- **Quando** o painel exibe o bloco de movimentações
- **Então** ele pede cinco ao servidor, exibe no máximo cinco linhas e oferece o atalho para o extrato completo

### US-022 — Ser conduzido quando ainda não há o que ver

Como investidor recém-cadastrado, quero que o painel me diga qual é o único próximo
passo, em vez de me mostrar tabelas vazias.

#### AC-060 — Catálogo de corretoras vazio pede o cadastro de corretora

- **Dado** um catálogo de corretoras sem nenhuma corretora
- **Quando** o painel decide o próximo passo
- **Então** ele mostra apenas o convite a cadastrar uma corretora, com o atalho para essa tela (ADR-003)

#### AC-061 — Com corretora no catálogo e sem carteira, o passo é criar carteira

- **Dado** um catálogo com pelo menos uma corretora e um investidor sem nenhuma carteira
- **Quando** o painel decide o próximo passo
- **Então** ele mostra apenas o convite a criar a primeira carteira

#### AC-062 — Com carteira e sem operação, o passo é registrar a primeira compra

- **Dado** um investidor com pelo menos uma carteira e nenhuma operação
- **Quando** o painel decide o próximo passo
- **Então** ele mostra apenas o convite a registrar a primeira compra

#### AC-063 — Com corretora, carteira e operação não há próximo passo

- **Dado** um investidor com carteira e ao menos uma operação, num catálogo com corretora
- **Quando** o painel decide o próximo passo
- **Então** nenhum convite é exibido e os blocos de consolidado, carteiras e movimentações aparecem

#### AC-064 — O próximo passo ocupa o corpo da tela e nunca vira lista

- **Dado** um estado em que existe um próximo passo
- **Quando** o painel é exibido
- **Então** exatamente um convite aparece no lugar dos blocos de consolidado, carteiras e movimentações, e a barra de mercado continua na tela

#### AC-065 — Carregando é esqueleto, não spinner de tela inteira

- **Dado** o painel recém-aberto, com as chamadas ainda em curso
- **Quando** o investidor olha a tela
- **Então** ele vê o esqueleto dos blocos no lugar deles, e nenhum indicador cobrindo a tela inteira

## Fora de escopo

- Cadastro de corretora, criação de carteira e registro de operação: o painel só aponta o caminho
- As telas das áreas de corretoras, carteiras, ações, operações e desempenho — aqui só existem rotas mínimas
- Valor de mercado e resultado dentro do cartão de cada carteira (ver Q-007)
- Personalização de blocos, notícias, alertas de preço, comparação com benchmark
- Responsividade para celular e menu compacto (PRD-001: desktop apenas)

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-011 | "Investidor sem corretora" do PRD-003 é, na verdade, catálogo de corretoras vazio: corretora é catálogo compartilhado e não pertence ao investidor (ADR-002). A verificação usa `GET /corretoras?page=0&size=1`. | confirmada | Decidido pelo dono do produto no pedido do passo 3; o PRD-003 será ajustado |
| ASM-012 | O cartão de carteira do v1 traz nome, corretora e atalho, sem valor de mercado nem resultado: `GET /carteiras` não devolve esses números e consolidar carteira por carteira seria uma chamada por cartão. | confirmada | Decidido pelo dono do produto no pedido do passo 3 (ver Q-007) |
| ASM-013 | Os campos de `OperacaoResponseDTO` seguem o extrato do PRD-007 (data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total, moeda). O bloco de movimentações lê o que vier e omite o que faltar, sem quebrar. | aberta | Confirmar contra o contrato do backend ao construir a tela de operações (PRD-007) |
| ASM-014 | O painel busca até cinquenta carteiras na primeira página e não pagina: quem tiver mais que isso enxerga as mais recentes, que é a ordem do bloco. | aberta | Rever se aparecer investidor com muitas carteiras |
| ASM-015 | Corretoras, carteiras e operações são consultadas em paralelo ao abrir o painel; o consolidado só é pedido quando existe carteira e nenhum próximo passo está ativo. | aberta | Rever se o backend passar a oferecer um resumo de estado do investidor numa chamada só |
| ASM-016 | Falha em corretoras, carteiras ou operações degrada o bloco correspondente e não impede os outros; sem saber o estado, o painel não inventa próximo passo. | aberta | Confirmar com o dono do produto se um painel parcialmente carregado deve ou não sugerir passo |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-007 | O PRD-003 pede valor de mercado e resultado em cada cartão de carteira, mas o backend não devolve isso na listagem. Exibir mesmo assim, ao custo de uma chamada de consolidado por carteira? | respondida | Não no v1: o cartão traz nome, corretora e atalho (pedido do passo 3) |
| Q-008 | As rotas das áreas de corretoras, carteiras, ações, operações e desempenho existem como destinos mínimos. Os endereços definidos aqui (`/corretoras`, `/carteiras`, `/acoes`, `/operacoes`, `/desempenho`) ficam valendo para as features seguintes? | aberta | — |
