# Spec: Moeda das posições na carteira

> feature: moeda-na-carteira
> status: implementada

## Contexto

A ASM-025 (carteiras) supunha que `GET /carteiras/{id}/posicoes` chega em real. O código
do backend (`ConsultaOperacaoService.posicoes`) mostra o contrário: preço médio, cotação e
resultado não realizado vêm na moeda da ação, sem conversão e sem campo de moeda; só o
consolidado e o lucro realizado vêm em real. O Desempenho já tratava isso (ASM-044); o
detalhe da carteira escrevia tudo com "R$". Visto na revisão contra o backend real (#42):
AAPL a US$ 355,45 aparecia como "R$ 355,45". Issue #62, achada na triagem das suposições
pedida pelo Lucas em 27/11/2026.

## Histórias

### US-109 — Ver cada posição na moeda em que ela foi comprada

Como investidor, quero ver preço médio, cotação e resultado de cada posição na moeda da
ação, para que eu não leia dólar como real.

#### AC-391 — Posição em ação americana aparece em dólar

- **Dado** uma posição em ação cuja moeda no catálogo é `USD`
- **Quando** o detalhe da carteira mostra as posições abertas
- **Então** preço médio, cotação e resultado não realizado aparecem com "US$"

#### AC-392 — Posição em ação brasileira continua em real

- **Dado** uma posição em ação cuja moeda no catálogo é `BRL`
- **Quando** o detalhe da carteira mostra as posições abertas
- **Então** os valores aparecem com "R$", como antes

#### AC-393 — Sem saber a moeda, o valor aparece sem símbolo

- **Dado** uma posição cujo ticker o catálogo não informou (ou o catálogo não carregou)
- **Quando** o detalhe da carteira mostra as posições abertas
- **Então** os valores aparecem sem símbolo de moeda, em vez de afirmar real

## Fora de escopo

- Converter as posições para real no detalhe da carteira: os totais do cabeçalho já vêm em
  real do consolidado, e a linha mostra o que o investidor pagou, na moeda em que pagou.
- O resultado realizado das posições encerradas: ele vem do lucro realizado, que já é em real.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-098 | A moeda de cada posição é a da ação no catálogo (`GET /acoes`), casada por ticker, como no Desempenho (ASM-045) | confirmada | `moeda-das-posicoes.ts`, usado pelo Desempenho desde a repaginação |

## Perguntas em aberto

Nenhuma.
