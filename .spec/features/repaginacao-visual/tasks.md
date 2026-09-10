# Tasks: Repaginacao visual

> feature: repaginacao-visual

## T-112 — Tokens da direção visual [concluida]
- Refs: US-079, AC-282, AC-283
- Arquivos: src/styles/_tokens.scss, src/styles/_tema.scss, src/styles/tokens.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: base de tudo — nenhuma outra tarefa desenha antes desta. Aplica a direção
  da `imagem-base.webp`: acento amarelo elétrico com par texto/fundo aprovado nos
  dois temas, superfícies escuras mais profundas, escala tipográfica nomeada
  (título/valor/rótulo/apoio) com fonte tabular para número, raios maiores,
  sombras de cartão e a largura máxima da faixa de cotações. A paleta de séries
  ganha saturação, mas **não muda de ordem** — a fatia de um ativo não pode trocar
  de cor. Fim do `--largura-minima-app`: o token vira largura de conteúdo, não
  piso de janela.

## T-113 — Botão único do produto [concluida]
- Refs: US-075, AC-267, AC-268, AC-269
- Arquivos: src/app/shared/botao/botao.ts, src/app/shared/botao/botao.html, src/app/shared/botao/botao.scss, src/app/shared/botao/botao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: um componente só, com quatro intenções nomeadas — primária, secundária,
  sutil e destrutiva — e dois tamanhos. Intenção desconhecida é recusada, não
  virada em padrão silencioso (AC-267). Os seis estados existem de verdade:
  repouso, ponteiro, foco visível com contorno próprio, desabilitado, ocupado
  (`aria-busy`, sem disparo duplo) e destrutivo confirmado. Altura mínima de 44px
  onde há toque (AC-269). Cor só de token.

## T-114 — Migrar todo template para o botão único [pendente]
- Refs: US-075, AC-266
- Arquivos: src/app/layout/casca.html, src/app/shared/paginador/paginador.html, src/app/shared/confirmacao/dialogo-confirmacao.html, src/app/shared/estado-vazio/estado-vazio.html, src/app/shared/tabela/cabecalho-ordenavel.html, src/app/features/acesso/login/login.html, src/app/features/acesso/cadastro/cadastro.html, src/app/features/carteiras/lista/lista-carteiras.html, src/app/features/carteiras/criacao/criar-carteira.html, src/app/features/carteiras/detalhe/detalhe-carteira.html, src/app/features/carteiras/detalhe/movimentacoes-carteira.html, src/app/features/corretoras/lista/lista-corretoras.html, src/app/features/corretoras/cadastro/cadastro-corretora.html, src/app/features/corretoras/detalhe/detalhe-corretora.html, src/app/features/acoes/lista/lista-acoes.html, src/app/features/acoes/cadastro/cadastro-acao.html, src/app/features/acoes/detalhe/detalhe-acao.html, src/app/features/operacoes/formulario/formulario-operacao.html, src/app/features/operacoes/edicao/editar-operacao.html, src/app/shared/botao/padrao-unico.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: a T-113 JÁ ESTÁ PRONTA em `src/app/shared/botao/botao.ts`. É um componente
  de seletor de atributo, `button[appBotao], a[appBotao]`: importe `Botao` no
  componente e troque `mat-flat-button` por `appBotao intencao="primaria"`,
  `mat-stroked-button` por `appBotao intencao="secundaria"`, `mat-button` por
  `appBotao intencao="sutil"` e as ações de remover/excluir por
  `intencao="destrutiva"`. Os `<button>` crus (paginador, cabeçalho ordenável,
  estado vazio) também passam a usá-lo, com `tamanho="compacto"` onde a linha é
  densa. `[disabled]="x"` vira `[desabilitado]="x"`, e onde a espera é de rede
  use `[ocupado]="enviando()"` — ele já desabilita, anuncia `aria-busy` e mantém
  o rótulo. **Preserve cada `data-*`**: são os seletores que os testes das outras
  features usam para achar o botão, e quebrá-los derruba specs alheias. Rode a
  suíte inteira, não só a sua. A prova do AC-266 é um teste em
  `src/app/shared/botao/padrao-unico.spec.ts` que varre os templates: nenhuma
  diretiva de botão do Material sobrou, e todo `<button>` de tela tem `appBotao`.

## T-115 — Casca responsiva com menu compacto [concluida]
- Refs: US-076, AC-270, AC-271
- Arquivos: src/styles.scss, src/app/layout/casca.ts, src/app/layout/casca.scss, src/app/layout/casca.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: remove o `min-width` global do `body` — é ele que hoje impede o produto de
  caber em 360px (AC-270). Abaixo de 768px as áreas do produto vão para trás de um
  botão de menu com `aria-expanded`, que abre e fecha por teclado e fecha ao
  navegar (AC-271). O `casca.html` é da T-114; aqui mexe-se em lógica e estilo.

## T-116 — Tabela com rolagem contida [concluida]
- Refs: US-076, AC-272
- Arquivos: src/app/shared/tabela/tabela.scss, src/app/shared/tabela/tabela.spec.ts, src/app/shared/tabela/rolagem-contida.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: a rolagem horizontal fica dentro do bloco da tabela, com a região rolável
  alcançável por teclado e com nome acessível — a página nunca rola de lado.
  Referência de forma: a barra de rolagem própria da tabela em
  `docs/references/exemplo-de-tabelas.webp`.

