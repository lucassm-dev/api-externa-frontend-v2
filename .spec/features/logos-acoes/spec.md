# Spec: Logos das ações

> feature: logos-acoes
> status: implementada

## Contexto

As ações aparecem com um monograma de iniciais (PE, VA, IT) em Ações, Carteira,
Operações e Painel (AC-218). O backend já usa os logos da brapi na barra de cotações
(`logoUrl` em `/mercado/barra-cotacoes`), e o front ignorava esse campo.

Pedido do Lucas em 26/11/2026: "quero que nas acoes venha a imagem da acao ou algum icone
bonito, nao as letras". Fonte e reserva decididas por ele no mesmo dia (Q-053). Issue #45.

Esta spec substitui: fundacao-visual AC-218 (monograma de iniciais). AC-219 (cor estável
por ativo) e AC-220 (o ticker é anunciado) continuam valendo.

## Histórias

### US-106 — Reconhecer o ativo pela marca

Como investidor, quero ver o logo da empresa ao lado do ticker, para que eu localize o
ativo de olho, sem ler ticker por ticker.

#### AC-380 — O ativo mostra o logo da empresa

- **Dado** um ativo exibido em lista, tabela ou cartão
- **Quando** ele aparece
- **Então** a imagem vem de `https://icons.brapi.dev/icons/{TICKER}.svg`, com o ticker em
  maiúsculas; a imagem é decorativa e o ticker é anunciado pelo elemento que a contém

#### AC-381 — Sem logo, um ícone na cor do ativo, nunca letras

- **Dado** um ativo cujo logo não carrega (não existe ou a fonte falhou)
- **Quando** a imagem falha
- **Então** aparece um ícone de gráfico na cor da série do ativo, sem nenhuma letra, e um
  ticker diferente volta a tentar o logo

#### AC-382 — A barra de cotações mostra o logo que o backend manda

- **Dado** a barra de cotações do painel
- **Quando** um item vem com `logoUrl`
- **Então** o logo aparece antes do símbolo, como imagem decorativa; sem `logoUrl`, ou se
  ele falhar, o item mostra só o texto

## Fora de escopo

- Hospedar os logos no próprio produto: a fonte é a mesma que o backend já usa.
- Logo de corretora.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-094 | `icons.brapi.dev/icons/{TICKER}.svg` cobre os tickers do catálogo, brasileiros e americanos, e responde 404 para o que não conhece | confirmada | Testado em 26/11/2026: PETR4, VALE3, ITUB4, BBAS3 e AAPL respondem 200 com SVG; XXXX9 responde 404 |
| ASM-095 | Carregar o logo de um serviço externo revela à brapi só o ticker exibido, e o produto já depende dela pela barra de cotações | confirmada | `ItemBarraCotacoesDTO.logoUrl` do backend usa a mesma fonte |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-053 | De onde vem o logo e o que aparece sem ele? | respondida | Logo da brapi (mesma fonte do backend), com ícone de gráfico na cor da série quando não houver logo; logos também na barra de cotações (Lucas, 26/11/2026) |
