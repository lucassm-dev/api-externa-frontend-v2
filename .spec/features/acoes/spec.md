# Spec: Ações

> feature: acoes
> status: rascunho

## Contexto

O catálogo de ações é a ponte entre "quero comprar PETR4" e "o sistema sabe o que é
PETR4 e quanto custa". O investidor informa **dois campos — ticker e mercado** — e o
backend consulta a fonte daquele mercado e devolve nome da empresa, moeda e cotação
com o horário em que foi obtida.

Como as corretoras, o catálogo é **compartilhado** (ADR-002): existe uma só PETR4 no
sistema inteiro, uma ação cadastrada por qualquer investidor serve a todos, e o título
da tela é "Ações", nunca "Minhas ações". Diferente das corretoras, aqui **não há selo
de uso**: marcar o que o investidor possui exigiria varrer as posições de todas as
carteiras dele, custo desproporcional e fora do v1 (PRD-006).

Três pontos concentram o risco desta feature:

1. **O pré-requisito contraintuitivo.** Cadastrar ação exige ter ao menos uma carteira
   ativa (ADR-003). Descobrir isso depois de preencher o formulário é a pior forma de
   comunicá-lo — a entrada do cadastro fica bloqueada antes, com a explicação e o
   atalho. `ACA-004` continua tratado, mas como rede de segurança.
2. **A cotação é snapshot, nunca preço ao vivo** (ADR-005). Toda cotação exibida traz o
   horário, e nenhuma requisição de cotação sai sem o investidor pedir: a fonte gratuita
   é compartilhada (cota mensal no Brasil, 800 créditos por dia nos EUA) e polling a
   queimaria em minutos.
3. **Atualizar e não ver o número mudar parece bug.** O backend reaproveita o valor
   salvo dentro dos 15 minutos sem chamar a fonte. Esse desfecho precisa de mensagem
   própria — é o que mais gera dúvida.

A exclusão é **por ticker na rota** (`DELETE /acoes/{ticker}`), diferente de corretora,
que é por id.

## Histórias

### US-036 — Cadastrar ação informando ticker e mercado

Como investidor, quero cadastrar uma ação informando apenas o ticker e o mercado, para
poder operá-la sem digitar nome de empresa nem preço que o sistema já sabe buscar.

#### AC-121 — O cadastro pede exatamente dois campos, ticker e mercado

- **Dado** um investidor com carteira ativa na tela de cadastro de ação
- **Quando** ele olha o formulário
- **Então** existem exatamente dois campos de entrada — ticker e mercado (Brasil ou Estados Unidos) — e nenhum campo de nome da empresa, moeda, cotação ou horário aparece para ele preencher

#### AC-122 — Cadastro aceito leva à ação com nome, moeda e cotação datada

- **Dado** um ticker que existe na fonte do mercado escolhido
- **Quando** o cadastro é aceito
- **Então** o investidor vê a ação recém-criada com ticker, nome da empresa, mercado, moeda e a cotação acompanhada do horário em que ela foi obtida

#### AC-123 — Envio duplicado é impossível enquanto a consulta corre

- **Dado** um cadastro já enviado e ainda sem resposta do servidor
- **Quando** o investidor aciona o botão de confirmar mais vezes
- **Então** nenhuma requisição adicional de cadastro sai, e o botão permanece indisponível até a resposta chegar

#### AC-124 — Ticker inexistente na fonte não cria registro e mantém o que foi digitado

- **Dado** um cadastro recusado com EXT-008
- **Quando** a tela trata a recusa
- **Então** a mensagem é exatamente "Não encontramos este ticker no mercado selecionado. Confira o código e o mercado.", o investidor continua no formulário com o ticker e o mercado que escolheu, e nenhuma ação é criada no estado da tela

#### AC-125 — Ticker já cadastrado leva à ação existente, não a um beco sem saída

