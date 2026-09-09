# Spec: Desempenho

> feature: desempenho
> status: pronta

## Contexto

A tela que entrega o valor do produto: registrar operação é o custo que o investidor
paga para chegar aqui. Ela responde "a tese que eu montei está dando certo?" sobre
**uma carteira por vez**, escolhida num seletor no topo e lembrada entre visitas.

Tudo é retrato do agora: o sistema não guarda série histórica, então nenhum gráfico
tem eixo de tempo (ADR-010). Todo valor aparece em real, e posição em dólar é
convertida pela taxa do consolidado antes de entrar em qualquer número ou gráfico
(ADR-004) — essa é a armadilha da tela, porque um gráfico de composição que ignora
a moeda fica bonito e mente em silêncio.

Reaproveita o que carteiras e painel já construíram: `Variacao` (ganho e perda com
seta e palavra, não só cor), `ValorComHorario` (preço nunca sem o momento em que foi
obtido, ADR-005), `MensagemFeedback`, `CarteirasService`, `AcoesService` e a
preferência de carteira do painel.

## Histórias

### US-049 — Ver os quatro números da carteira

Como investidor, quero ver quanto investi, quanto vale hoje, quanto ganhei no papel e
quanto já embolsei nas vendas, para saber se a tese está dando certo — sem que essas
naturezas diferentes se misturem num número só.

#### AC-183 — Os quatro números aparecem no topo, nesta ordem, em real

- **Dado** uma carteira com consolidado e lucro realizado respondidos
- **Quando** o investidor abre a tela de desempenho
- **Então** o topo traz, nesta ordem, valor investido, valor de mercado, resultado não realizado e resultado realizado, todos em real

#### AC-184 — Realizado e não realizado nunca aparecem somados

- **Dado** uma carteira com resultado não realizado e resultado realizado diferentes de zero
- **Quando** o investidor lê o topo da tela
- **Então** os dois aparecem como números separados e rotulados, e nenhum elemento da tela apresenta a soma dos dois

#### AC-185 — Cada resultado traz também o percentual sobre o investido

- **Dado** um consolidado com valor investido diferente de zero
- **Quando** o investidor lê os resultados
- **Então** cada resultado aparece em valor absoluto e em percentual sobre o valor investido

#### AC-186 — Investido zero não vira percentual

- **Dado** um consolidado com valor investido igual a zero
- **Quando** a tela calcula os percentuais
- **Então** nenhum percentual é exibido no lugar do valor, e a tela não mostra infinito nem "NaN"

#### AC-187 — Ganho e perda se distinguem sem depender de cor

- **Dado** um resultado positivo e um resultado negativo na mesma tela
- **Quando** o investidor os lê em tema claro ou escuro
- **Então** cada um traz sinal (seta) e palavra junto do número, e a distinção sobrevive sem nenhuma cor

#### AC-188 — Nada de rentabilidade anualizada

- **Dado** qualquer carteira
- **Quando** a tela apresenta os resultados
- **Então** nenhum rótulo promete rentabilidade anualizada, por período ou acumulada (depende de série histórica que não existe, ADR-010)

### US-050 — Escolher a carteira e não ter de reescolher

Como investidor com mais de uma carteira, quero escolher qual estou olhando e que a
escolha continue valendo quando eu voltar, para não repetir o mesmo clique toda vez.

#### AC-189 — O seletor troca a carteira inteira da tela

- **Dado** um investidor com duas carteiras
- **Quando** ele escolhe a outra no seletor do topo
- **Então** números, gráficos e avisos passam a ser os da carteira escolhida

#### AC-190 — A carteira escolhida é lembrada entre visitas

- **Dado** que o investidor escolheu uma carteira e saiu da tela
- **Quando** ele volta ao desempenho numa nova visita
- **Então** a tela abre já na carteira que ele havia escolhido

#### AC-191 — Não existe visão somada de todas as carteiras

- **Dado** um investidor com várias carteiras
- **Quando** ele abre o seletor
- **Então** todas as opções são carteiras concretas, sem nenhuma opção que some ou agregue várias (o backend consolida uma por vez)

### US-051 — Ver a composição da carteira

Como investidor, quero ver como o valor de mercado está distribuído entre os ativos,
para saber se estou concentrado demais em alguma coisa.

#### AC-192 — A composição distribui o valor de mercado entre os ativos

- **Dado** uma carteira com três posições abertas
- **Quando** o investidor olha a composição
- **Então** cada ativo aparece como uma fatia com ticker, valor em real e participação percentual, da maior para a menor

#### AC-193 — Posição em dólar é convertida antes de compor

- **Dado** uma posição em ação americana, cotada em dólar, e a taxa de câmbio do consolidado
- **Quando** a composição é montada
- **Então** o valor dessa fatia é o valor em dólar multiplicado pela taxa, e não o número em dólar plotado como se fosse real

