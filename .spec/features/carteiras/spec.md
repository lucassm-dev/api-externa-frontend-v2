# Spec: Carteiras

> feature: carteiras
> status: pronta

## Contexto

A carteira é a unidade central do produto: é onde as posições existem, onde o resultado é
medido e o que o investidor abre para trabalhar (PRD-005). Esta feature entrega as quatro
telas — criar, listar, abrir e renomear/excluir — sobre a fundação que já existe: tradutor
de erro por código, feedback em três níveis, formatação em real, marcação de dado defasado,
diálogo de confirmação e a casca autenticada.

Três pontos concentram o risco:

1. **A carteira é multimercado (ADR-004).** O campo de mercado é moeda de referência, não
   restrição, e nenhuma tela pode dizer o contrário. Todo total sai em real, com a taxa de
   câmbio e o horário dela à vista.
2. **A seção "Encerradas" é derivada, não vem pronta do backend.** Vender tudo apaga a
   posição; o registro do ativo só sobrevive em `lucro-realizado.porTicker`. Cruzar essa
   lista com os tickers que ainda têm posição aberta é o que devolve ao investidor o ativo
   que ele acha que sumiu.
3. **O extrato não aceita filtro por carteira (ADR-010).** `GET /operacoes` é global. O
   recorte é feito no cliente sobre uma página larga, e quando o extrato for maior do que o
   que foi buscado a tela diz isso — um recorte parcial apresentado como completo faz o
   investidor concluir que o sistema perdeu um lançamento.

## Histórias

### US-028 — Criar carteira

Como investidor, quero criar uma carteira dando um nome e escolhendo a corretora, para
começar a registrar operações.

#### AC-091 — O formulário pede nome, corretora e mercado

- **Dado** um investidor na tela de criação de carteira, com corretoras no catálogo
- **Quando** ele olha o formulário
- **Então** existem exatamente três entradas — nome, corretora escolhida entre as do catálogo e mercado de referência — e nenhum outro dado da carteira é pedido

#### AC-092 — Sem corretora no catálogo, a criação conduz ao cadastro de corretora

- **Dado** um catálogo de corretoras vazio
- **Quando** o investidor abre a criação de carteira
- **Então** nenhum seletor de corretora vazio é exibido, a tela explica que é preciso uma corretora antes e oferece o caminho para cadastrá-la, de onde ele volta à criação

#### AC-093 — Nenhum mercado é escolhido escondido pelo frontend

- **Dado** um investidor que ainda não escolheu o mercado
- **Quando** ele tenta criar a carteira
- **Então** nenhuma requisição de criação sai, a tela pede a escolha, e a criação enviada depois carrega exatamente o mercado que ele selecionou — nunca um valor fixo embutido na tela

#### AC-094 — Carteira criada abre no detalhe dela

- **Dado** um formulário preenchido com nome, corretora e mercado
- **Quando** o servidor aceita a criação
- **Então** o investidor é levado ao detalhe da carteira recém-criada, identificada pelo identificador que o servidor devolveu

#### AC-095 — A tela nunca afirma que a carteira aceita só um mercado

- **Dado** um investidor no formulário de criação
- **Quando** ele lê o rótulo e o texto de apoio do campo de mercado
- **Então** o campo é apresentado como moeda de referência, o texto diz que a carteira aceita ações dos dois mercados, e em nenhum lugar a tela restringe a carteira a um único mercado (ADR-004)

### US-029 — Ver minhas carteiras

Como investidor, quero ver todas as minhas carteiras com o valor e o resultado de cada uma,
para escolher qual abrir.

#### AC-096 — Cada carteira aparece com nome, corretora, mercado e os números dela

- **Dado** uma página de carteiras respondida pelo servidor
- **Quando** a lista termina de carregar
- **Então** cada linha mostra o nome, a corretora, o mercado e os números da carteira — valor de mercado, resultado não realizado e resultado realizado

