# PRD-008 v1 — Desempenho e dashboards

**Status:** proposto · **Data:** 08/09/2026 · **Depende de:** PRD-007 · **Relacionado:** ADR-004, ADR-005, ADR-006, ADR-010

## Problema

Registrar operações não é o objetivo do investidor — é o custo que ele paga para chegar aqui. Esta é a tela que entrega o valor do produto: **a tese que eu montei está dando certo?**

## Quem usa

Investidor com pelo menos uma operação registrada. É a tela que ele volta a abrir semanas depois.

## Histórias

**H-008.1 — Ver o resultado total.** Como investidor, quero ver o resultado das minhas carteiras: quanto investi, quanto vale hoje, e quanto ganhei ou perdi.

**H-008.2 — Separar o que realizei do que não realizei.** Como investidor, quero ver separadamente o lucro que já embolsei nas vendas e o que ainda está em aberto nas posições.

**H-008.3 — Ver a composição.** Como investidor, quero ver graficamente como minha carteira está distribuída entre os ativos.

**H-008.4 — Ver quem puxa o resultado.** Como investidor, quero ver quais ativos mais contribuíram, para cima e para baixo.

**H-008.5 — Comparar carteiras.** Como investidor com mais de uma carteira, quero comparar o desempenho entre elas.

## Comportamento esperado

### Os quatro números

O topo da tela traz sempre estes quatro, e nesta ordem:

| Número | O que é |
|---|---|
| **Valor investido** | Custo total das posições abertas |
| **Valor de mercado** | Quanto essas posições valem à cotação atual |
| **Resultado não realizado** | A diferença entre os dois — o lucro no papel |
| **Resultado realizado** | O que já foi apurado nas vendas |

Resultado não realizado e realizado **nunca aparecem somados num único número**. São coisas diferentes e o investidor experiente sabe disso; misturar destrói a confiança na tela.

`[D]` Cada número aparece em **valor absoluto e em percentual sobre o investido**. Nada de rentabilidade anualizada no v1: anualizar exige saber há quanto tempo cada posição existe e ponderar aportes ao longo do tempo, o que depende de percorrer todo o extrato — que é paginado e sem filtro. Fica para o v2, junto da série histórica.

Positivo e negativo com tratamento visual distinto, e **não apenas por cor** — o produto tem tema claro e escuro, e cor sozinha não sobrevive aos dois.

### Gráficos

**Composição da carteira** — distribuição do valor de mercado entre os ativos. Responde "estou concentrado demais em alguma coisa?".

**Contribuição por ativo** — resultado, positivo e negativo, de cada posição. Responde "quem está puxando o resultado?". Ordenado do maior ganho à maior perda.

**Lucro realizado por ativo** — quanto cada ticker já rendeu em vendas apuradas. Esse recorte existe no domínio e é um dos poucos números "fechados" do produto.

`[D]` **Comparação entre carteiras fica para o v2.** Ela depende de consolidar várias carteiras de uma vez, e o backend consolida uma por vez.

> **Restrição conhecida:** o produto **não guarda série histórica**. Não há como plotar a evolução do valor da carteira ao longo do tempo, nem rentabilidade acumulada por mês, nem comparação com um índice ao longo do período. Todo gráfico deste PRD é um **retrato do agora**, não uma linha do tempo. Não prometer gráfico de evolução nas telas do v1. Ver ADR-010.

### Escopo

`[D]` **A tela funciona sobre uma carteira por vez.** Um seletor no topo escolhe qual, e a escolha é lembrada entre visitas. Não existe visão somada de todas as carteiras no v1 — o backend consolida por carteira, e somar no frontend produziria um número que não bate com nenhuma outra tela do sistema.

`[D]` **Todo valor é apresentado em real.** Posições em dólar são convertidas pela taxa corrente, e a taxa e o horário dela aparecem junto do total. A conversão é parte do número, não um detalhe: se a taxa está velha, o número está velho. Ver ADR-004.

### O que a tela precisa confessar

Dois avisos permanentes, não escondidos:

1. **A rentabilidade não inclui dividendos nem JCP.** O produto não tem esse dado. Uma ação que distribuiu dinheiro aparece com resultado menor do que o real. Isso precisa estar dito na tela de desempenho, onde o número é lido, e não só num texto de ajuda.
2. **Os preços são snapshots.** O resultado exibido usa a última cotação conhecida de cada ativo, e essas cotações podem ter idades diferentes entre si. O horário mais antigo entre elas é o que qualifica a tela.

## Estados

| Situação | O que aparece |
|---|---|
| Sem operação nenhuma | Convite a registrar a primeira compra, não gráficos zerados |
| Só compras, nenhuma venda | Resultado realizado aparece como zero, com explicação de que aparece após a primeira venda |
| Posição zerada por venda | Não aparece na composição; aparece no lucro realizado |
| Câmbio indisponível | Total com a última taxa conhecida e aviso do horário |
| Cotação de algum ativo defasada | Marcação no ativo e aviso no topo |

## Critérios de aceite

- Realizado e não realizado aparecem sempre separados
- Todo valor derivado de cotação ou câmbio traz o horário da fonte
- O aviso sobre ausência de dividendos é permanente e visível na tela, não em tooltip
- Nenhum gráfico apresenta evolução temporal
- A carteira selecionada é lembrada entre visitas
- Ganho e perda são distinguíveis sem depender de cor, nos dois temas
- Sem operações, a tela convida à ação em vez de mostrar gráficos vazios
- Os gráficos são legíveis em tema claro e escuro e não dependem só de cor para transmitir ganho e perda

## Fora do escopo do v1

Evolução histórica, rentabilidade por período, rentabilidade anualizada, comparação entre carteiras, comparação com índice de referência, dividend yield, exportação de relatório, projeção.

## Perguntas em aberto

Nenhuma.
