# Spec: Repaginacao acesso

> feature: repaginacao-acesso
> status: rascunho

## Contexto

Repagina login e cadastro — as duas primeiras telas que qualquer investidor vê, e
hoje as mais cruas do produto: um cartão centralizado, campos empilhados e um
botão que troca o próprio texto para "Entrando…". É onde a primeira impressão se
forma, e onde o custo de errar é o abandono.

O que muda é apresentação e retorno ao usuário. O que **não** muda é a regra: a
política de senha continua espelhando a do backend (`validadores.ts`), o cadastro
continua sendo dois passos com login em seguida (ADR-001), e os erros continuam
sendo tratados por código (P-004).

## Histórias

### US-069 — Reconhecer o produto ao chegar

Como visitante, quero que a tela de entrada tenha identidade, para que eu saiba
onde estou e confie no que vou usar.

#### AC-251 — Tela de acesso em duas regiões

- **Dado** a tela de login ou de cadastro
- **Quando** ela é exibida
- **Então** apresenta o formulário em uma região e uma região de marca ao lado,
  com o formulário mantendo largura confortável de leitura

#### AC-252 — A região de marca não atrapalha quem usa teclado

- **Dado** a tela de acesso
- **Quando** o visitante navega por teclado
- **Então** o foco entra direto no formulário, e a região de marca não recebe
  parada de tabulação

#### AC-253 — Movimento na marca é opcional

- **Dado** que a região de marca tem movimento
- **Quando** o visitante prefere movimento reduzido
- **Então** o movimento não acontece, e a região continua legível

### US-070 — Saber se estou acertando enquanto digito

Como visitante criando conta, quero retorno claro sobre o que falta, para que eu
não descubra o erro só ao enviar.

#### AC-254 — Erro aparece depois da interação e diz como corrigir

- **Dado** um campo com valor inválido
- **Quando** o visitante sai do campo
- **Então** a mensagem exibida diz o que se espera do campo, não apenas que está
  errado, e não aparece antes do campo ter sido tocado

#### AC-255 — O medidor de senha reflete a política real

- **Dado** o campo de senha do cadastro
- **Quando** o visitante digita
- **Então** o indicador mostra o progresso em relação à política vigente — ao
  menos oito caracteres, com uma letra e um número — e só indica senha aceitável
  quando o validador do formulário também aceita

#### AC-256 — O primeiro campo já está pronto para digitar

- **Dado** a tela de login ou de cadastro recém-aberta
- **Quando** ela termina de carregar
- **Então** o primeiro campo do formulário está com o foco

### US-071 — Entender o que aconteceu ao enviar

Como visitante, quero saber que meu envio está em curso e o que houve se falhar,
para que eu não clique duas vezes nem fique sem resposta.

#### AC-257 — Botão mostra que está enviando sem perder o rótulo

- **Dado** um formulário sendo enviado
- **Quando** o envio está em curso
- **Então** o botão fica desabilitado e exibe indicador de carregamento junto do
  rótulo original, que não é substituído por outro texto

#### AC-258 — Falha de acesso é comunicada no nível certo

- **Dado** um envio que falhou
- **Quando** a mensagem é exibida
- **Então** usa o nível de comunicação correspondente ao código recebido e traz o
  código quando houver, sem que o texto do servidor decida o comportamento
  (P-004)

## Fora de escopo

- Qualquer mudança na política de senha, no fluxo de dois passos ou no contrato
  de erro — só a apresentação muda.
- Recuperação de senha, login social, "lembrar de mim": não existem no produto.
- Confirmação de senha: não há esse campo no cadastro, e criá-lo seria escopo
  novo.
- Máscara de CPF: já existe e funciona (`formatarCpf`), não será trocada por
  equivalente de biblioteca (RFC-002).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-061 | A região de marca pode ser decorativa, sem conteúdo que o visitante precise ler para concluir a tarefa | aberta | — |
| ASM-062 | Focar o primeiro campo ao abrir não atrapalha leitores de tela, por ser tela de tarefa única | aberta | — |
| ASM-063 | O medidor de senha pode derivar da política existente em `validadores.ts` sem duplicar a regra | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-032 | O que entra na região de marca? | respondida | Superfície escura com gradiente lento na cor de destaque (`#eaef1b`), nome do produto e uma frase curta. É a estreia da cor de destaque, num lugar sem dado financeiro — que é onde efeito visual cabe. O movimento desliga sob `prefers-reduced-motion` (AC-253) |