#### AC-097 — A lista é paginada, da mais recente para a mais antiga

- **Dado** um investidor com mais carteiras do que cabe numa página
- **Quando** a lista carrega e ele avança de página
- **Então** a leitura pede a página ao servidor ordenada do identificador maior para o menor, e a tela exibe as carteiras na ordem devolvida

#### AC-098 — Cada linha oferece abrir, renomear e excluir

- **Dado** uma lista de carteiras carregada
- **Quando** o investidor olha uma linha
- **Então** ela oferece as três ações rápidas — abrir, renomear e excluir — sem exigir entrar no detalhe para chegar a elas

#### AC-099 — A tela nunca sugere que existem carteiras de outros investidores

- **Dado** a lista de carteiras carregada
- **Quando** o investidor lê os textos da tela
- **Então** nada afirma ou insinua a existência de carteiras de outros investidores, e a tela não oferece busca, filtro ou aba por investidor

#### AC-100 — Número que falha some da linha sem derrubar a lista

- **Dado** uma lista em que a leitura dos números de uma das carteiras falha
- **Quando** a tela termina de carregar
- **Então** todas as carteiras continuam listadas, a linha afetada aparece sem os números, e nenhum erro é apresentado ao investidor (ADR-006)

### US-030 — Abrir uma carteira

Como investidor, quero abrir uma carteira e ver seus totais, posições e movimentações num
lugar só, para trabalhar sem navegar entre telas.

#### AC-101 — O cabeçalho traz identificação e os quatro totais

- **Dado** uma carteira aberta no detalhe
- **Quando** os totais chegam
- **Então** o cabeçalho mostra nome, corretora, mercado, o valor investido, o valor de mercado, o resultado não realizado e o resultado realizado

#### AC-102 — Os totais aparecem em real, com a taxa de câmbio e o horário dela

- **Dado** um consolidado com taxa de câmbio e horário
- **Quando** o cabeçalho é exibido
- **Então** os totais estão em real e a taxa de câmbio usada aparece junto do horário em que foi obtida (ADR-004)

#### AC-103 — Resultado realizado e não realizado nunca são somados

- **Dado** uma carteira com resultado realizado e resultado não realizado
- **Quando** a tela exibe os totais
- **Então** os dois aparecem como números separados e rotulados, e nenhum número da tela corresponde à soma dos dois

#### AC-104 — Aviso do consolidado é aviso, não erro

- **Dado** um consolidado que chegou com avisos (câmbio ou cotação em cache)
- **Quando** a tela exibe os totais
- **Então** os totais continuam visíveis e cada aviso é apresentado no nível de aviso, sem bloquear a tela (ADR-006)

#### AC-105 — A tela oferece registrar compra e registrar venda para esta carteira

- **Dado** uma carteira aberta
- **Quando** o investidor procura as ações da tela
- **Então** existem os atalhos de registrar compra e registrar venda, ambos levando à área de operações já identificando esta carteira

### US-031 — Ver as posições abertas

Como investidor, quero ver cada ativo que tenho na carteira com preço médio, cotação e
resultado, para saber onde estou ganhando e perdendo.

#### AC-106 — Cada posição traz ticker, empresa, quantidade, preço médio e cotação com horário

- **Dado** uma carteira com posições abertas
- **Quando** a seção de posições é exibida
- **Então** cada linha mostra o ticker, o nome da empresa, a quantidade, o preço médio e a cotação atual acompanhada do horário em que ela foi obtida

#### AC-107 — A rentabilidade não realizada aparece em valor e em percentual

- **Dado** uma posição de 100 unidades com preço médio de 10,00 e rentabilidade não realizada de 250,00
- **Quando** a linha é exibida
- **Então** aparecem o valor 250,00 e o percentual 25,00% sobre o custo da posição, com o sinal indicando ganho ou perda sem depender só de cor

#### AC-108 — Cotação com mais de 15 minutos aparece marcada

