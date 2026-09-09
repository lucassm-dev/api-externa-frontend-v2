# PRD-005 v1 — Carteiras

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** PRD-004 · **Relacionado:** ADR-002, ADR-003, ADR-004, ADR-007

## Problema

A carteira é a unidade central do produto: é onde as posições existem, onde o desempenho é medido e o que o investidor abre para trabalhar. Sem carteira, nada mais no sistema faz sentido.

## Quem usa

Investidor, logo após cadastrar a primeira corretora, e sempre que quiser separar teses ("dividendos", "small caps", "carteira do meu pai").

## Decisão de escopo desta tela

> **Pergunta do dono do produto:** "cadastro de carteiras, onde dentro dela eu cadastro um ativo e uma corretora — ou é melhor separar?"
>
> **Resposta deste PRD:** separar. Corretora, ação e carteira são três cadastros distintos, com três telas distintas, por três razões de produto:
>
> 1. **Corretora e ação são catálogos compartilhados; carteira é do investidor.** Cadastrar ação "dentro da carteira" faz o investidor acreditar que aquela ação é dele. Ela não é: o mesmo PETR4 serve a todo mundo. Ver ADR-002.
> 2. **A ordem é obrigatória.** Não dá para criar carteira sem corretora, nem cadastrar ação sem ter carteira. Uma tela única esconderia essa ordem e produziria erros que o investidor não entende. Ver ADR-003.
> 3. **A frequência é diferente.** Corretora se cadastra uma vez na vida, ação de vez em quando, operação toda semana. Juntar tudo numa tela otimiza para o caso raro.
>
> **Onde eles se encontram:** nos formulários, não nos cadastros. Ao criar a carteira, a corretora é escolhida numa lista, com atalho "cadastrar nova corretora" para quem não a tem. Ao registrar uma compra, a ação é escolhida numa lista, com atalho "cadastrar nova ação". O investidor nunca fica preso, mas cada coisa continua morando no seu lugar.

## Histórias

**H-005.1 — Criar carteira.** Como investidor, quero criar uma carteira dando um nome e escolhendo a corretora, para começar a registrar operações.

**H-005.2 — Ver minhas carteiras.** Como investidor, quero ver todas as minhas carteiras com o valor e o resultado de cada uma.

**H-005.3 — Abrir uma carteira.** Como investidor, quero abrir uma carteira e ver suas posições, seu resultado e suas movimentações num lugar só.

**H-005.4 — Renomear.** Como investidor, quero renomear uma carteira sem perder nada dela.

**H-005.5 — Excluir.** Como investidor, quero excluir uma carteira que não uso mais.

## Comportamento esperado

### Criação

Campos: **nome**, **corretora** (escolhida entre as cadastradas) e **mercado de referência** (Brasil ou Estados Unidos).

> **Pendência de backend.** O dono do produto decidiu que o mercado **não deve ser pedido na criação da carteira** — ele não trava nada, já que a carteira aceita ações dos dois mercados. Só que o backend ainda o exige como campo obrigatório. Enquanto isso não mudar, o campo continua no formulário. Removê-lo é assunto de um PRD-005 **v2**, junto da mudança no backend. Não inventar um valor fixo escondido no frontend: isso grava no banco um dado que o investidor não escolheu.

`[D]` **Todo valor consolidado é apresentado em real.** Posições em dólar são convertidas pela taxa de câmbio corrente, e a taxa e o horário dela aparecem junto do total. Isso é o que o backend já faz — ele guarda o custo das posições em real e consolida em real. Ver ADR-004.

Sem nenhuma corretora cadastrada, o formulário não fica com um seletor vazio: ele leva ao cadastro de corretora e volta.

O investidor pode ter quantas carteiras quiser.

### Lista

Cartões ou linhas com nome, corretora, mercado, valor de mercado, resultado não realizado e resultado realizado. Paginada. Ações rápidas: abrir, renomear, excluir.

### Detalhe da carteira

A tela mais densa do produto. Contém:

- **Cabeçalho:** nome, corretora, mercado, e os totais — investido, valor de mercado, resultado não realizado, resultado realizado — com o horário da cotação e da taxa de câmbio usadas
- **Posições:** uma linha por ação com posição aberta — ticker, nome da empresa, quantidade, preço médio, cotação atual (com horário), resultado não realizado em valor e em percentual
- **Movimentações da carteira:** compras e vendas dessa carteira, com atalho para o histórico completo (PRD-007)
- **Ações:** registrar compra, registrar venda

### Posições encerradas

Vender tudo de um ativo **remove a posição** — ela desaparece da lista de posições abertas. Sem tratamento, o investidor conclui que o sistema perdeu o registro.

`[D]` **A tela da carteira tem uma seção "Encerradas", abaixo das posições abertas**, listando os ativos que o investidor já teve e zerou, com o resultado realizado de cada um. Seção visível, não filtro escondido: o investidor não vai procurar um filtro por algo que ele acha que sumiu.

A seção só aparece quando existir pelo menos um ativo encerrado. Ela mostra ticker e resultado realizado — não mostra preço médio nem quantidade, porque a posição não existe mais.

### Renomear

Edição só do nome. Nada mais da carteira é editável.

### Excluir

Bloqueada enquanto houver qualquer posição com quantidade maior que zero. A mensagem explica: "Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la." Exclusão é lógica; para o investidor, a carteira simplesmente some.

## Critérios de aceite

- Criar carteira exige nome, corretora e mercado; sem corretora cadastrada, o formulário conduz ao cadastro de corretora
- A tela nunca afirma que a carteira aceita apenas um mercado
- Todo total consolidado aparece em real, com a taxa de câmbio e o horário visíveis
- Existindo ativo encerrado, a seção "Encerradas" aparece com o resultado realizado de cada um
- A lista mostra somente carteiras do investidor logado
- Abrir carteira mostra posições, totais e movimentações sem exigir nova navegação
- Todo valor derivado de cotação ou câmbio aparece com o horário da fonte
- Excluir carteira com posição aberta é bloqueado com explicação acionável
- Renomear preserva posições, movimentações e resultado

## Fora do escopo do v1

Mover operação entre carteiras, duplicar carteira, arquivar sem excluir, compartilhar carteira, meta de alocação, comparação entre carteiras.

## Perguntas em aberto

Nenhuma. Resta a pendência de backend do campo de mercado, descrita em Criação.