## T-117 — Barra de cotações contida [concluida]
- Refs: US-077, AC-274, AC-275
- Arquivos: src/app/features/painel/blocos/barra-mercado.html, src/app/features/painel/blocos/barra-mercado.scss, src/app/features/painel/blocos/barra-mercado.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: o que incomoda é a ESPESSURA, não o comprimento — a faixa deve atravessar
  o painel inteiro, como a faixa de ETH/SOL no topo da `imagem-base.webp`, e ser
  fina o bastante para não competir com os cartões. A altura vem do token
  `--altura-cotacoes`, os chips perdem moldura e caixa e viram só texto, e o
  horário da última atualização continua visível (é verdade de produto, não
  enfeite). A 360px ocupa a largura disponível sem estourar, e
  `prefers-reduced-motion` continua parando o movimento.

## T-118 — Mapa de blocos das posições [concluida]
- Refs: US-078, AC-276, AC-280, AC-281
- Arquivos: src/app/features/desempenho/blocos/blocos-do-mapa.ts, src/app/features/desempenho/blocos/blocos-do-mapa.spec.ts, src/app/features/desempenho/blocos/grafico-mapa-posicoes.ts, src/app/features/desempenho/blocos/grafico-mapa-posicoes.html, src/app/features/desempenho/blocos/grafico-mapa-posicoes.scss, src/app/features/desempenho/blocos/grafico-mapa-posicoes.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: geometria pura primeiro (divisão recursiva por faixas, testável sozinha),
  componente depois. Área proporcional ao valor de mercado, cor pelo sinal do
  resultado — e ticker, valor e participação em texto, porque cor não carrega
  informação sozinha. Cada bloco é focável e revela no teclado o mesmo detalhe do
  ponteiro (AC-280). Sem eixo de tempo (AC-281).

## T-119 — Investido × valor de mercado [concluida]
- Refs: US-078, AC-277, AC-280, AC-281
- Arquivos: src/app/features/desempenho/blocos/grafico-investido-mercado.ts, src/app/features/desempenho/blocos/grafico-investido-mercado.html, src/app/features/desempenho/blocos/grafico-investido-mercado.scss, src/app/features/desempenho/blocos/grafico-investido-mercado.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: duas barras por ticker num eixo comum — custo e valor de hoje — com a
  diferença em texto e com sinal. É o ganho embutido sem inventar linha do tempo.
  Focável por ticker, detalhe em texto no foco (AC-280).

## T-120 — Quadrante participação × rentabilidade [concluida]
- Refs: US-078, AC-278, AC-280, AC-281
- Arquivos: src/app/features/desempenho/blocos/grafico-quadrante.ts, src/app/features/desempenho/blocos/grafico-quadrante.html, src/app/features/desempenho/blocos/grafico-quadrante.scss, src/app/features/desempenho/blocos/grafico-quadrante.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: bolha por ativo — X é quanto pesa na carteira, Y é como está indo, o
  tamanho é o valor de mercado. Eixos rotulados e linha de rentabilidade zero
  marcada, para que o quadrante de baixo-e-grande (o peso morto) seja legível. Os
  mesmos dados existem em texto, e cada bolha é focável (AC-280).

## T-121 — Medidor de concentração [concluida]
- Refs: US-078, AC-279, AC-281
- Arquivos: src/app/features/desempenho/blocos/concentracao-da-carteira.ts, src/app/features/desempenho/blocos/concentracao-da-carteira.spec.ts, src/app/features/desempenho/blocos/grafico-concentracao.ts, src/app/features/desempenho/blocos/grafico-concentracao.html, src/app/features/desempenho/blocos/grafico-concentracao.scss, src/app/features/desempenho/blocos/grafico-concentracao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: cálculo puro (participação dos três maiores) separado do arco. Forma de
  referência: o medidor "financial health" do `exemplo-de-dashboards.webp` —
  arco, valor grande no centro, faixa de referência explicada em texto. O que a
  faixa significa fica escrito: o produto não recomenda investimento, então o
  medidor descreve concentração, não aprova nem reprova a carteira.

## T-122 — Grade responsiva do desempenho [concluida]
- Refs: US-076, US-078, AC-273
- Arquivos: src/app/features/desempenho/desempenho.html, src/app/features/desempenho/desempenho.scss, src/app/features/desempenho/desempenho.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: depende das T-118 a T-121 — é onde os quatro gráficos novos entram na
  tela. Grade que respira em tela larga e vira coluna única a 360px, cada gráfico
  mantendo legenda e valores legíveis, sem corte nem sobreposição (AC-273).

## T-123 — Movimento com freio [concluida]
- Refs: US-079, AC-284
- Arquivos: src/styles/movimento.spec.ts, .onp-uiux.json
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: teste-sentinela que varre as folhas de estilo do produto: toda
  `@keyframes`/`transition` introduzida tem bloco `prefers-reduced-motion`, e
  nenhuma anima propriedade de layout (só `transform` e `opacity`). O
  `.onp-uiux.json` declara a exceção da ASM-070 com justificativa escrita — os
  dois erros que o motor de UI acusa hoje são binding dinâmico do Angular, não
  falta de nome acessível.