- **Dado** um cadastro recusado com ACA-002
- **Quando** a tela trata a recusa
- **Então** a mensagem é "Este ticker já está cadastrado.", a ação existente é buscada e apresentada com ticker e nome da empresa, e o investidor recebe um caminho para abri-la

### US-037 — Não esbarrar no pré-requisito depois de preencher o formulário

Como investidor sem carteira, quero saber antes de digitar qualquer coisa que cadastrar
ação depende de ter carteira, e ter o atalho para criá-la, porque essa dependência não
é adivinhável.

#### AC-126 — Sem carteira ativa, a entrada do cadastro é bloqueada antes de qualquer formulário

- **Dado** um investidor cujo servidor informa que ele não tem nenhuma carteira
- **Quando** ele abre a entrada do cadastro de ação
- **Então** nenhum campo de ticker ou mercado é renderizado, a tela explica "Crie uma carteira antes de cadastrar ações." e oferece o atalho para a criação de carteira

#### AC-127 — Com carteira ativa, o cadastro abre normalmente

- **Dado** um investidor cujo servidor informa ao menos uma carteira
- **Quando** ele abre a entrada do cadastro de ação
- **Então** o formulário de ticker e mercado é renderizado e nenhuma mensagem de pré-requisito aparece

#### AC-128 — Estado desconhecido não inventa bloqueio nem libera às cegas

- **Dado** que a consulta que diz se o investidor tem carteira falhou
- **Quando** a tela decide o que mostrar
- **Então** ela não afirma que o investidor não tem carteira: o formulário é apresentado e o pré-requisito volta a ser decidido pelo servidor no envio (ACA-004)

#### AC-129 — ACA-004 vindo do backend continua tratado como rede de segurança

- **Dado** um cadastro enviado e recusado com ACA-004
- **Quando** a tela trata a recusa
- **Então** a mensagem é "Crie uma carteira antes de cadastrar ações.", o atalho para criar carteira é oferecido, e o investidor não é deixado só com um erro seco

### US-038 — Consultar o catálogo e buscar por ticker

Como investidor, quero listar as ações disponíveis e buscar por ticker, antes de
cadastrar uma que já existe.

#### AC-130 — A lista é do catálogo compartilhado, nunca "minhas ações"

- **Dado** um investidor na lista de ações
- **Quando** ele lê a tela
- **Então** o título é "Ações", o texto explica que o catálogo é compartilhado entre todos os investidores, e a expressão "minhas ações" não aparece em lugar nenhum (ADR-002)

#### AC-131 — Cada linha traz ticker, empresa, mercado, moeda e cotação com horário

- **Dado** uma página do catálogo com ações dos dois mercados
- **Quando** a lista é exibida
- **Então** cada linha mostra ticker, nome da empresa, mercado, moeda e a cotação, e nenhuma cotação aparece sem o horário em que foi obtida (ADR-005)

#### AC-132 — A lista é paginada e navega pelo que o servidor devolveu

- **Dado** um catálogo com mais páginas do que a exibida
- **Quando** o investidor avança de página
- **Então** a próxima página é buscada do servidor com o número pedido, e a ordem exibida é a que o servidor devolveu

#### AC-133 — Busca por ticker abre a ação; sem resultado, é estado vazio com oferta de cadastrar

- **Dado** um investidor que busca um ticker na lista
- **Quando** o ticker existe no catálogo
- **Então** a tela abre a ação encontrada; e quando não existe, a tela mostra estado vazio oferecendo cadastrar aquele ticker, sem exibir a mensagem de ACA-001

#### AC-134 — A lista não marca quais ações o investidor possui

- **Dado** um investidor que possui posição em parte das ações do catálogo
- **Quando** a lista é exibida
- **Então** nenhuma marcação de posse aparece e nenhuma requisição de posições ou de consolidado é disparada pela lista (fora do v1, PRD-006)

### US-039 — Ver a cotação e saber de quando ela é

Como investidor, quero ver o preço atual de uma ação junto do horário em que ele foi
obtido, e ser avisado quando ele estiver velho demais para decidir.

