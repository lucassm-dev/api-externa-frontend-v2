# Spec: Operacoes

> feature: operacoes
> status: pronta

## Contexto

Registrar compra e venda é o ato central do produto e o que o investidor mais repete
(PRD-007). Esta feature entrega uma tela única em `/operacoes` — formulário no topo,
extrato logo abaixo — mais a correção e a exclusão de lançamentos, sobre a fundação que já
existe: feedback em três níveis, tradutor de erro por código, formatação, marcação de dado
defasado, diálogo de confirmação e os serviços de carteiras e ações.

Quatro pontos concentram o risco:

1. **Aviso não é erro (ADR-006).** Uma operação pode ser registrada com sucesso e trazer
   `avisos` — cache vencido, cota da fonte estourada (EXT-009), fonte fora do ar (EXT-010),
   câmbio antigo (EXT-011). Se a tela pintar isso de vermelho ou usar o componente de erro,
   o investidor conclui que a compra falhou, registra de novo, e passa a ter duas compras
   reais no extrato. É o único bug desta tela que cria dinheiro falso.
2. **Preço é automático por padrão (ADR-008).** O campo de preço não vem aberto; abri-lo é
   uma ação deliberada. E não existe endpoint de "consultar preço para operação": o valor
   mostrado antes de confirmar é **estimativa** tirada da última cotação conhecida. O preço
   que vale é o `precoUnitario` da resposta.
3. **A venda antecipa as regras em vez de deixar o erro ensiná-las.** Ação sem posição não
   entra no seletor (previne OPE-003) e a quantidade é limitada à posição, com o disponível
   à vista (previne OPE-004).
4. **O extrato não aceita filtro (ADR-010).** `GET /operacoes` é global e não recebe
   carteira, ticker, tipo nem período. Filtrar só a página carregada mentiria. Nenhum filtro
   é construído no v1.

## Histórias

### US-042 — Registrar compra

Como investidor, quero registrar a compra de uma quantidade de uma ação numa carteira, com
o preço vindo do mercado, sem digitar nada além da quantidade.

#### AC-150 — Compra e venda são o mesmo formulário, com o tipo sempre visível

- **Dado** um investidor na área de operações
- **Quando** a tela carrega
- **Então** existe um único formulário com um par de opções lado a lado — compra e venda — como primeiro elemento, o tipo selecionado está marcado e legível sem nenhuma interação, e não há campo suspenso escondendo a escolha

#### AC-151 — Trocar o tipo preserva a carteira e limpa quantidade e preço

- **Dado** um formulário preenchido com carteira, ação, quantidade e preço manual
- **Quando** o investidor troca o tipo de operação
- **Então** a carteira escolhida continua selecionada, e quantidade e preço ficam vazios — nenhum número sobrevive à troca

#### AC-152 — Na compra, a ação vem do catálogo inteiro

- **Dado** um investidor com o tipo compra selecionado e uma carteira escolhida
- **Quando** ele abre o seletor de ação
- **Então** as ações oferecidas são as do catálogo, sem depender de haver posição na carteira

#### AC-153 — O botão de confirmação diz qual operação será registrada

- **Dado** um investidor no formulário
- **Quando** ele olha o botão de confirmação em cada tipo
- **Então** o botão diz "Registrar compra" no tipo compra e "Registrar venda" no tipo venda

#### AC-154 — A compra é enviada com carteira, ticker e quantidade

- **Dado** um formulário de compra com carteira, ação e quantidade preenchidas e o preço automático
- **Quando** o investidor confirma
- **Então** sai um registro de compra levando a carteira, o ticker e a quantidade, e nenhum preço unitário é enviado

#### AC-155 — Confirmar mostra a operação registrada com o preço efetivo da resposta

- **Dado** uma compra aceita pelo servidor com preço unitário diferente do estimado na tela
- **Quando** a confirmação aparece
- **Então** a tela exibe quantidade, preço unitário e valor total vindos da resposta, com o horário do registro — e o preço mostrado é o efetivo, nunca a estimativa que estava no formulário

