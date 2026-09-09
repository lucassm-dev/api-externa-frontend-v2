# Spec: Corretoras

> feature: corretoras
> status: pronta

## Contexto

Toda carteira pertence a uma corretora, e o produto só aceita corretora de verdade e
autorizada a operar. O investidor informa **um campo só — o CNPJ** — e o backend
consulta Receita, ViaCEP e a base da CVM antes de responder; é lento e pode ser
recusado por quatro motivos diferentes. O catálogo é **compartilhado**: o investidor
vê o que qualquer um cadastrou, usa qualquer uma nas carteiras dele e pode remover
qualquer uma (ADR-002). Tudo o que traduz erro, comunica nos três níveis, formata e
guarda a sessão já existe na fundação; aqui só se consome.

O ponto mais delicado da feature é a diferença entre **COR-003** (a corretora foi
reprovada, e o motivo específico veio do servidor) e **EXT-007** (não deu para
verificar). Confundir os dois acusa uma empresa real de irregularidade porque uma
base pública estava fora do ar.

## Histórias

### US-023 — Cadastrar corretora informando só o CNPJ

Como investidor, quero informar apenas o CNPJ e ter razão social, endereço e validação
preenchidos pelo sistema, para não digitar dado que já existe em fonte pública.

#### AC-066 — O cadastro pede exatamente um campo, o CNPJ

- **Dado** um investidor na tela de cadastro de corretora
- **Quando** ele olha o formulário
- **Então** existe um único campo de entrada, o CNPJ, e nenhum campo de razão social, nome fantasia, endereço, e-mail ou telefone aparece na tela

#### AC-067 — CNPJ com máscara ou em dígitos puros é aceito do mesmo jeito

- **Dado** um investidor que digitou `02.332.886/0001-04` ou `02332886000104`
- **Quando** ele confirma o cadastro
- **Então** o sistema envia o cadastro nos dois casos, sem recusar o formato antes do envio

#### AC-068 — Durante a consulta às fontes externas a tela diz o que está acontecendo

- **Dado** um cadastro enviado e ainda sem resposta do servidor
- **Quando** o investidor olha a tela
- **Então** ela informa em texto que está consultando as fontes externas — Receita, endereço e CVM — em vez de apenas desabilitar o botão

#### AC-069 — Envio duplicado é impossível enquanto a consulta corre

- **Dado** um cadastro já enviado e ainda sem resposta
- **Quando** o investidor aciona o botão de confirmar mais vezes
- **Então** nenhuma requisição adicional de cadastro sai, e o botão permanece indisponível até a resposta chegar

#### AC-070 — Cadastro aceito leva à corretora completa e validada

- **Dado** um CNPJ de corretora autorizada
- **Quando** o cadastro é aceito
- **Então** o investidor vê a corretora recém-criada com os dados vindos das fontes públicas, a marca de validação na CVM e a data da base oficial usada

### US-024 — Entender por que uma corretora foi recusada

Como investidor que teve o cadastro negado, quero saber o motivo exato — e se o sistema
sequer conseguiu verificar — porque "não autorizada" e "não deu para checar" são coisas
diferentes e só uma delas é sobre a empresa.

#### AC-071 — A recusa reproduz o motivo específico que o servidor informou

- **Dado** um cadastro recusado com COR-003 e a mensagem do servidor descrevendo o motivo (CNPJ inválido, não encontrado na Receita, CEP inexistente ou empresa não autorizada na CVM)
- **Quando** a tela exibe a recusa
- **Então** o texto do motivo informado pelo servidor aparece para o investidor, e não uma mensagem única que resume os quatro casos

#### AC-072 — Recusa e falha de verificação são mensagens inconfundíveis

- **Dado** dois cadastros, um recusado com COR-003 e outro que falhou com EXT-007
- **Quando** a tela exibe cada um
- **Então** as mensagens são diferentes entre si, a de EXT-007 é exatamente "Não conseguimos verificar esta corretora agora. Tente novamente em instantes.", e ela não afirma que a empresa é irregular nem que não é autorizada

#### AC-073 — Falha ou recusa preserva o CNPJ digitado no campo