#### AC-135 — Cotação com mais de 15 minutos aparece marcada como desatualizada

- **Dado** uma ação cuja cotação foi obtida há mais de 15 minutos
- **Quando** ela é exibida em qualquer tela do catálogo
- **Então** o preço recebe a marcação visual de dado defasado, e uma cotação obtida dentro dos 15 minutos não a recebe

#### AC-136 — Nenhuma requisição de cotação parte sem o investidor pedir

- **Dado** o catálogo aberto — lista ou detalhe — e deixado na tela sem interação
- **Quando** o tempo passa
- **Então** nenhuma requisição de atualização de cotação é enviada, nem ao abrir a tela, nem em intervalo, nem ao voltar o foco (ADR-005)

### US-040 — Atualizar a cotação e entender o que aconteceu

Como investidor, quero pedir explicitamente um preço novo e saber qual dos quatro
desfechos ocorreu, porque atualizar e não ver o número mudar parece um bug.

#### AC-137 — Preço novo muda o número e o horário na tela

- **Dado** uma ação exibida com um preço e um horário
- **Quando** a atualização devolve preço diferente e horário mais recente
- **Então** a tela passa a exibir o preço novo com o horário novo, e informa que a cotação foi atualizada

#### AC-138 — Mesmo preço porque o cache ainda vale é comunicado como "continua atual"

- **Dado** uma ação exibida com um preço
- **Quando** a atualização devolve exatamente o mesmo preço e o mesmo horário, porque o cache dos 15 minutos ainda vale
- **Então** a tela informa que o preço continua atual e por quê, sem sugerir falha e sem ficar em silêncio — a mensagem é distinta da de preço novo, da de EXT-009 e da de EXT-010

#### AC-139 — Limite da fonte esgotado mantém o último preço com mensagem própria

- **Dado** uma ação exibida com preço e horário
- **Quando** a atualização falha com EXT-009
- **Então** a mensagem é "O limite de consultas da fonte foi atingido. O preço exibido é de {horário}." com o horário da cotação que está na tela, o preço anterior continua exibido, e a tela não esvazia nem quebra

#### AC-140 — Fonte indisponível mantém o último preço com mensagem distinta

- **Dado** uma ação exibida com preço e horário
- **Quando** a atualização falha com EXT-010
- **Então** a mensagem é "A fonte de cotação está indisponível. O preço exibido é de {horário}.", diferente da de EXT-009, o preço anterior continua exibido, e a tela não esvazia nem quebra

#### AC-141 — Forçar a busca só é oferecido depois de o cache ter sido reaproveitado

- **Dado** o detalhe de uma ação recém-aberto
- **Quando** o investidor olha as ações disponíveis
- **Então** não existe ação de forçar busca na fonte; ela só aparece depois de uma atualização ter devolvido o mesmo preço por cache válido, acompanhada do aviso de que consome a cota compartilhada por todos os investidores

#### AC-142 — Forçar envia o pedido explícito de ignorar o cache

- **Dado** uma atualização que devolveu o mesmo preço por cache válido
- **Quando** o investidor aciona a busca forçada
- **Então** a requisição de atualização é enviada com o pedido de ignorar o cache (`forcar=true`), e sem esse acionamento nenhuma requisição forçada sai da tela

### US-041 — Remover ação cadastrada por engano

Como investidor, quero remover do catálogo uma ação cadastrada por engano, e entender o
bloqueio quando ela estiver em uso.

#### AC-143 — A remoção pede confirmação com a consequência descrita

- **Dado** o detalhe de uma ação
- **Quando** o investidor aciona remover
- **Então** uma confirmação aparece descrevendo a consequência antes de qualquer requisição de exclusão ser enviada

#### AC-144 — A exclusão identifica a ação pelo ticker na rota

- **Dado** uma remoção confirmada
- **Quando** a requisição de exclusão é enviada
- **Então** ela usa o ticker da ação no caminho (`DELETE /acoes/{ticker}`), e não o identificador numérico