#### AC-156 — Registrar não fecha o formulário

- **Dado** uma operação recém-registrada com sucesso
- **Quando** o investidor olha a tela
- **Então** o formulário continua aberto e utilizável, com a carteira preservada e a quantidade limpa, e existe um caminho visível de volta à carteira

### US-043 — Registrar venda

Como investidor, quero registrar a venda de parte ou de toda a minha posição e ver o
resultado realizado dessa venda.

#### AC-157 — Na venda, só aparecem ações com posição na carteira escolhida

- **Dado** uma carteira com posição em duas ações, num catálogo que tem outras
- **Quando** o investidor seleciona o tipo venda e escolhe essa carteira
- **Então** o seletor de ação oferece apenas as duas ações com posição, e nenhuma ação sem posição na carteira pode ser escolhida (previne OPE-003)

#### AC-158 — A venda mostra o disponível e impede exceder a posição

- **Dado** uma posição de 100 unidades na ação escolhida
- **Quando** o investidor vê o formulário de venda e digita 150
- **Então** a quantidade disponível aparece na tela, o formulário recusa a confirmação e nenhum registro de venda é enviado (previne OPE-004)

#### AC-159 — Trocar a carteira na venda descarta ação e quantidade que não valem mais

- **Dado** uma venda com ação e quantidade escolhidas para uma carteira
- **Quando** o investidor troca de carteira
- **Então** o seletor passa a oferecer as posições da nova carteira, e ação e quantidade da carteira anterior não permanecem escolhidas

#### AC-160 — Depois da venda, o resultado realizado e o preço médio aparecem

- **Dado** uma venda aceita pelo servidor com resultado realizado e preço médio de compra no momento
- **Quando** a confirmação aparece
- **Então** os dois números são exibidos junto da operação, identificados como resultado daquela venda e preço médio de compra vigente

#### AC-161 — OPE-004 vindo do servidor destaca a quantidade e mantém o formulário

- **Dado** uma venda recusada pelo servidor com o código OPE-004 informando a quantidade disponível
- **Quando** a recusa chega
- **Então** a tela diz quantas unidades o investidor tem, destaca o campo de quantidade, mantém o formulário preenchido e não navega para lugar nenhum

### US-044 — Usar um preço meu

Como investidor que está reproduzindo uma operação real, quero poder informar o preço em
vez de usar o de mercado.

#### AC-162 — O campo de preço não vem aberto

- **Dado** um investidor que acabou de abrir o formulário
- **Quando** ele olha os campos
- **Então** não existe campo de preço editável na tela, apenas um controle explícito para informar preço manualmente (ADR-008)

#### AC-163 — Ativar o preço manual abre o campo e o preço passa a ser o digitado

- **Dado** um formulário com o preço manual ativado e um preço digitado
- **Quando** o investidor confirma
- **Então** o registro enviado leva o preço unitário digitado, e desativar o controle volta a operação para o preço de mercado sem preço nenhum no envio

#### AC-164 — Preço manual aceita no máximo duas casas decimais

- **Dado** o preço manual ativado
- **Quando** o investidor digita um preço com três casas decimais e confirma
- **Então** nenhum registro é enviado, a tela informa que o preço pode ter no máximo 2 casas decimais e destaca o campo de preço (OPE-005)

#### AC-165 — A estimativa é apresentada como estimativa

- **Dado** uma ação escolhida com cotação conhecida e uma quantidade digitada
- **Quando** o investidor olha o formulário antes de confirmar
- **Então** a tela mostra o preço e o total que serão usados com o horário da cotação, declarando que o valor é estimado e pode diferir do preço efetivamente registrado

### US-045 — Não confundir aviso com falha

Como investidor, quero saber quando a operação foi registrada com uma ressalva, sem
concluir que ela falhou.

#### AC-166 — Operação com avisos é apresentada como registrada