#### AC-194 — A soma das fatias bate com o valor de mercado do consolidado

- **Dado** uma carteira com posições em real e em dólar
- **Quando** a composição é montada
- **Então** a soma das fatias é igual ao valor de mercado do consolidado, dentro da tolerância de 0,5%

#### AC-195 — Composição que não fecha confessa no próprio gráfico

- **Dado** uma posição cuja moeda a tela não conseguiu determinar, fazendo a soma das fatias divergir do valor de mercado acima da tolerância
- **Quando** a composição é exibida
- **Então** o gráfico continua visível com uma ressalva explícita de que a composição não fecha com o valor de mercado, junto do gráfico e não em tooltip

#### AC-196 — Posição zerada por venda fica fora da composição

- **Dado** um ticker que só aparece no lucro realizado, sem posição aberta
- **Quando** a composição é montada
- **Então** esse ticker não vira fatia nenhuma

#### AC-197 — Composição não tem eixo de tempo

- **Dado** a composição desenhada
- **Quando** o investidor a examina
- **Então** não há eixo, rótulo ou série temporal nela, e nenhum título promete evolução

### US-052 — Ver quem puxa o resultado

Como investidor, quero ver quais ativos mais contribuíram para cima e para baixo,
para saber a quem devo o resultado que estou vendo.

#### AC-198 — A contribuição é ordenada do maior ganho à maior perda

- **Dado** uma carteira com posições de resultado positivo e negativo
- **Quando** o investidor olha a contribuição por ativo
- **Então** as barras aparecem do maior ganho à maior perda, cada uma com ticker e valor em real

#### AC-199 — A contribuição de posição em dólar é convertida

- **Dado** uma posição americana com resultado não realizado em dólar
- **Quando** a contribuição é montada
- **Então** o valor dessa barra é o resultado convertido pela taxa do consolidado

#### AC-200 — Ganho e perda no gráfico se distinguem sem cor

- **Dado** uma contribuição com barras positivas e negativas
- **Quando** o investidor a lê em qualquer um dos dois temas
- **Então** cada barra traz sinal e a direção escrita, e o sentido da barra separa ganho de perda sem depender de cor

#### AC-201 — Contribuição não tem eixo de tempo

- **Dado** a contribuição desenhada
- **Quando** o investidor a examina
- **Então** não há eixo, rótulo ou série temporal nela

### US-053 — Ver o que já foi apurado nas vendas

Como investidor, quero ver quanto cada ticker já rendeu em vendas apuradas, porque
esse é um dos poucos números fechados do produto — não muda com a cotação.

#### AC-202 — O realizado por ticker vem do que o backend apurou

- **Dado** um lucro realizado com dois tickers
- **Quando** o investidor olha o gráfico de lucro realizado
- **Então** cada ticker aparece com o valor apurado, inclusive tickers que não têm mais posição aberta, e a soma exibida é a do total do backend

#### AC-203 — Sem venda nenhuma, o realizado é zero explicado

- **Dado** uma carteira só com compras, cujo lucro realizado tem total zero e nenhum ticker
- **Quando** a tela apresenta o resultado realizado
- **Então** ele aparece como zero acompanhado da explicação de que passa a existir depois da primeira venda, no lugar de um gráfico vazio

#### AC-204 — Realizado não tem eixo de tempo

- **Dado** o gráfico de lucro realizado desenhado
- **Quando** o investidor o examina
- **Então** não há eixo, rótulo ou série temporal nele

### US-054 — Saber o que o número não conta

Como investidor, quero que a tela diga o que está fora da conta e qual a idade do
dado, para julgar se posso decidir com o que estou vendo.

#### AC-205 — O aviso sobre dividendos e JCP é permanente e visível

- **Dado** a tela de desempenho carregada em qualquer estado
- **Quando** o investidor a lê
- **Então** um aviso permanente diz que a rentabilidade não inclui dividendos nem JCP, no corpo da tela e não em tooltip ou rodapé

#### AC-206 — O horário mais antigo entre as cotações qualifica a tela

- **Dado** posições com cotações obtidas em horários diferentes
- **Quando** a tela apresenta a idade dos preços
- **Então** o horário exibido no topo é o mais antigo entre as posições, com o aviso de que os preços são snapshots de idades diferentes

#### AC-207 — Cotação defasada marca o ativo e avisa no topo

- **Dado** uma posição cuja cotação passou do limite de defasagem
- **Quando** a tela carrega
- **Então** o ativo recebe marcação própria além da cor e um aviso no topo diz que há preço defasado na carteira

#### AC-208 — Câmbio indisponível mostra a última taxa com o aviso do backend

- **Dado** um consolidado com avisos preenchidos por falha na fonte de câmbio
- **Quando** a tela apresenta os totais
- **Então** os números continuam na tela com a última taxa conhecida e o horário dela, e cada aviso do backend aparece no nível aviso, nunca como erro (ADR-006)

