# Spec: Repaginacao painel

> feature: repaginacao-painel
> status: rascunho

## Contexto

Repagina a primeira tela que o investidor vê. Hoje a barra de mercado é uma
lista `flex` estática sobre fundo branco, o consolidado é uma `<dl>` sem
hierarquia, e as últimas movimentações são texto corrido. Consome as primitivas
da `fundacao-visual` e entrega a barra de cotações rolando, os números com peso
visual e o reconhecimento de ativo por monograma.

A decisão que manda aqui é o D7 do RFC-001: **a barra rola para a esquerda em
loop contínuo**, como no Investidor10. O ADR-005 continua valendo — o dado é um
retrato datado, não uma cotação ao vivo — então o carimbo de horário fica fora
da área que rola, e a rolagem para quando o investidor quer ler.

## Histórias

### US-063 — Acompanhar o mercado de relance

Como investidor, quero ver as cotações de referência passando no topo da tela,
para que eu sinta o contexto do mercado sem procurar.

#### AC-233 — A barra rola para a esquerda, em loop

- **Dado** a barra de contexto de mercado com seus itens
- **Quando** ela é exibida
- **Então** os itens deslizam continuamente para a esquerda e reaparecem pela
  direita, sem começo nem fim visíveis, usando apenas `transform` (regra M02 do
  motor de UI)

#### AC-234 — A rolagem para quando o investidor quer ler

- **Dado** a barra rolando
- **Quando** o ponteiro entra na barra ou um item recebe foco pelo teclado
- **Então** o movimento para, e volta quando o ponteiro sai ou o foco muda

#### AC-235 — Movimento reduzido desliga a rolagem

- **Dado** um usuário com preferência por movimento reduzido
- **Quando** a barra é exibida
- **Então** ela não rola, e todos os itens continuam alcançáveis por rolagem
  manual (regra M04 do motor de UI)

#### AC-236 — A barra não finge ser tempo real

- **Dado** que as cotações são um retrato datado (ADR-005)
- **Quando** a barra é exibida
- **Então** o horário de atualização fica visível e fora da área que rola,
  legível a qualquer momento sem esperar o movimento

#### AC-237 — Cada cotação é um chip legível

- **Dado** um item de cotação na barra
- **Quando** ele é exibido
- **Então** apresenta símbolo, preço e a variação como selo com sinal e seta, em
  superfície escura própria nos dois temas

### US-064 — Ler o consolidado sem esforço

Como investidor, quero que os números do consolidado tenham peso visual claro,
para que eu entenda a situação da carteira num relance.

#### AC-238 — O número domina o cartão

- **Dado** um indicador do consolidado (investido, mercado, resultado)
- **Quando** ele é exibido
- **Então** o valor aparece em destaque tipográfico sobre o rótulo, com o rótulo
  em texto menor acima, e o resultado acompanhado do selo de variação

#### AC-239 — Nenhum indicador promete comparação que não existe

- **Dado** que o produto não guarda série histórica (ADR-010)
- **Quando** um cartão de indicador é exibido
- **Então** ele não apresenta comparação com período anterior nem miniatura de
  evolução

### US-065 — Reconhecer os ativos das movimentações

Como investidor, quero identificar os ativos das últimas movimentações pelo
símbolo visual, para que eu localize o que me interessa sem ler linha por linha.

#### AC-240 — Movimentação mostra o ativo com monograma

- **Dado** uma movimentação recente na lista
- **Quando** ela é exibida
- **Então** traz o monograma do ativo ao lado do ticker, e o tipo da operação
  como selo com texto

#### AC-241 — Painel sem carteira convida ao próximo passo

- **Dado** um investidor que ainda não tem carteira ou operação
- **Quando** o painel é exibido
- **Então** apresenta o estado vazio com a explicação e a ação seguinte, em vez
  de blocos vazios

## Fora de escopo

- Qualquer mudança no que a barra de mercado busca ou em sua frequência: segue
  sendo o mesmo dado, do mesmo jeito (ADR-005, sem polling).
- Gráficos do desempenho — feature `repaginacao-desempenho`.
- Ordenação e paginação de tabelas — feature `repaginacao-tabelas`.
- Celebração com `balloons-js`: adiada para depois desta rodada, para não
  misturar efeito com repaginação estrutural.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-055 | A barra tem poucos itens (5 a 8), então duplicar a lista uma vez basta para o loop parecer contínuo | aberta | — |
| ASM-056 | Parar a rolagem no `:hover` é suficiente para leitura confortável, sem precisar de botão de pausa explícito | aberta | — |
| ASM-057 | As primitivas da `fundacao-visual` (cartão, selo, monograma, estado vazio) cobrem o painel sem ajuste | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-029 | Quanto tempo deve levar uma volta completa da barra? | respondida | Velocidade constante de ~40 pixels por segundo, não duração fixa: com duração fixa, mais itens fariam a barra acelerar. A volta se ajusta sozinha à largura do conteúdo. Decidido pelo agente; fácil de ajustar num token |