- **Dado** uma compra aceita pelo servidor trazendo avisos na resposta
- **Quando** a confirmação aparece
- **Então** a tela afirma que a operação foi registrada e exibe seus números, sem nenhuma mensagem de falha e sem sugerir que o investidor registre de novo

#### AC-167 — Os avisos aparecem no nível aviso, nunca com o componente de erro

- **Dado** uma operação registrada com dois avisos na resposta
- **Quando** a tela apresenta o resultado
- **Então** cada aviso aparece no nível "aviso" da fundação, visualmente distinto de erro, e nenhum elemento de erro é renderizado por causa deles

#### AC-168 — Uma resposta sem avisos não inventa aviso nenhum

- **Dado** uma operação aceita com a lista de avisos vazia
- **Quando** a confirmação aparece
- **Então** nenhuma mensagem de aviso é exibida

### US-046 — Ver todas as movimentações

Como investidor, quero um extrato de todas as minhas compras e vendas.

#### AC-169 — O extrato traz os dados da operação, do mais recente para o mais antigo

- **Dado** uma página de operações respondida pelo servidor
- **Quando** o extrato termina de carregar
- **Então** cada linha mostra data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total e moeda, na ordem em que o servidor devolveu, começando pela mais recente

#### AC-170 — Nas vendas, o extrato mostra o resultado realizado

- **Dado** um extrato com uma compra e uma venda com resultado realizado
- **Quando** as linhas são exibidas
- **Então** a linha da venda mostra o resultado realizado e a da compra não, e uma venda sem esse dado na resposta simplesmente não exibe o campo, sem traço nem zero

#### AC-171 — O extrato é paginado

- **Dado** um investidor com mais operações do que cabe numa página
- **Quando** ele avança e volta de página
- **Então** cada mudança pede a página correspondente ao servidor e a tela mostra em que página está

#### AC-172 — Não existe filtro nenhum no extrato

- **Dado** o extrato carregado
- **Quando** o investidor procura como recortar por carteira, ticker, tipo ou período
- **Então** não existe nenhum controle de filtro ou busca na tela, e nenhuma requisição de extrato carrega parâmetro de filtro (ADR-010)

#### AC-173 — A operação registrada aparece no extrato sem recarga manual

- **Dado** um investidor que acabou de registrar uma operação
- **Quando** a confirmação aparece
- **Então** o extrato da mesma tela é relido e passa a conter a operação, sem o investidor precisar recarregar nada

### US-047 — Corrigir um lançamento

Como investidor que errou a quantidade, quero editar a operação e ver a posição
recalculada.

#### AC-174 — Só quantidade e preço unitário são editáveis

- **Dado** uma operação do extrato aberta para edição
- **Quando** o investidor olha o formulário de edição
- **Então** apenas quantidade e preço unitário são editáveis; ação, carteira, tipo e data aparecem como informação e não podem ser alterados

#### AC-175 — A edição avisa do recálculo antes de confirmar

- **Dado** uma edição preenchida
- **Quando** o investidor pede para salvar
- **Então** a tela pede confirmação dizendo que editar esta operação vai recalcular a posição e o resultado da carteira, e nada é enviado antes dessa confirmação

#### AC-176 — Editar sem preço novo avisa que a última cotação conhecida será reutilizada

- **Dado** uma edição em que o preço unitário não foi informado
- **Quando** o investidor lê a tela de edição
- **Então** ela diz que, sem preço novo, o sistema reutiliza a última cotação conhecida da ação, sem buscar preço novo — e a alteração enviada não leva preço unitário

#### AC-177 — Depois de editar, o extrato reflete a operação corrigida

- **Dado** uma edição aceita pelo servidor
- **Quando** a confirmação chega
- **Então** o extrato é relido e mostra a operação com os valores novos, sem recarga manual

#### AC-178 — Editar pelas movimentações da carteira atualiza os números da carteira

- **Dado** o detalhe de uma carteira aberto na seção de movimentações
- **Quando** o investidor edita uma operação e o servidor aceita
- **Então** posições, consolidado, resultado realizado e movimentações da carteira são relidos e a tela mostra os números recalculados, sem recarga manual