#### AC-145 — Ação com posições abertas não é removida e o motivo não expõe ninguém

- **Dado** uma remoção recusada com ACA-003
- **Quando** a tela trata o erro
- **Então** a exclusão é cancelada, a ação continua no catálogo, e a mensagem é exatamente "Esta ação tem posições abertas e não pode ser removida.", sem citar investidor, carteira, dono ou quantidade

#### AC-146 — Removida, a ação some do catálogo sem falar em lixeira ou desfazer

- **Dado** uma remoção aceita pelo servidor
- **Quando** o investidor volta ao catálogo
- **Então** a ação não aparece mais, e nenhuma menção a lixeira, desfazer ou registro inativo é exibida (ADR-007)

#### AC-147 — Ação inexistente devolve o investidor ao catálogo

- **Dado** um investidor que abre pela URL o detalhe de um ticker que não existe no catálogo
- **Quando** o servidor responde ACA-001 ou não encontra a ação
- **Então** a mensagem é "Ação não encontrada." e o investidor é levado de volta à lista

## Fora de escopo

- Gráfico de histórico de preço, dados fundamentalistas e notícias do ativo
- Favoritos e alertas de preço
- Edição do cadastro da ação — os dados vêm de fonte externa
- Atualização automática de cotação (polling, refresh ao abrir, intervalo)
- Destaque das ações que o investidor possui — exigiria varrer as posições de todas as
  carteiras dele (PRD-006)
- Telas de operação (compra e venda) e de desempenho

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-031 | `GET /carteiras?page=0&size=1` devolve só as carteiras ativas do investidor logado, e `totalElements > 0` basta para saber que ele tem carteira | aberta | — |
| ASM-032 | O corpo do erro ACA-002 não traz o identificador da ação existente; a tela a obtém consultando `GET /acoes/ticker/{ticker}` logo depois da recusa (mesmo padrão de COR-002 em corretoras) | aberta | — |
| ASM-033 | `GET /acoes/ticker/{ticker}` aceita o ticker em caixa alta e sem espaços; a tela normaliza antes de consultar e de cadastrar | aberta | — |
| ASM-034 | `PUT /acoes/{id}/atualizar-cotacao` devolve a ação inteira, com `cotacaoAtual` e `dataHoraCotacao` — é a comparação com os valores anteriores que distingue "preço novo" de "cache ainda válido" | aberta | — |
| ASM-035 | EXT-009 e EXT-010 chegam à atualização de cotação no contrato de erro padrão (resposta de erro), e não como corpo de sucesso com aviso — na compra e na venda eles chegam como aviso, mas ali a operação aconteceu (PRD-009) | aberta | — |
| ASM-036 | `DELETE /acoes/{ticker}` responde sem corpo quando aceita, e ACA-003 chega no contrato de erro padrão | aberta | — |
| ASM-037 | `dataHoraCotacao` chega como instante ISO, formatável pelo utilitário de hora da fundação, e a moeda da ação é `BRL` ou `USD` conforme o mercado | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-016 | Como expor `?forcar=true`, sabendo que cada chamada forçada consome a cota de todos os investidores? | respondida | Só depois de uma atualização devolver o mesmo preço por cache válido. É o único momento em que o investidor tem motivo para forçar; oferecê-la sempre convida o clique sem razão e queima a cota compartilhada (AC-141, AC-142) |
| Q-017 | O catálogo de ações terá tela de detalhe, como corretoras, ou só lista e cadastro? | respondida | Lista, cadastro e detalhe (`/acoes/{ticker}`). O detalhe concentra a cotação com horário, a atualização com os quatro desfechos e a exclusão — que na tabela disputariam espaço |
| Q-018 | O que "oferecer usá-la" significa na recusa ACA-002, sem as telas de operação construídas? | respondida | Cartão com a ação existente (ticker e nome da empresa) e atalho que abre o detalhe dela. Sem link para registrar compra enquanto o PRD-007 não existir |
