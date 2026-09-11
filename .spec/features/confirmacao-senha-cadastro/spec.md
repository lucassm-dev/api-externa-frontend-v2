# Spec: Confirmação de senha no cadastro

> feature: confirmacao-senha-cadastro
> status: implementada

## Contexto

O cadastro pede a senha uma única vez, então um erro de digitação pode criar a conta com uma credencial diferente da pretendida. O investidor precisa confirmar a senha antes que os dados sejam enviados.

## Histórias

### US-081 — Confirmar a senha antes de criar a conta

Como investidor sem conta, quero repetir a senha no cadastro, para perceber um erro de digitação antes de criar minha conta.

#### AC-291 — O cadastro pede a confirmação da senha

- **Dado** o formulário de cadastro recém-aberto
- **Quando** o investidor observa os campos sem interagir
- **Então** existe um campo obrigatório chamado `Confirmar senha` imediatamente depois de `Senha`, sem mensagem de divergência antecipada

#### AC-292 — A divergência aparece depois da interação

- **Dado** uma senha e uma confirmação diferentes
- **Quando** o investidor sai do campo `Confirmar senha` ou tenta criar a conta
- **Então** o campo informa `As senhas não coincidem` e nenhuma requisição de cadastro é feita

#### AC-293 — Mudar a senha revalida uma confirmação anterior

- **Dado** uma senha inicialmente igual à sua confirmação
- **Quando** o investidor altera somente o campo `Senha` e tenta criar a conta
- **Então** o formulário passa a informar que as senhas não coincidem e não envia o cadastro

#### AC-294 — Senhas iguais permitem o cadastro sem alterar a API

- **Dado** todos os campos válidos e a confirmação igual à senha
- **Quando** o investidor cria a conta
- **Então** o cadastro é enviado com `nome`, `email`, `cpf` e `senha`, sem incluir `confirmarSenha`

## Fora de escopo

- Alterar a política de força da senha.
- Adicionar controles para mostrar ou ocultar senha.
- Modificar o backend ou o contrato de `POST /auth/cadastro`.
- Recuperar, trocar ou redefinir senha.

## Suposições

Nenhuma.

## Perguntas em aberto

| ID    | Pergunta                               | Status     | Resposta                                                                                                                               |
| ----- | -------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Q-038 | Quando a divergência deve ser exibida? | respondida | Depois que `Confirmar senha` perder o foco ou quando o investidor tentar cadastrar, conforme decisão do dono do produto em 11/09/2026. |