### US-048 — Excluir um lançamento

Como investidor que registrou uma operação que não aconteceu, quero removê-la.

#### AC-179 — Excluir pede confirmação com o aviso de recálculo e sem desfazer

- **Dado** uma operação do extrato
- **Quando** o investidor pede para excluí-la
- **Então** a tela pede confirmação dizendo que a exclusão recalcula a posição e o resultado da carteira e que não há como desfazer, e nada é enviado antes dessa confirmação

#### AC-180 — Depois de excluir, a operação sai do extrato

- **Dado** uma exclusão aceita pelo servidor
- **Quando** a confirmação chega
- **Então** o extrato é relido e a operação não está mais nele, sem recarga manual

#### AC-181 — Excluir pelas movimentações da carteira atualiza os números da carteira

- **Dado** o detalhe de uma carteira aberto na seção de movimentações
- **Quando** o investidor exclui uma operação e o servidor aceita
- **Então** posições, consolidado, resultado realizado e movimentações da carteira são relidos e a tela mostra os números recalculados, sem recarga manual

#### AC-182 — OPE-001 recarrega o extrato em vez de insistir

- **Dado** uma edição ou exclusão recusada com o código OPE-001
- **Quando** a recusa chega
- **Então** a tela informa que a operação não foi encontrada e relê o extrato, deixando à vista a lista sem aquela operação

## Fora de escopo

- Operação em data passada, importação de nota de corretagem, taxas e corretagem, operação recorrente
- Desfazer exclusão e exportar extrato
- Qualquer filtro ou busca no extrato (v2, depende do backend — ADR-010)
- A tela de desempenho (PRD-008)

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-038 | `GET /operacoes` devolve, em cada item de venda, `lucroRealizado` e `precoMedioCompraNoMomento` como no retorno do registro. A tela trata os dois como opcionais: ausentes, o campo some da linha, nunca vira traço nem zero (ADR-006) | confirmada | Decisão do dono do produto: assumir que vem e degradar se faltar |
| ASM-039 | `PUT /operacoes/{id}` devolve a operação atualizada no mesmo formato do registro, incluindo `avisos` — que a tela apresenta como aviso, igual ao registro | aberta | — |
| ASM-040 | Não existe endpoint de consulta de preço para operação. A estimativa exibida antes de confirmar sai da última cotação conhecida da ação (`cotacaoAtual` do catálogo na compra, da posição na venda), sempre com o horário dela | confirmada | Levantado com o dono do produto no enunciado do passo 7 |
| ASM-041 | O extrato traz `carteiraId`, e o nome da carteira sai do cruzamento com a listagem de carteiras já carregada. Carteira que não estiver na listagem aparece pelo identificador, nunca em branco | aberta | — |
| ASM-042 | `GET /carteiras/{id}/posicoes` é a única fonte da quantidade disponível para venda; a posição lida ao escolher a carteira vale até a carteira mudar. O servidor continua sendo a autoridade — OPE-004 é tratado quando chega | aberta | — |
| ASM-043 | Registrar operação não devolve o nome da empresa nem a moeda da carteira além do campo `moeda` da própria operação; a apresentação usa o que a resposta traz | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-019 | A área `/operacoes` é uma tela só (formulário no topo, extrato abaixo) ou duas rotas? | respondida | Uma tela só. Atende sem quebrar os dois links que já existem — o do detalhe da carteira (`?carteira=&tipo=`) e o "ver o extrato completo" das movimentações |
| Q-020 | Editar e excluir ficam só no extrato global ou também nas movimentações da carteira? | respondida | Nos dois. No extrato, recarrega o extrato; nas movimentações da carteira, recarrega também consolidado, posições e resultado realizado — é ali que o recálculo fica visível (AC-178, AC-181) |
| Q-021 | O extrato mostra resultado realizado nas vendas mesmo sem contrato do backend disponível? | respondida | Sim, como campo opcional que degrada: presente, aparece; ausente, some da linha (ASM-038) |