### US-055 — Não ver gráfico vazio quando não há o que mostrar

Como investidor sem operação registrada, quero um caminho em vez de gráficos zerados,
para saber o que fazer para a tela passar a valer alguma coisa.

#### AC-209 — Sem operação nenhuma, a tela convida a registrar a primeira compra

- **Dado** uma carteira sem posições e com lucro realizado zerado
- **Quando** o investidor abre o desempenho
- **Então** a tela mostra o convite a registrar a primeira compra, com atalho para a operação, e nenhum gráfico é desenhado

#### AC-210 — Sem carteira nenhuma, a tela convida a criar a primeira

- **Dado** um investidor sem carteira cadastrada
- **Quando** ele abre o desempenho
- **Então** a tela convida a criar a primeira carteira, sem seletor vazio e sem gráficos

#### AC-211 — Leitura que falha degrada o bloco, não a tela

- **Dado** que a leitura do lucro realizado falha e as demais respondem
- **Quando** a tela carrega
- **Então** os outros números e gráficos continuam visíveis, o bloco afetado informa que não pôde ser lido, e nada aparece como se fosse zero apurado

## Fora de escopo

- Evolução histórica, rentabilidade por período e rentabilidade anualizada (ADR-010)
- Comparação entre carteiras e comparação com índice de referência (o backend consolida uma carteira por vez)
- Dividend yield, exportação de relatório e projeção
- Visão somada de todas as carteiras
- Atualizar cotação a partir desta tela (é ação do catálogo de ações, ADR-005)

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-044 | `GET /carteiras/{id}/posicoes` devolve `cotacaoAtual`, `precoMedio` e `rentabilidadeNaoRealizada` na moeda da ação, não em real — o que invalida a ASM-025 de carteiras, escrita quando se supunha o contrário | confirmada | Confirmado pelo dono do produto no prompt do PRD-008: "posicoes devolve cotacaoAtual na moeda da ação — uma posição em ação americana vem em dólar" |
| ASM-045 | A moeda de cada posição é obtida do catálogo de ações (`GET /acoes`), casando por ticker; o backend não devolve moeda na linha da posição | confirmada | Decisão do dono do produto: varredura larga do catálogo, montando mapa ticker→moeda, sem inventar endpoint |
| ASM-046 | Uma página larga do catálogo (200 itens) cobre o catálogo do investidor típico deste produto, como já se assume no extrato e na varredura de carteiras (ADR-010) | confirmada | Confirmado pelo dono do produto: mesmo critério já adotado em `MOVIMENTACOES_BUSCADAS` e `CARTEIRAS_POR_VARREDURA` |
| ASM-047 | `consolidado.valorDeMercado` já vem convertido em real, e é ele o número contra o qual a soma das fatias é conferida | confirmada | ADR-004: todo total consolidado é apresentado em moeda única, com taxa e horário à vista |
| ASM-048 | Ticker ausente do catálogo tem moeda desconhecida e entra na composição pelo valor bruto, sem conversão — o que faz a soma divergir e dispara a ressalva de AC-195, em vez de converter no escuro | confirmada | Decisão do dono do produto: divergência acima de 0,5% vira ressalva junto do gráfico, com o gráfico ainda visível |
| ASM-049 | `lucro-realizado.total` e `porTicker` já vêm em real, como o consolidado, e não precisam de conversão | aberta | — |
| ASM-050 | O limite de defasagem da tela é o mesmo de todo o produto (`LIMITE_DEFASAGEM_MINUTOS`, 15 minutos, ADR-005) | confirmada | Reuso de `core/dados/idade-dado`, já em vigor em carteiras e painel |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-022 | Como o frontend descobre a moeda de cada posição, se `posicoes` não devolve esse campo? | respondida | Catálogo de ações: varredura de `GET /acoes` montando mapa ticker→moeda (ASM-045) |
| Q-023 | O que a tela faz quando a soma das fatias não bate com `valorDeMercado`? | respondida | Gráfico continua visível com ressalva explícita acima da tolerância de 0,5% (AC-195) |
| Q-024 | Com que tecnologia desenhar os gráficos, já que o projeto não tem biblioteca de gráficos? | respondida | SVG próprio em componentes Angular, cores vindas dos tokens, sem nova dependência |
| Q-025 | A ASM-025 da feature carteiras ("posições chegam em real") ficou invalidada por ASM-044 — a tela de detalhe da carteira exibe `precoMedio` e `cotacaoAtual` com `formatarReal` e pode estar rotulando dólar como real. Corrigir agora ou em passo próprio? | respondida | Dono do produto: registrar como dívida conhecida e corrigir em passo próprio; o passo 8 não reabre a feature carteiras |
