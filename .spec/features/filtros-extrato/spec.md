# Spec: Filtros no extrato

> feature: filtros-extrato
> status: implementada

## Contexto

O extrato de `/operacoes` só pagina: o AC-172 proibiu qualquer filtro porque o backend
não filtrava, e filtrar só a página carregada mentiria (ADR-010). O backend passou a
filtrar no servidor, antes da paginação, por período, ticker, carteira, tipo e resultado
(ADR-018 do backend), e o investidor quer recortar as próprias movimentações e ver quais
vendas deram lucro ou prejuízo.

Fonte: `docs/frontend/CONTRATO.md` (seção "Histórico de operações"), `docs/frontend/openapi.json`
e `docs/adr/018-filtros-no-extrato-de-operacoes.md` do `api-externa-backend-v1`, lidos em
25/11/2026. Issues #28 e #29. Escopo decidido pelo Lucas em 25/11/2026 (Q-049).

Esta spec substitui: operações AC-172. Do ADR-010 do front continua valendo só a parte de
série histórica, como no backend.

## Histórias

### US-096 — Recortar o extrato

Como investidor, quero filtrar o extrato por período, ticker, carteira e tipo, para que
eu ache as movimentações que procuro sem passar página por página.

#### ~~AC-340~~ — Os filtros vão ao servidor e se combinam (superado por relatorios, AC-395)

- **Dado** o extrato com data inicial, data final, ticker, carteira e tipo preenchidos
- **Quando** o investidor aplica os filtros
- **Então** `GET /operacoes` sai com `dataInicio`, `dataFim`, `ticker`, `carteiraId` e `tipo`
  a partir da primeira página, e a lista mostra só o que o servidor devolveu

#### AC-341 — Sem filtro, o extrato é o de sempre

- **Dado** nenhum filtro preenchido
- **Quando** o extrato carrega
- **Então** a requisição leva só `page` e `size`, como antes

#### ~~AC-342~~ — Data final antes da inicial não sai (superado por relatorios, AC-396)

- **Dado** uma data final anterior à data inicial
- **Quando** o investidor aplica os filtros
- **Então** o campo "Data final" diz que ela não pode ser anterior à inicial e nenhuma
  requisição sai; se o servidor recusar mesmo assim (`OPE-006`), o mesmo texto aparece

#### ~~AC-343~~ — O recorte mora no endereço (superado por relatorios, AC-395)

- **Dado** o endereço `/operacoes` com filtros na busca (ex.: `?ticker=PETR4&dataInicio=2026-09-01`)
- **Quando** a tela abre, o investidor troca de página ou recarrega
- **Então** os campos aparecem preenchidos, a primeira leitura já sai filtrada e a leitura
  das outras páginas leva os mesmos filtros

#### ~~AC-344~~ — O recorte diz quantas operações achou e tem saída quando não acha nada (superado por relatorios, AC-399)

- **Dado** filtros aplicados
- **Quando** o servidor responde
- **Então** a tela mostra quantas operações o recorte achou (`totalElements`); sem nenhuma,
  aparece o estado vazio do recorte com "Limpar filtros", que volta ao extrato completo

#### AC-345 — O link do detalhe da carteira continua só preenchendo o formulário

- **Dado** o link que já existe, `/operacoes?carteira=9&tipo=VENDA`
- **Quando** a tela abre
- **Então** o formulário de registro vem com a carteira e o tipo escolhidos, e o extrato
  carrega completo, sem filtro

### ~~US-097~~ — Ver o que deu lucro ou prejuízo (superado por relatorios, US-110)

Como investidor, quero filtrar as vendas que deram lucro ou prejuízo, para que eu saiba
onde ganhei e onde perdi.

#### ~~AC-346~~ — O resultado vai ao servidor junto com os outros filtros (superado por relatorios, AC-395)

- **Dado** o filtro de resultado em "Lucro" ou "Prejuízo", com ou sem outros filtros
- **Quando** o investidor aplica os filtros
- **Então** `GET /operacoes` sai com `resultado=LUCRO` ou `resultado=PREJUIZO` junto dos
  demais filtros

#### ~~AC-347~~ — A tela explica que só vendas entram no resultado (superado por relatorios, AC-395)

- **Dado** o filtro de resultado
- **Quando** o investidor olha o campo
- **Então** a dica diz que o resultado é o lucro realizado, então só vendas entram

## Fora de escopo

- Exportar o recorte para arquivo (o backend não oferece, ADR-018).
- Somar valores do recorte: o backend não devolve soma, e somar só a página carregada mentiria.
- Busca de ticker com sugestões: o campo é texto livre, como o servidor aceita.
- Série histórica (continua fora pelo ADR-010).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-084 | Na busca do endereço, os filtros usam nomes que não colidem com `carteira` e `tipo`, que já preenchem o formulário (AC-345): `dataInicio`, `dataFim`, `ticker`, `carteiraId`, `tipoOperacao` e `resultado` | confirmada | Decisão de implementação; o link do detalhe da carteira continua igual |
| ASM-085 | O ticker é enviado em maiúsculas e sem espaços nas pontas; o servidor compara o ticker como está gravado | confirmada | Tickers do catálogo são gravados em maiúsculas (ações, AC-319) |
| ASM-086 | Os filtros só valem depois de "Filtrar": digitar não dispara requisição | confirmada | Evita uma leitura por tecla; o envio é explícito como no resto do produto |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-049 | Como entram os filtros do ADR-018? | respondida | AC-172 marcado como superado; filtros no próprio extrato de `/operacoes`; recorte na URL; só a contagem do recorte, sem somas (Lucas, 25/11/2026) |
