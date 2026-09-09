# Spec: Repaginacao tabelas

> feature: repaginacao-tabelas
> status: rascunho

## Contexto

Repagina as tabelas e listas do produto — extrato de operações, posições e
movimentações da carteira, catálogo de ações e lista de corretoras. Hoje são
`<table>` semânticas sem densidade, sem ordenação, com botões de texto ocupando
metade da largura e paginação por dois botões.

A tabela continua semântica: `<table>`, `<thead>`, `<th scope>`. O que muda é a
apresentação e a ordenação, esta via `@tanstack/angular-table` (D2 do RFC-001),
que entrega a lógica sem tomar conta do HTML. O ADR-010 continua mandando: a
consulta é paginada pelo servidor e não há filtro no v1, então a ordenação vale
sobre a página exibida.

## Histórias

### US-066 — Ordenar a tabela pelo que me interessa

Como investidor, quero ordenar as colunas da tabela, para que eu encontre a
operação ou a posição que procuro sem varrer tudo.

#### AC-242 — Coluna ordenável se anuncia e responde

- **Dado** uma coluna que aceita ordenação
- **Quando** o investidor aciona o cabeçalho dela
- **Então** as linhas da página se reordenam por aquele valor, o sentido alterna
  entre crescente e decrescente, e o cabeçalho informa o sentido atual também
  para leitores de tela

#### AC-243 — Ordenar não busca de novo

- **Dado** que a consulta é paginada pelo servidor e sem filtro (ADR-010)
- **Quando** o investidor ordena uma coluna
- **Então** a ordenação acontece sobre os itens já carregados, sem nova consulta
  e sem mudar de página

### US-067 — Ler a tabela sem cansar

Como investidor, quero densidade e alinhamento adequados, para que eu compare
números entre linhas sem me perder.

#### AC-244 — Números alinhados e comparáveis

- **Dado** uma coluna de valor, quantidade ou percentual
- **Quando** a tabela é exibida
- **Então** os números aparecem alinhados à direita, em fonte de largura fixa,
  com dígitos de mesma largura entre linhas

#### AC-245 — A linha se destaca sob o ponteiro

- **Dado** uma tabela com linhas
- **Quando** o ponteiro passa sobre uma linha
- **Então** ela ganha destaque visível, e o destaque não é a única forma de
  distinguir uma linha da outra

#### AC-246 — Situação vira selo, não cor solta

- **Dado** uma célula de tipo de operação ou de resultado
- **Quando** ela é exibida
- **Então** apresenta selo com texto e sinal, nunca apenas cor

#### AC-247 — Ativo aparece com monograma

- **Dado** uma linha que se refere a um ativo
- **Quando** ela é exibida
- **Então** o monograma do ativo acompanha o ticker

### US-068 — Agir na linha sem perder a tabela de vista

Como investidor, quero acionar editar e excluir direto na linha, para que a
tabela caiba na tela e eu não perca o contexto.

#### AC-248 — Ações da linha viram ícones nomeados

- **Dado** uma linha com ações disponíveis
- **Quando** ela é exibida
- **Então** as ações aparecem como botões de ícone com nome acessível descrevendo
  a ação e o item, com área acionável de pelo menos 24 por 24 pixels

#### AC-249 — Paginação informa onde estou

- **Dado** um conjunto paginado
- **Quando** a tabela é exibida
- **Então** o rodapé informa a página atual, o total de páginas e a faixa de
  itens exibida, desabilitando os controles nas pontas

#### AC-250 — Tabela vazia e tabela carregando têm forma própria

- **Dado** uma tabela sem resultados ou ainda carregando
- **Quando** ela é exibida
- **Então** mostra respectivamente o estado vazio com próximo passo ou o
  esqueleto com a silhueta das linhas, nunca uma área em branco

## Fora de escopo

- Filtro, busca e ordenação no servidor — proibidos no v1 (ADR-010).
- Agrupamento de linhas por classe de ativo com totais no cabeçalho, como o
  Investidor10 faz: bom padrão, mas é escopo novo e não há classe de ativo no
  contrato atual.
- Seleção múltipla de linhas e ações em lote.
- Exportação de dados.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-058 | Ordenar só a página exibida atende o investidor no volume atual, já que a página tem dezenas e não milhares de itens | aberta | — |
| ASM-059 | `@tanstack/angular-table` v9 integra com signals sem camada de adaptação própria | aberta | — |
| ASM-060 | Trocar botões de texto por ícones não prejudica quem já usa o produto, dado que o nome acessível descreve a ação | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-030 | A ordenação escolhida sobrevive à troca de página e ao recarregar? | respondida | Sobrevive à troca de página (é a mesma sessão de leitura), volta ao padrão ao recarregar a tela. Guardar em armazenamento local seria estado escondido, difícil de explicar quando a tabela abre "errada". Decidido pelo agente |
| Q-031 | Quais colunas do extrato aceitam ordenação? | respondida | Todas as colunas de dado: data, carteira, tipo, ação, quantidade, preço, total e resultado. A coluna de ações não ordena. Restringir exigiria justificar cada exclusão, e o custo de permitir todas é o mesmo. Decidido pelo agente |
