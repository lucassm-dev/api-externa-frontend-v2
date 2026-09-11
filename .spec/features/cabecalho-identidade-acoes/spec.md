# Spec: Identidade e ações no cabeçalho

> feature: cabecalho-identidade-acoes
> status: pronta

## Contexto

Na área autenticada, o e-mail e os botões textuais de tema e saída ocupam o
canto direito sem formar uma identidade visual clara. O investidor precisa
reconhecer sua sessão e acionar essas utilidades rapidamente, inclusive no
celular, sem que elas disputem atenção com as áreas do produto.

## Histórias

### US-080 — Reconhecer a própria sessão e suas ações

Como investidor, quero ver minha identidade ao lado de ações compactas de tema
e saída, para que eu reconheça a sessão e use essas utilidades sem ruído.

#### AC-285 — Identidade completa com avatar

- **Dado** um investidor autenticado com o e-mail `lucas@exemplo.com`
- **Quando** a casca autenticada é exibida
- **Então** o canto superior direito mostra o rótulo `Investidor`, o e-mail e
  um avatar informativo com as iniciais `LE`, sem abrir menu suspenso

#### AC-286 — Tema vira uma ação por ícone acessível

- **Dado** a casca autenticada em qualquer um dos dois temas
- **Quando** o investidor observa e aciona o controle de tema
- **Então** ele encontra um botão com ícone, nome acessível que descreve o tema
  disponível e indicação do tema atual, e a alternância continua persistida

#### AC-287 — Saída vira uma ação por ícone direto

- **Dado** uma sessão autenticada
- **Quando** o investidor aciona o botão de saída identificado por ícone e nome
  acessível
- **Então** a sessão é encerrada e o produto navega para o login, sem esconder
  a ação em menu suspenso

#### AC-288 — Identidade e ações cabem no celular

- **Dado** a casca autenticada em uma tela de 360 px
- **Quando** identidade, avatar, tema e saída são exibidos
- **Então** o e-mail pode receber elipse visual sem perder o conteúdo completo,
  e os dois botões mantêm alvos de toque de pelo menos 44 px sem impor largura
  mínima ao documento

## Fora de escopo

- Menu de perfil ou dropdown no avatar.
- Foto enviada pelo investidor.
- Edição de e-mail ou perfil.
- Mudanças na autenticação, nas rotas ou na persistência do tema.

## Suposições

Nenhuma. A composição, o comportamento informativo do avatar e o fallback das
iniciais foram aprovados no design.

## Perguntas em aberto

Nenhuma.
