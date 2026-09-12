# Spec: Visibilidade da senha

> feature: visibilidade-da-senha
> status: rascunho

## Contexto

Senha digitada às cegas é senha digitada errado. Hoje os três campos de senha do
produto — a do login, e a senha mais a confirmação no cadastro — só aceitam
digitação oculta, então um erro de digitação só aparece como falha de login ou
como "as senhas não coincidem", sem dizer onde foi o engano.

O campo ganha um botão de visibilidade. Ele revela o conteúdo enquanto o
investidor confere, e volta a ocultar.

## Histórias

### US-082 — Conferir a senha que estou digitando

Como investidor, quero revelar a senha que digitei, para que eu corrija um erro
de digitação em vez de tentar entrar às cegas.

#### AC-295 — O campo revela e volta a ocultar

- **Dado** um campo de senha com conteúdo digitado
- **Quando** o investidor aciona o botão de visibilidade
- **Então** o conteúdo passa a ser exibido como texto legível, e acionar o botão
  de novo volta a ocultá-lo

#### AC-296 — O botão diz o que faz e em que estado está

- **Dado** o botão de visibilidade de um campo de senha
- **Quando** ele é exibido, oculto ou revelado
- **Então** tem nome acessível que descreve a ação — "Mostrar senha" quando está
  oculta e "Ocultar senha" quando está revelada — e anuncia o estado a quem usa
  leitor de tela

#### AC-297 — Cada campo tem o seu próprio controle

- **Dado** o cadastro, que tem senha e confirmação de senha
- **Quando** o investidor revela uma das duas
- **Então** só aquele campo fica visível, e o outro continua oculto

#### AC-298 — Revelar a senha nunca envia o formulário

- **Dado** um formulário de acesso com o botão de visibilidade
- **Quando** o botão é acionado
- **Então** o formulário não é submetido e nenhuma requisição sai

## Fora de escopo

- Lembrar a preferência de visibilidade entre visitas: a senha volta a ficar
  oculta a cada carregamento, que é o padrão seguro.
- Ocultar a senha sozinho depois de um tempo.
- Mudar as regras de senha, a medição de força ou a validação de coincidência.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-071 | Revelar a senha sob comando explícito do próprio investidor, na tela dele, é risco aceitável — é o padrão consolidado em formulários de acesso | aberta | — |
| ASM-072 | O botão como sufixo do `mat-form-field` não atrapalha o `errorStateMatcher` nem o medidor de força que já existem no cadastro | aberta | — |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-039 | O botão aparece também no login, ou só no cadastro? | respondida | Nos três campos. O pedido cita senha e confirmação, mas deixar o login de fora criaria dois comportamentos para o mesmo tipo de campo no mesmo fluxo. Decidido pelo agente |