- **Dado** um cadastro recusado com COR-003 ou falho com EXT-007
- **Quando** a tela mostra a mensagem
- **Então** o investidor continua no formulário com o CNPJ que digitou ainda no campo, e o campo aparece destacado

#### AC-074 — Cadastro recusado não deixa registro parcial

- **Dado** um cadastro recusado com COR-003 ou EXT-007
- **Quando** o investidor volta à lista de corretoras
- **Então** nenhuma corretora com aquele CNPJ aparece, em nenhum estado intermediário ou "pendente de validação"

#### AC-075 — CNPJ já cadastrado leva à corretora existente

- **Dado** um cadastro recusado com COR-002 porque o CNPJ já está no catálogo
- **Quando** a tela mostra a mensagem
- **Então** ela apresenta a corretora existente com razão social, CNPJ e cidade/UF e oferece um atalho que abre o detalhe dela, em vez de terminar num erro sem saída (Q-009)

### US-025 — Ver as corretoras do catálogo

Como investidor, quero listar e buscar as corretoras já cadastradas, para não recadastrar
uma que já existe e para reconhecer as que eu uso.

#### AC-076 — A lista é do catálogo compartilhado, não "minhas corretoras"

- **Dado** um investidor na lista de corretoras
- **Quando** ele lê o título e o texto da tela
- **Então** o título é "Corretoras", em nenhum lugar aparece "Minhas corretoras", e a tela explica que o catálogo é compartilhado entre os investidores (ADR-002)

#### AC-077 — Cada linha traz nome, CNPJ, cidade/UF e a situação de validação

- **Dado** uma página de corretoras respondida pelo servidor
- **Quando** a lista é exibida
- **Então** cada linha mostra a razão social ou o nome fantasia, o CNPJ, a cidade com a UF e se a corretora está validada na CVM

#### AC-078 — A lista é paginada

- **Dado** um catálogo com mais corretoras do que cabe numa página
- **Quando** o investidor avança para a página seguinte
- **Então** a tela pede a próxima página ao servidor e exibe as corretoras dela, sem carregar o catálogo inteiro de uma vez

#### AC-079 — Buscar por CNPJ leva direto ao registro

- **Dado** um investidor que digitou na busca o CNPJ de uma corretora cadastrada
- **Quando** ele confirma a busca
- **Então** a tela abre o detalhe daquela corretora

#### AC-080 — Busca sem resultado é estado vazio, não erro

- **Dado** uma busca por um CNPJ que não está no catálogo
- **Quando** a tela recebe a resposta
- **Então** ela permanece na lista, informa que nenhuma corretora tem aquele CNPJ e oferece cadastrá-lo, sem apresentar a mensagem de erro de corretora não encontrada (Q-010)

#### AC-081 — O selo conta quantas carteiras do investidor usam a corretora

- **Dado** um investidor com duas carteiras na corretora A, uma na corretora B e nenhuma na corretora C
- **Quando** a lista é exibida
- **Então** a corretora A recebe o selo "2 carteiras suas", a B recebe "1 carteira sua" e a C não recebe selo nenhum

#### AC-082 — O selo não muda a ordem da lista

- **Dado** uma página de corretoras em que só a última tem carteiras do investidor
- **Quando** a lista é exibida
- **Então** a ordem das corretoras é exatamente a que o servidor devolveu

#### AC-083 — Falha ao contar carteiras não derruba a lista

- **Dado** que a leitura das carteiras do investidor falha
- **Quando** a lista de corretoras carrega
- **Então** as corretoras aparecem normalmente, apenas sem selo algum, e nenhum erro é apresentado ao investidor (ADR-006)

### US-026 — Ver os dados completos de uma corretora

Como investidor, quero abrir uma corretora e ver os dados cadastrais, o endereço e desde
que data é a base oficial usada na verificação, para julgar se a validação está atual.

#### AC-084 — O detalhe traz os dados cadastrais e o endereço completo

- **Dado** uma corretora aberta no detalhe
- **Quando** o investidor lê a tela
- **Então** ela mostra razão social, nome fantasia, CNPJ, situação cadastral, e-mail, telefone e o endereço completo com CEP, logradouro, número, complemento, bairro, cidade e UF

#### AC-085 — O detalhe mostra a validação na CVM e a data da base oficial

