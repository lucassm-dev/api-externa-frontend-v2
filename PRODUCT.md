# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Um único perfil: **o investidor**. Não existe administrador, back-office nem
cliente indireto — quem cadastra é quem opera é quem analisa.

O investidor-alvo já investe: tem conta em corretora, já comprou ação, entende
preço médio, rentabilidade e a diferença entre lucro realizado e não realizado.
Ele tolera — e prefere — tela densa de números a onboarding guiado com
ilustração. O iniciante curioso é atendido por consequência, e não dirige
nenhuma decisão de interface.

Situação de uso: sessões curtas de conferência ("a tese que montei está dando
certo?"), repetidas com dias ou semanas de intervalo. A partir desta
repaginação, essas sessões acontecem também no celular — em pé, no intervalo,
com uma mão — e não só na mesa de trabalho.

## Product Purpose

Aplicação web onde o investidor monta carteiras hipotéticas de ações, registra
compras e vendas a preço de mercado e acompanha como essas carteiras se
comportam. Nada de dinheiro real: sem saldo, depósito, ordem enviada a
corretora ou custódia espelhada.

O produto responde a uma pergunta só: **"o que aconteceria se eu montasse esta
carteira?"**

Sucesso é o investidor chegar da primeira tela até a primeira compra registrada
sem abandonar, criar uma segunda carteira, e ainda estar consultando a carteira
30 dias depois.

## Positioning

Planilha não atualiza preço sozinha. As ferramentas de mercado analisam ativos
individuais, não uma carteira montada agora. O mecanismo próprio deste produto
é juntar **carteira hipotética + preço de mercado real + histórico de
movimentações** num lugar só, de graça, sem exigir dinheiro em risco para
testar uma tese.

## Operating Context

O produto tem uma ordem de entrada obrigatória, herdada do domínio (ADR-003):

```
cadastro → login → painel inicial (vazio)
   → cadastrar corretora → criar carteira → cadastrar ação no catálogo
   → registrar compra → acompanhar desempenho
```

O painel de um investidor novo é uma tela vazia, e a tela vazia é uma feature:
ela conduz ao próximo passo. A tela de desempenho é o destino do fluxo — é onde
o valor do produto é entregue, e é a tela que o investidor reabre semanas
depois.

## Capabilities and Constraints

Três verdades do produto atravessam todas as telas e nenhuma pode ser escondida:

1. **O preço na tela não é ao vivo.** Toda cotação vem com o momento em que foi
   obtida. Número sem hora é tela incompleta (ADR-005).
2. **A rentabilidade ignora dividendos e JCP.** O produto não tem esse dado, e
   isso é dito na tela de desempenho, não num rodapé.
3. **Fonte externa cai e a tela continua.** Dado externo que falha vira último
   valor conhecido mais aviso, nunca tela de erro (ADR-006).

Restrições técnicas duráveis:

- **Sem série histórica** (ADR-010). Não existe evolução ao longo do tempo,
  rentabilidade por mês, nem comparação com índice ou com período anterior.
  Todo gráfico é retrato do agora. Isso não é lacuna a preencher: é a fronteira
  do que o produto pode afirmar com honestidade.
- **Consultas paginadas e sem filtro** (ADR-010). O recorte é do cliente.
- **Uma carteira por vez** na tela de desempenho; o backend consolida por
  carteira, e somar no frontend produziria número que não bate com nenhuma
  outra tela.
- **Tudo em real**, com posições em dólar convertidas pela taxa corrente; a
  taxa e o horário dela fazem parte do número (ADR-004).
- **Erro é tratado por código, nunca por texto** (ADR-009).
- **Cor vem só de token**, em `src/styles/_tokens.scss`, nos dois temas (P-003).
- Angular 22 standalone, Angular Material, SCSS por componente, Vitest.
  Gráficos em SVG próprio, sem biblioteca de gráficos (RFC-001).

Fora de escopo: ordem real, custódia, backtest em data passada, proventos,
apuração de IR, venda a descoberto, recomendação de investimento, qualquer
ativo que não seja ação, administração de outros investidores.

Terminologia fixa: valor investido, valor de mercado, resultado não realizado,
resultado realizado. Não realizado e realizado **nunca aparecem somados num
único número**.

## Brand Commitments

- **Idioma único pt-BR**, sem infraestrutura de tradução. Real e dólar em
  formatação brasileira, com o símbolo distinguindo os dois.
- **Tema claro e escuro, ambos obrigatórios.** Nenhuma informação depende só de
  cor: ganho e perda têm sinal ou seta além da cor, dado defasado tem marcação
  além da cor.
- **Referências visuais fixadas pelo usuário** em `docs/references/`:
  `imagem-base.webp` (mandante), `exemplo-de-graficos.webp`,
  `exemplo-de-dashboards.webp`, `exemplo-de-tabelas.webp`. A direção escolhida
  é a da `imagem-base`: acento amarelo elétrico sobre superfícies escuras
  profundas — que o produto já ecoa em `--cor-destaque: #eaef1b`.
- Nome do produto na casca: "Carteira".

## Evidence on Hand

- `docs/prd/PRD-001..009` — visão e features, com decisões `[D]` datadas.
- `docs/adr/001..010` — decisões de arquitetura vinculantes.
- `docs/rfc/RFC-001` (estratégia de UI e bibliotecas), `RFC-002`.
- `.spec/` — 13 features especificadas com critérios de aceite provados por
  teste, e uma constituição de princípios verificáveis mecanicamente.
- `docs/references/` — capturas de produtos de terceiros (Investidor10,
  StatusInvest) e as quatro referências de estilo acima.

Não existem: depoimentos, clientes, números de adoção, preço ou licenciamento.
Nada disso pode ser inventado em tela.

## Product Principles

1. **Número sem contexto é mentira.** Toda cotação carrega horário, toda
   conversão carrega taxa, todo total que não fecha carrega a ressalva.
2. **A tela confessa o que não sabe.** Dividendos ausentes, cotação defasada e
   câmbio velho aparecem onde o número é lido, não em ajuda.
3. **Densidade a serviço da leitura.** A persona quer muitos números; a
   hierarquia — e não o corte de informação — é o que os torna legíveis.
4. **Nenhum bloco promete o que o domínio não tem.** Sem eixo de tempo, sem
   miniatura de tendência, sem comparação com período anterior.
5. **Cor acompanha, nunca carrega.** Todo dado codificado por cor também existe
   em texto, sinal ou forma.

## Accessibility & Inclusion

Contraste e legibilidade verificados nos dois temas. Nada comunicado só por
cor. Paleta de séries com ordem fixa e validação para daltonismo. Interações de
gráfico têm equivalente em texto, e o movimento da barra de cotações respeita
`prefers-reduced-motion`. A partir desta repaginação, o piso de tela é 360px:
alvos de toque e navegação precisam funcionar com uma mão.
