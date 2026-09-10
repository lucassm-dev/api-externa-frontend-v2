# Spec: Repaginacao visual

> feature: repaginacao-visual
> status: rascunho

## Contexto

O produto está correto e apagado. Os botões são três coisas diferentes ao mesmo
tempo — `mat-flat-button`, `mat-stroked-button`, `mat-button` e `<button>` cru
no paginador, no cabeçalho ordenável e no estado vazio — então "ação primária"
não tem aparência única. Os gráficos de desempenho respondem três perguntas e
param aí. A barra de cotações ocupa a largura inteira do painel para exibir seis
chips. E o `body` tem `min-width: 1024px`: no celular o produto simplesmente não
cabe.

Esta feature repagina **ação, gráfico, largura e piso de tela**, sob a direção
visual da `docs/references/imagem-base.webp` — acento amarelo elétrico sobre
superfícies escuras profundas, que o produto já ecoa em `--cor-destaque`.

Três restrições mandam e não se negociam. O **ADR-010** proíbe série histórica:
nenhum gráfico novo pode ter eixo de tempo, tendência ou comparação com período
anterior. O **RFC-001** dispensou biblioteca de gráficos: o desenho continua em
SVG próprio. E o **P-003** proíbe cor literal fora de `_tokens.scss`.

## Histórias

### US-075 — Reconhecer a ação sem pensar

Como investidor, quero que o botão de ação tenha sempre a mesma aparência, para
que eu reconheça o que é clicável sem reaprender em cada tela.

#### AC-266 — Uma única origem para todo botão

- **Dado** qualquer template do produto com um elemento `<button>` ou com um
  link que age como botão
- **Quando** o produto é construído
- **Então** esse elemento usa o botão compartilhado do produto, e nenhum
  template restante chama `mat-flat-button`, `mat-stroked-button` ou
  `mat-button`

#### AC-267 — Quatro intenções nomeadas, e só quatro

- **Dado** o botão compartilhado
- **Quando** uma tela precisa de uma ação
- **Então** ela escolhe entre primária, secundária, sutil e destrutiva, cada uma
  com aparência própria e estável, e uma intenção desconhecida é recusada em vez
  de virar aparência padrão silenciosa

#### AC-268 — O botão mostra que está ocupado sem sumir

- **Dado** um botão em ação demorada (envio de formulário, exclusão)
- **Quando** a ação está em curso
- **Então** o botão se anuncia ocupado (`aria-busy`), fica desabilitado, mantém
  o rótulo legível e não dispara a ação uma segunda vez

#### AC-269 — O botão é alcançável por teclado e por dedo

- **Dado** um botão do produto em qualquer variante ou tamanho
- **Quando** ele recebe foco pelo teclado
- **Então** o foco é visível com contorno próprio, e a área clicável tem no
  mínimo 44px de altura nas telas de toque

### US-076 — Consultar a carteira no celular

Como investidor, quero abrir o produto no celular, para que eu confira a
carteira fora da mesa de trabalho.

#### AC-270 — Nada exige rolagem horizontal a 360px

- **Dado** uma tela de 360px de largura
- **Quando** qualquer área do produto é exibida
- **Então** o documento não impõe largura mínima maior que a tela, e nenhum
  bloco de conteúdo estoura a horizontal

#### AC-271 — A navegação vira menu compacto na tela estreita

- **Dado** uma tela abaixo de 768px
- **Quando** a casca é exibida
- **Então** as áreas do produto ficam atrás de um botão de menu que anuncia seu
  estado (`aria-expanded`), abre e fecha por teclado, e fecha ao navegar

#### AC-272 — Tabela larga rola dentro do próprio bloco

- **Dado** uma tabela mais larga que a tela
- **Quando** ela é exibida
- **Então** a rolagem acontece dentro do bloco da tabela, e a região rolável é
  alcançável por teclado com nome acessível — a página não rola de lado

#### AC-273 — Os gráficos empilham sem perder a legenda

- **Dado** a tela de desempenho a 360px
- **Quando** os gráficos são exibidos
- **Então** eles ficam em coluna única, cada um mantendo legenda e valores em
  texto legível, sem corte nem sobreposição

### US-077 — Ler as cotações sem que elas dominem o topo

Como investidor, quero que a faixa de cotações seja fina, para que o topo do
painel continue sendo sobre a minha carteira.

#### AC-274 — A faixa é fina, e atravessa o painel inteiro

- **Dado** o painel em tela larga
- **Quando** a barra de cotações é exibida
- **Então** ela acompanha a largura do painel, sem teto próprio, e sua espessura
  vem de um token menor que o alvo de toque — mais fina que qualquer cartão de
  conteúdo —, mantendo visível o horário da última atualização

#### AC-275 — A faixa continua inteira na tela estreita

- **Dado** uma tela de 360px
- **Quando** a barra de cotações é exibida
- **Então** ela ocupa a largura disponível sem estourar a horizontal nem impor
  largura mínima, e o movimento continua respeitando `prefers-reduced-motion`

### US-078 — Explorar a carteira, não só olhar

Como investidor, quero gráficos que respondam a mais perguntas e reajam a mim,
para que eu investigue a carteira em vez de apenas ler um resumo.