- **Dado** uma corretora validada na CVM com `dataBaseCvm` preenchida
- **Quando** o detalhe é exibido
- **Então** a marca de validação aparece junto da data da base oficial usada na verificação, formatada para leitura

#### AC-086 — Corretora inexistente devolve o investidor à lista

- **Dado** um investidor que abre o detalhe de uma corretora que não existe mais e recebe COR-001
- **Quando** a tela trata o erro
- **Então** o investidor é levado de volta à lista de corretoras com a mensagem "Corretora não encontrada."

### US-027 — Remover uma corretora do catálogo

Como investidor, quero remover uma corretora cadastrada por engano, sabendo antes o que
vai acontecer e por que às vezes não dá.

#### AC-087 — A exclusão pede confirmação simples com a consequência descrita

- **Dado** um investidor que acionou remover uma corretora
- **Quando** o diálogo abre
- **Então** ele descreve a consequência da remoção, oferece exatamente dois botões — confirmar e cancelar — e não exige digitar o nome da corretora (PRD-009)

#### AC-088 — Confirmar remove a corretora da lista

- **Dado** o diálogo de remoção confirmado e o servidor aceitando a exclusão
- **Quando** a tela volta à lista
- **Então** a corretora não aparece mais, e nenhuma menção a lixeira, desfazer ou registro inativo é exibida (ADR-007)

#### AC-089 — Corretora com carteiras vinculadas não é removida e o motivo não expõe ninguém

- **Dado** uma remoção recusada com COR-004
- **Quando** a tela trata o erro
- **Então** a exclusão é cancelada, a corretora continua na lista, e a mensagem é exatamente "Esta corretora tem carteiras vinculadas e não pode ser removida.", sem citar investidor, dono, nome ou quantidade de carteiras

#### AC-090 — Qualquer investidor pode remover qualquer corretora

- **Dado** uma corretora cadastrada por outro investidor
- **Quando** o investidor olha o detalhe dela
- **Então** a ação de remover está disponível igual à de qualquer outra, sem bloqueio por autoria (ADR-002)

## Fora de escopo

- Edição de dados da corretora — vêm de fonte externa e não são editáveis
- Revalidação manual na CVM
- Favoritar corretora e logo da corretora
- Telas das demais features (carteiras, ações, operações, desempenho)
- Criar carteira a partir da corretora — entra com o PRD-005 (Q-009)

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-017 | O corpo do erro COR-002 não traz o identificador da corretora existente; a tela a obtém consultando `GET /corretoras/cnpj/{cnpj}` logo depois da recusa | aberta | — |
| ASM-018 | `GET /corretoras/cnpj/{cnpj}` aceita o CNPJ em dígitos puros; a tela normaliza antes de consultar | aberta | — |
| ASM-019 | O selo de uso sai de `GET /carteiras`, que devolve só as carteiras do investidor logado e traz `corretoraId` em cada uma (como o painel já consome) | aberta | — |
| ASM-020 | Carteira inativa não vem em `GET /carteiras`; a contagem do selo, portanto, é de carteiras ativas | aberta | — |
| ASM-021 | `DELETE /corretoras/{id}` responde sem corpo quando aceita, e COR-004 chega no contrato de erro padrão | aberta | — |
| ASM-022 | `dataBaseCvm` e `dataCadastro` chegam como data ISO (`AAAA-MM-DD` ou instante ISO), formatáveis pelo utilitário de data da fundação | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-009 | Com a feature de carteiras ainda não construída, o que "oferecer usá-la" significa na recusa COR-002? | respondida | Cartão com a corretora existente e atalho que abre o detalhe dela. Sem link para criar carteira enquanto o PRD-005 não existir |
| Q-010 | Busca por CNPJ sem resultado deve virar o erro COR-001 ("voltar à lista") ou estado vazio? | respondida | Estado vazio na própria lista, com oferta de cadastrar aquele CNPJ. COR-001 segue valendo para quem abre um detalhe inexistente pela URL |
| Q-011 | Como paginar `GET /carteiras` para o selo de uso? | respondida | Percorrer todas as páginas com `size=200` até acabar; falha resulta em lista sem selo, nunca em lista quebrada |
