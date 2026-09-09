# Spec: Repaginacao desempenho

> feature: repaginacao-desempenho
> status: rascunho

## Contexto

Repagina os blocos de desempenho — composição, contribuição, realizado e os
números do topo. Hoje os três "gráficos" são `<svg><rect>` com largura em
percentual: corretos, honestos e visualmente pobres.

Duas restrições mandam aqui e não se negociam. O **ADR-010** proíbe série
histórica: nenhum gráfico de evolução, nenhuma miniatura de tendência, nenhuma
comparação com período anterior — foi ele que dispensou biblioteca de gráficos no
RFC-001. E a paleta de séries já existe em tokens, com **ordem fixa** para que a
fatia de um ativo não mude de cor quando outro entra ou sai, validada para
daltonismo: ela não muda.

## Histórias

### US-072 — Enxergar a concentração da carteira

Como investidor, quero ver a composição em forma de proporção, para que eu
perceba de imediato se estou concentrado demais em algum ativo.

#### AC-259 — Composição em rosca com rótulos legíveis

- **Dado** uma carteira com posições abertas
- **Quando** a composição é exibida
- **Então** as participações aparecem como setores de uma rosca, cada ativo
  mantendo a cor que já tem hoje, com legenda listando ticker, valor e
  participação

#### AC-260 — A cor nunca carrega a informação sozinha

- **Dado** a composição exibida
- **Quando** o investidor lê qualquer fatia
- **Então** ticker, valor e participação estão disponíveis em texto, e a leitura
  não depende de distinguir cores

#### AC-261 — Destacar uma fatia destaca sua legenda

- **Dado** a rosca e sua legenda
- **Quando** o ponteiro entra em uma fatia ou na linha correspondente da legenda
- **Então** fatia e linha se destacam juntas, e o destaque some ao sair

#### AC-262 — A ressalva de soma continua visível

- **Dado** que a soma das fatias não fecha com o valor de mercado
- **Quando** a composição é exibida
- **Então** o aviso explicando a diferença aparece junto do gráfico, sem escondê-lo

### US-073 — Comparar o que cada ativo contribuiu

Como investidor, quero comparar a contribuição de cada ativo, para que eu saiba o
que puxou o resultado para cima e para baixo.

#### AC-263 — Contribuição com eixo comum e sinal explícito

- **Dado** contribuições positivas e negativas
- **Quando** o bloco é exibido
- **Então** as barras partem de uma linha de zero comum, e cada valor traz sinal
  além da cor

### US-074 — Ler os números do desempenho

Como investidor, quero que os números do desempenho tenham hierarquia visual,
para que eu leia o resultado antes dos detalhes.

#### AC-264 — Indicador com rótulo, valor e selo

- **Dado** um número do desempenho
- **Quando** ele é exibido
- **Então** apresenta rótulo em texto menor, valor em destaque e, quando for
  resultado, selo de variação com sinal

#### AC-265 — Nenhum bloco sugere histórico que não existe

- **Dado** que o produto não guarda série histórica (ADR-010)
- **Quando** qualquer bloco de desempenho é exibido
- **Então** não há eixo de tempo, miniatura de tendência nem comparação com
  período anterior

## Fora de escopo

- Qualquer gráfico com eixo de tempo, e qualquer biblioteca de gráficos: o
  desenho continua em SVG próprio (D3 do RFC-001).
- Mudar as cores de série ou sua ordem — são token, com ordem fixa e validação de
  daltonismo já feita.
- Mudar o cálculo de composição, contribuição ou realizado: só a apresentação.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-064 | A rosca desenhada à mão em SVG (trigonometria de setores) atende sem biblioteca, no volume de ativos de uma carteira típica | aberta | — |
| ASM-065 | Com muitos ativos, agrupar a cauda em "demais" usando `--cor-serie-resto` mantém a rosca legível | aberta | — |
| ASM-066 | O destaque cruzado por ponteiro basta, sem exigir equivalente por teclado, por ser reforço visual de dado já disponível em texto | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-033 | A partir de quantos ativos a cauda vira "demais"? | respondida | Oito, que é exatamente o tamanho da paleta de séries — do nono em diante tudo agrupa em `--cor-serie-resto`. O corte já existe no código atual (`CORES_DE_SERIE = 8`), então a rosca herda a regra em vez de criar outra. Decidido pelo agente |
| Q-034 | A rosca mostra algum total no centro? | respondida | Sim: o valor de mercado da carteira, que é o todo que as fatias dividem. Quantidade de ativos não é o total de nada e confundiria a leitura da proporção. Decidido pelo agente |