- **Dado** duas posições, uma com cotação obtida há 2 minutos e outra há 40 minutos
- **Quando** a seção é exibida
- **Então** somente a de 40 minutos recebe a marcação de dado defasado da fundação, e a de 2 minutos não recebe marcação alguma

### US-032 — Reencontrar um ativo que zerei

Como investidor que vendeu tudo de um ativo, quero continuar vendo o que ganhei nele, para
não concluir que o sistema perdeu meu registro.

#### AC-109 — A seção "Encerradas" lista exatamente os tickers com resultado realizado e sem posição aberta

- **Dado** um resultado realizado com PETR4, VALE3 e MGLU3, e posições abertas apenas em PETR4
- **Quando** a tela da carteira é exibida
- **Então** a seção "Encerradas" lista VALE3 e MGLU3, e não lista PETR4

#### AC-110 — Sem ativo encerrado, a seção não aparece

- **Dado** uma carteira em que todo ticker com resultado realizado ainda tem posição aberta
- **Quando** a tela é exibida
- **Então** nenhuma seção de encerradas aparece — nem vazia, nem com texto de "nada aqui"

#### AC-111 — A seção mostra ticker e resultado realizado, e nada de posição

- **Dado** um ativo encerrado com resultado realizado
- **Quando** a linha dele é exibida
- **Então** ela mostra o ticker e o resultado realizado, e não mostra preço médio, quantidade nem cotação, porque a posição não existe mais

### US-033 — Ver as movimentações desta carteira

Como investidor, quero ver as compras e vendas desta carteira, sabendo se estou vendo tudo,
para não procurar em vão por um lançamento que existe.

#### AC-112 — A seção mostra apenas as operações desta carteira

- **Dado** um extrato do investidor com operações de várias carteiras
- **Quando** a seção de movimentações da carteira é exibida
- **Então** somente as operações cuja carteira é a que está aberta aparecem

#### AC-113 — Extrato maior do que o buscado é declarado como recorte parcial

- **Dado** um extrato cujo total de operações do investidor é maior do que a quantidade que a tela buscou
- **Quando** a seção é exibida
- **Então** a tela informa que está mostrando apenas as mais recentes e diz quantas foram buscadas, junto do caminho para o extrato completo

#### AC-114 — Extrato que coube inteiro não recebe aviso de recorte

- **Dado** um extrato cujo total de operações é menor ou igual ao que a tela buscou
- **Quando** a seção é exibida
- **Então** nenhum aviso de recorte parcial é apresentado

### US-034 — Renomear a carteira

Como investidor, quero renomear uma carteira sem perder nada dela.

#### AC-115 — A edição alcança só o nome

- **Dado** um investidor que acionou renomear
- **Quando** o formulário abre
- **Então** o único campo editável é o nome, e corretora e mercado não são oferecidos para edição

#### AC-116 — Renomear preserva os demais dados na tela

- **Dado** uma carteira aberta com totais, posições e movimentações carregados
- **Quando** o novo nome é aceito pelo servidor
- **Então** o nome exibido muda, e totais, posições, seção de encerradas e movimentações continuam exibindo exatamente os mesmos dados

### US-035 — Excluir uma carteira

Como investidor, quero excluir uma carteira que não uso mais, sabendo antes o que vai
acontecer e por que às vezes não dá.

#### AC-117 — A exclusão pede confirmação simples com a consequência descrita

- **Dado** um investidor que acionou excluir uma carteira
- **Quando** o diálogo abre
- **Então** ele descreve a consequência da exclusão e oferece exatamente dois botões — confirmar e cancelar — sem exigir digitar o nome da carteira

#### AC-118 — Carteira com posição aberta não é excluída, e a mensagem diz o que fazer

- **Dado** uma exclusão recusada com CAR-002
- **Quando** a tela trata o erro
- **Então** a exclusão é cancelada, a carteira continua existindo na tela, e a mensagem é exatamente "Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la."

