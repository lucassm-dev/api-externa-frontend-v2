# Spec: Estrutura visual

> feature: estrutura-visual
> status: implementada

## Contexto

Na revisão visual (#42), a área logada não tinha coluna central: o conteúdo ocupava a
janela toda e as páginas estreitas (Minha conta e formulários) ficavam presas à esquerda.
Em tela larga, listas e tabelas se esticavam, e Operações misturava larguras. O campo de
foto aparecia como o seletor de arquivo cru do navegador.

Pedido do Lucas em 26/11/2026: "deixa mais bonito, mais harmonico, mais estruturado - a
parte de minha conta esta tudo pra esquerda o certo era ficar no meio". Escopo decidido
por ele no mesmo dia (Q-052). Issue #44.

Refinamento, não redesenho: a identidade visual (acento amarelo sobre superfícies escuras,
PRODUCT.md) fica como está.

## Histórias

### US-104 — Ler a área logada numa coluna central

Como usuário, quero o conteúdo numa coluna central de largura contida, para que listas,
tabelas e formulários não se espalhem pela tela larga nem fiquem colados à esquerda.

#### AC-376 — A área logada tem uma coluna central alinhada com a barra do topo

- **Dado** qualquer tela da área logada
- **Quando** a janela é mais larga que a coluna (`--largura-pagina`, 1280px)
- **Então** o conteúdo fica centralizado e não passa dessa largura, e o conteúdo da barra
  do topo começa e termina nas mesmas bordas

#### AC-377 — Minha conta e os formulários ficam no centro da coluna

- **Dado** Minha conta, nova carteira, nova corretora, cadastrar ação ou novo administrador
- **Quando** a página abre
- **Então** ela aparece centralizada na coluna, na largura própria dela

### US-105 — Telas que falam a mesma língua do kit

Como usuário, quero que os controles sigam o mesmo desenho do resto do produto, para que
nada pareça montado às pressas.

#### AC-378 — Escolher foto é um botão do kit

- **Dado** a seção Foto de Minha conta
- **Quando** ela aparece
- **Então** escolher o arquivo é um botão do kit ("Escolher foto", ou "Trocar foto" quando
  já há foto), com o campo de arquivo nativo dentro dele e a dica ligada ao campo

#### AC-379 — Filtros do extrato num cartão e tabela de usuários na largura da coluna

- **Dado** o extrato de Operações e a lista de Usuários
- **Quando** as telas aparecem
- **Então** os filtros do extrato ficam dentro de um cartão, e a tabela de usuários ocupa
  a largura da coluna

## Fora de escopo

- Logos das ações no lugar das iniciais (issue #45, spec própria).
- Centralizar a edição de operação: ela toma o lugar do formulário dentro de Operações, e
  centralizá-la desalinharia a tela.
- Trocar fontes, cores ou a identidade visual.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-093 | 1280px de coluna cobre o produto inteiro sem cortar tabelas: a mais larga (extrato) já rola de lado sozinha quando falta espaço (AC-272) | confirmada | Conferido no navegador em 1280px e 1600px, com a API simulada (26/11/2026) |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-052 | Como centralizar e o que mais entra no acabamento? | respondida | Coluna central para tudo, com Minha conta e formulários centralizados; acabamento em Operações, Usuários, campo de foto e logos na barra de cotações (Lucas, 26/11/2026) |