#### AC-276 — Mapa de blocos das posições

- **Dado** uma carteira com posições abertas
- **Quando** o mapa de blocos é exibido
- **Então** cada ativo aparece como um bloco de área proporcional ao seu valor
  de mercado, com ticker, valor e participação em texto no próprio bloco ou em
  legenda, e a cor indica o sinal do resultado sem ser a única pista dele

#### AC-277 — Investido ao lado do valor de mercado

- **Dado** as posições abertas de uma carteira
- **Quando** o bloco de investido × mercado é exibido
- **Então** cada ticker traz duas barras num eixo comum — custo e valor de hoje
  — e a diferença entre elas aparece em texto, com sinal

#### AC-278 — Quadrante de participação e rentabilidade

- **Dado** as posições abertas de uma carteira
- **Quando** o quadrante é exibido
- **Então** cada ativo é uma bolha posicionada pela participação na carteira e
  pela rentabilidade, com os dois eixos rotulados, a linha de rentabilidade zero
  marcada, e os mesmos dados disponíveis em texto

#### AC-279 — Medidor de concentração

- **Dado** uma carteira com posições abertas
- **Quando** o medidor é exibido
- **Então** ele mostra que fatia da carteira está nos três maiores ativos, com o
  percentual em texto e a explicação do que a faixa significa

#### AC-280 — Todo gráfico novo responde ao teclado

- **Dado** qualquer gráfico novo do desempenho
- **Quando** o investidor percorre seus elementos pelo teclado
- **Então** cada elemento recebe foco visível e revela o mesmo detalhe que o
  ponteiro revelaria, em texto, e Esc devolve o gráfico ao estado de repouso

#### AC-281 — Nenhum gráfico novo inventa passado

- **Dado** que o produto não guarda série histórica (ADR-010)
- **Quando** qualquer gráfico novo é exibido
- **Então** não há eixo de tempo, miniatura de tendência nem comparação com
  período anterior

### US-079 — Sentir que o produto tem dono

Como investidor, quero uma interface com identidade e vida, para que usar o
produto seja agradável e não pareça um formulário administrativo.

#### AC-282 — O acento de marca entra com contraste aprovado

- **Dado** os dois temas obrigatórios
- **Quando** o acento de marca é usado em superfície, texto ou selo
- **Então** o par texto/fundo atinge o contraste mínimo da WCAG AA nos dois
  temas, e nenhuma cor literal aparece fora de `_tokens.scss`

#### AC-283 — A hierarquia tipográfica é declarada, não improvisada

- **Dado** a escala de tipos do produto
- **Quando** uma tela apresenta título, rótulo, valor e apoio
- **Então** cada um usa um degrau nomeado da escala em token, os valores
  numéricos usam a fonte tabular, e o produto não passa de duas famílias

#### AC-284 — Movimento é convite, nunca obstáculo

- **Dado** qualquer transição ou animação introduzida por esta repaginação
- **Quando** o sistema pede movimento reduzido
- **Então** a animação é suprimida, e nenhuma animação anima propriedade de
  layout

## Fora de escopo

- Série histórica, eixo de tempo, tendência e comparação de período: ADR-010.
- Biblioteca de gráficos: o desenho continua em SVG próprio (RFC-001).
- Mudar o cálculo de composição, contribuição, realizado ou consolidado — só a
  apresentação.
- Trocar a ordem das cores de série já validadas para daltonismo.
- Comparação entre carteiras (v2, PRD-008).
- Reescrever as tabelas: elas ganham rolagem contida, não nova arquitetura.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-067 | Substituir os botões do Angular Material por um botão próprio do produto não quebra o comportamento de formulário e de diálogo que hoje depende do Material | aberta | — |
| ASM-068 | Um mapa de blocos desenhado à mão em SVG (divisão recursiva por faixas) atende no volume de ativos de uma carteira típica, sem biblioteca | aberta | — |
| ASM-069 | O piso de 360px não exige reescrever a tabela: rolagem contida no bloco basta para as colunas largas | aberta | — |
| ASM-070 | Os dois erros que o motor de UI acusa hoje (`A03` em botao-icone, `A01` em monograma) são falso-positivo de binding dinâmico do Angular (`[attr.aria-label]`, `[alt]`) e cabem em exceção declarada, não em correção de código | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-035 | A decisão `[D]` "desktop apenas no v1" do PRD-001 fica revogada? | respondida | Sim. O piso passa a ser 360px, com celular real: `min-width` global removido, navegação compacta na casca, tabelas com rolagem contida e gráficos em coluna. Decidido pelo usuário |
| Q-036 | Qual das quatro referências manda na direção visual? | respondida | A `imagem-base.webp`: acento amarelo elétrico sobre superfícies escuras profundas, cartões de raio grande, números em fonte tabular. É a única que o produto já ecoa, em `--cor-destaque: #eaef1b`. Decidido pelo usuário |
| Q-037 | Quais gráficos novos entram no desempenho? | respondida | Os quatro propostos: mapa de blocos, investido × valor de mercado, quadrante participação × rentabilidade e medidor de concentração. Todos sem eixo de tempo. Decidido pelo usuário |
