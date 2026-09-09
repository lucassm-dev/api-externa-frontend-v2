# Direção de design — intencionalidade antes de pixels

O objetivo deste arquivo é impedir a interface genérica: aquela que serve para
qualquer produto e por isso não serve para nenhum. Leia antes de escrever o
primeiro token.

## O teste da assinatura

Antes de codar, complete a frase: **"Esta interface é reconhecível porque
___."** Respostas válidas citam o produto ou o público: "porque o placar de
contraste aparece como elemento de marca", "porque a tipografia serifada
pesada ecoa material didático impresso", "porque o verde-menta dos rótulos de
preço vem da identidade da feira". Respostas inválidas: "porque é limpa",
"porque é moderna", "porque usa gradiente roxo". Se a sua resposta serve para
qualquer projeto, você ainda não tem direção — não comece.

## Os três clichês de IA (proibidos por padrão)

1. **Creme + serifa + "elegância" difusa** para tudo que soa sofisticado.
2. **Fundo escuro + acento neon/roxo + glassmorphism** para tudo que soa tech.
3. **Hero com número gigante + label pequena + 3 cards de features** como
   abertura de qualquer landing.

Qualquer um deles pode ser usado — **desde que você justifique com o
produto**, não com o hábito. Sem justificativa escrita, escolha outra direção.

## Hierarquia: o olho tem UMA primeira parada

- Cada tela tem um elemento dominante — decidido por você, não pelo acaso.
  Feche os olhos, abra a tela: para onde o olho vai? Se a resposta for "para
  três lugares", não há hierarquia.
- Tamanho, peso, cor e espaço são o orçamento de destaque. Gaste em UM lugar
  por tela. Dois "heróis" = nenhum herói.
- Texto de apoio existe para ser ignorável: menor, mais suave (`--texto-suave`),
  nunca competindo em peso com o conteúdo.
- Agrupamento por proximidade > por caixas. Antes de adicionar borda ou card,
  teste se espaçamento resolve. Interface com moldura em tudo é ruído.

## Espaço em branco é material de construção

- O espaçamento entre seções deve ser visivelmente maior que dentro delas
  (ex.: 64–96px entre seções, 16–24px entre elementos internos). É essa
  diferença que cria estrutura sem linhas.
- Densidade é decisão de produto: painel de operação pede denso (mais dados
  por tela); landing pede ar (uma ideia por dobra). Não misture os regimes na
  mesma tela.
- Alinhe a uma grade real (12 colunas / gutter fixo) e a violações
  intencionais dê o dobro de destaque — desalinhado por descuido parece erro,
  desalinhado com convicção parece design.

## Cor com papel definido

- Cada cor da paleta tem UM papel nomeado (fundo, superfície, texto, apoio,
  acento, feedback). Cor sem papel não entra.
- Semânticas (sucesso/erro/aviso) são adicionais ao acento, não substitutas:
  erro `#B91C1C`, sucesso `#15803D`, aviso `#B45309` sobre claro — sempre
  acompanhadas de texto/ícone (cor sozinha não comunica — WCAG 1.4.1).
- Gradiente: no máximo um por tela, entre vizinhos de matiz (não arco-íris),
  e nunca atrás de texto longo.

## Motion com propósito

- Animação responde à pergunta "o que mudou?" — entrada de item, troca de
  estado, confirmação. Animação "para dar vida" é o caminho mais curto para
  parecer template.
- Interação: 100–250ms, `ease-out`. Transições de layout/página: 200–400ms.
  Acima de 500ms o usuário espera; acima de 800ms ele culpa o app.
- Orquestre UM momento memorável (ex.: o card do resultado que sobe com
  spring) e deixe o resto discreto. Dez micro-animações espalhadas < uma
  sequência bem regida.
- Tudo dentro de `@media (prefers-reduced-motion: reduce)` → desligado ou
  reduzido a opacity. O motor cobra (M01/M04).

## Conteúdo é interface

- Botão diz o resultado: "Salvar inscrição", "Gerar boleto" — nunca "OK",
  "Enviar", "Continuar" quando há alternativa específica.
- Erro tem 3 partes: o que houve, por quê (se ajudar) e o que fazer agora.
  "CPF inválido — confira os 11 dígitos" > "Erro no campo".
- Estado vazio é a primeira impressão do usuário novo: diga o que este espaço
  mostrará e ofereça a primeira ação. Ilustração é opcional; o próximo passo
  não é.
- Números em tabelas: alinhados à direita, mesma quantidade de casas
  decimais, fonte tabular (`font-variant-numeric: tabular-nums`).

## Anti-checklist (se fez, refaça)

- Sombra grande + borda + fundo diferente no MESMO card (escolha um recurso).
- Ícone decorativo ao lado de cada item de lista "para preencher".
- Três pesos de cinza diferentes para o mesmo papel de texto.
- Título em gradiente animado.
- Emoji como sistema de ícones em produto sério.
- `border-radius` diferente em cada componente.
- Skeleton screen que dura menos de 300ms (pisca) ou mais de 5s (mente).