#### AC-119 — Exclusão aceita faz a carteira sumir, sem lixeira e sem desfazer

- **Dado** uma exclusão confirmada e aceita pelo servidor
- **Quando** o investidor volta à lista
- **Então** a carteira não aparece mais, e nenhuma menção a lixeira, desfazer ou registro inativo é exibida (ADR-007)

#### AC-120 — CAR-001 nunca revela que a carteira é de outro investidor

- **Dado** qualquer ação da feature recusada com CAR-001 — abrir, renomear ou excluir
- **Quando** a tela trata o erro
- **Então** a mensagem é exatamente "Carteira não encontrada.", o investidor volta à lista de carteiras, e nenhum texto da feature cita outro investidor, dono, permissão ou carteira inativa

## Fora de escopo

- Registrar compra e venda — telas do PRD-007, prompt 7; aqui só os atalhos
- Gráficos de desempenho — PRD-008, prompt 8
- Filtro do extrato por carteira no servidor — v2, depende do backend (ADR-010)
- Mover operação entre carteiras, duplicar, arquivar, compartilhar, meta de alocação
- Remover o campo de mercado da criação — v2, junto da mudança no backend (PRD-005)
- Edição de qualquer campo da carteira além do nome

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-023 | O mercado trafega como `BR` e `US`, como o painel já consome em `GET /carteiras`, e o `POST /carteiras` aceita os mesmos valores | aberta | — |
| ASM-024 | `POST /carteiras` devolve a carteira criada com o identificador, permitindo abrir o detalhe dela sem nova listagem | aberta | — |
| ASM-025 | Os valores de `GET /carteiras/{id}/posicoes` e de `lucro-realizado` chegam em real, como o consolidado (ADR-004); as respostas não trazem moeda por linha | aberta | — |
| ASM-026 | `lucro-realizado.porTicker` acumula o realizado por ticker da carteira, inclusive de ativos que ainda têm posição aberta — por isso o cruzamento com as posições abertas é necessário para achar os encerrados | aberta | — |
| ASM-027 | Cada item de `GET /operacoes` traz `carteiraId`, e o envelope traz `totalElements` com o total de operações do investidor | aberta | — |
| ASM-028 | `PATCH /carteiras/{id}` com `{ nome }` devolve a carteira atualizada e não altera nenhum outro campo | aberta | — |
| ASM-029 | `DELETE /carteiras/{id}` responde sem corpo quando aceita, e CAR-002 chega no contrato de erro padrão | aberta | — |
| ASM-030 | Os `avisos` do consolidado chegam como texto pronto para exibição, como o painel já assume | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-012 | Que tamanho de página usar no extrato para montar as movimentações da carteira, já que o servidor não filtra? | respondida | 200 — mesma largura já usada para varrer carteiras no selo de corretoras (Q-011): cobre o histórico inteiro do investidor típico deste produto numa única requisição, e acima disso a tela declara o recorte em vez de mentir |
| Q-013 | A listagem de carteiras não devolve valor nem resultado; de onde vêm os números da lista? | respondida | Uma leitura de consolidado e uma de lucro realizado por carteira exibida, independentes entre si; falha individual deixa a linha sem número e nunca derruba a lista (ADR-006, AC-100) |
| Q-014 | Para onde apontam os atalhos de compra e venda enquanto as telas de operação não existem? | respondida | Para a área de operações, levando a carteira nos parâmetros da rota; o prompt 7 substitui o destino sem mexer nesta tela |
| Q-015 | Não existe `GET /carteiras/{id}`; de onde o detalhe tira nome, corretora e mercado? | respondida | Da própria listagem: `GET /carteiras` com página larga, percorrida até achar o identificador. Não achar é tratado como CAR-001 — "Carteira não encontrada." e volta à lista. Nenhum endpoint foi inventado (decisão do dono do produto, 09/09/2026) |
