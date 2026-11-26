# Spec: Conta

> feature: conta
> status: implementada

## Contexto

O backend já oferece trocar a senha, recuperar a senha esquecida, trocar o e-mail e
manter uma foto de perfil (`/auth/senha`, `/auth/esqueci-senha`, `/auth/redefinir-senha`,
`/auth/email`, `/auth/email/confirmar`, `/auth/me/foto`), mas o front não tem nenhuma
dessas telas: quem esquece a senha fica de fora, e ninguém consegue mudar os próprios
dados.

Fonte: `docs/frontend/CONTRATO.md` (seções "Cadastro e senha", "Esqueci a senha",
"Trocar e-mail" e "Foto de perfil") e `docs/frontend/openapi.json`, lidos em 24/11/2026.
Pedido do Lucas: "telas de conta: trocar senha, esqueci senha, trocar e-mail, foto".
Escopo decidido pelo Lucas em 24/11/2026 (Q-047).

Esta spec substitui: acesso AC-038 (Q-048).

Continua: identidade-papel (US-086), que deixou estas telas e a foto no topo para esta
rodada. O avatar do AC-285 segue informativo e com as iniciais do e-mail; só passa a
mostrar a foto quando houver uma.

## Histórias

### US-091 — Chegar à minha conta

Como usuário conectado, investidor ou administrador, quero um caminho fixo para os meus
dados, para que eu troque senha, e-mail ou foto sem procurar.

#### AC-325 — O topo leva à página Minha conta

- **Dado** um investidor ou um administrador conectado
- **Quando** aciona o botão "Minha conta" do topo
- **Então** a página `/conta` abre com as seções Foto, E-mail e Senha

### US-092 — Trocar a senha

Como usuário conectado, quero trocar a minha senha informando a atual, para que eu
mantenha a conta segura sem sair do sistema.

#### AC-326 — Trocar a senha mantém a pessoa conectada com o token novo

- **Dado** a seção Senha com a senha atual certa e uma senha nova válida, repetida na
  confirmação
- **Quando** o usuário envia
- **Então** sai `PUT /auth/senha` com `senhaAtual` e `novaSenha`, o token devolvido
  substitui o guardado, a próxima requisição usa o token novo, os campos se limpam e a
  tela confirma a troca

#### AC-327 — Senha nova fora da política ou diferente da confirmação não sai

- **Dado** uma senha nova sem letra, sem número ou com menos de 8 caracteres, ou uma
  confirmação diferente da senha nova
- **Quando** o usuário envia
- **Então** o campo com problema mostra a regra e nenhuma requisição sai

#### AC-328 — Senha atual errada é apontada no campo

- **Dado** a senha atual errada (`AUT-014`)
- **Quando** o servidor recusa
- **Então** o campo "Senha atual" mostra que ela está incorreta e a sessão continua

### US-093 — Recuperar a senha esquecida

Como visitante que esqueceu a senha, quero receber um código no e-mail e definir uma
senha nova, para que eu volte a entrar sem depender de ninguém.

#### AC-329 — O login leva à recuperação

- **Dado** a tela de login
- **Quando** o visitante aciona "Esqueci a senha"
- **Então** a tela `/esqueci-senha` abre pedindo o e-mail, levando junto o e-mail já
  digitado no login

#### AC-330 — Pedir o código não revela se o e-mail existe

- **Dado** um e-mail válido no primeiro passo
- **Quando** o visitante pede o código
- **Então** sai `POST /auth/esqueci-senha` e a tela diz "Se o e-mail existir, enviamos um
  código", abrindo o segundo passo com o código de 6 dígitos e a senha nova, sem distinguir
  e-mail cadastrado de não cadastrado

#### AC-331 — Código certo redefine e leva ao login

- **Dado** o segundo passo com 6 dígitos e uma senha nova válida, repetida na confirmação
- **Quando** o visitante envia
- **Então** sai `POST /auth/redefinir-senha` com `email`, `codigo` e `novaSenha`, e o
  login abre com o e-mail preenchido e o aviso de que a senha foi redefinida

#### AC-332 — Código inválido ou fora do formato é apontado no campo

- **Dado** um código que não tem 6 dígitos, ou que o servidor recusa (`AUT-013`)
- **Quando** o visitante envia
- **Então** o campo "Código" mostra o problema; no primeiro caso nenhuma requisição sai

### US-094 — Trocar o e-mail

Como usuário conectado, quero trocar o e-mail de acesso confirmando por um código
enviado ao endereço novo, para que só um e-mail que eu controlo vire o meu login.

#### AC-333 — Pedir a troca envia o código para o e-mail novo

- **Dado** a seção E-mail com um e-mail novo válido e a senha atual
- **Quando** o usuário envia
- **Então** sai `POST /auth/email` com `novoEmail` e `senhaAtual`, e a seção passa a pedir
  o código, dizendo que ele foi enviado para o e-mail novo

#### AC-334 — Confirmar o código troca o e-mail mostrado

- **Dado** o código recebido no e-mail novo
- **Quando** o usuário confirma
- **Então** sai `POST /auth/email/confirmar` com `codigo`, "quem sou eu" (`GET /auth/me`) é
  recarregado e o topo e a página passam a mostrar o e-mail novo

#### AC-335 — Recusas da troca de e-mail são ditas no lugar certo

- **Dado** um pedido de troca recusado
- **Quando** o servidor responde senha errada (`AUT-014`) ou e-mail em uso (`AUT-001`)
- **Então** o campo correspondente ("Senha atual" ou "E-mail novo") mostra o motivo; com
  pedidos demais (`AUT-015`) ou e-mail fora do ar (`EXT-012`), a mensagem aparece na seção

### US-095 — Manter a foto de perfil

Como usuário conectado, quero enviar e remover uma foto de perfil, para que eu reconheça
a minha conta no topo.

#### AC-336 — Enviar uma foto válida a mostra na página e no topo

- **Dado** um arquivo JPEG, PNG ou WebP de até 2 MB
- **Quando** o usuário o escolhe na seção Foto
- **Então** sai `PUT /auth/me/foto` em `multipart/form-data` no campo `arquivo`, e a foto
  nova aparece na página e no avatar do topo

#### AC-337 — Arquivo grande demais ou de outro tipo não sai

- **Dado** um arquivo com mais de 2 MB, ou que não seja JPEG, PNG ou WebP
- **Quando** o usuário o escolhe
- **Então** a seção diz o limite ou os tipos aceitos e nenhuma requisição sai; se o
  servidor recusar mesmo assim (`AUT-016`, `AUT-017`), a mesma mensagem aparece

#### AC-338 — Remover a foto volta às iniciais

- **Dado** um usuário com foto
- **Quando** aciona "Remover foto"
- **Então** sai `DELETE /auth/me/foto` e a página e o topo voltam às iniciais

#### AC-339 — A foto é buscada com o token; sem ela, ficam as iniciais

- **Dado** a identidade com `fotoUrl` preenchido
- **Quando** o topo ou a página aparecem
- **Então** a foto é buscada em `GET /auth/me/foto` com o token, e não por um endereço
  direto na imagem; sem `fotoUrl`, ou se a busca falhar, o avatar mostra as iniciais do e-mail

### US-107 — Ver meus dados e encerrar minha conta

Como investidor, quero ver os dados pessoais da minha conta e poder excluí-la, para que eu
confira com que dados estou cadastrado e saia do produto quando quiser.

#### AC-383 — O investidor vê nome e e-mail

- **Dado** um investidor em Minha conta
- **Quando** a página abre
- **Então** a seção "Dados pessoais" mostra o nome e o e-mail que `GET /investidores` devolve

#### AC-384 — O administrador não vê dados pessoais

- **Dado** um administrador em Minha conta
- **Quando** a página abre
- **Então** não aparecem as seções "Dados pessoais" e "Excluir minha conta", e nenhuma
  requisição a `/investidores` sai

#### AC-385 — Excluir a conta pede confirmação

- **Dado** a área "Excluir minha conta"
- **Quando** o investidor aciona "Excluir minha conta"
- **Então** um diálogo explica que a conta é desativada e o e-mail fica livre; cancelar fecha
  o diálogo sem excluir nada

#### AC-386 — Confirmar exclui, encerra a sessão e explica no login

- **Dado** o diálogo de exclusão
- **Quando** o investidor confirma
- **Então** sai `DELETE /investidores/{id}` com o `id` dos dados pessoais, a sessão termina e
  o login abre dizendo que a conta foi excluída

## Fora de escopo

- Trocar o nome ou o CPF: o backend não oferece. (Excluir a conta entrou depois, na US-107.)
- Botão "reenviar código": pedir de novo é voltar ao primeiro passo, e o servidor limita
  a 3 pedidos a cada 15 minutos.
- Recortar ou redimensionar a foto antes do envio.
- Confirmação antes de remover a foto: a ação é desfeita enviando outra foto.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-080 | `PUT /auth/senha` devolve o mesmo corpo do login (`token`, `tipo`, `expiraEm`); o openapi não descreve a resposta, só o CONTRATO.md diz "devolve um token NOVO" | confirmada | `AuthResource.trocarSenha` devolve `AuthTokenResponseDTO`, o mesmo corpo do login (backend `main`, lido em 24/11/2026) |
| ASM-081 | `GET /auth/me` devolve o `email` atual, e é de lá que sai o e-mail novo depois da confirmação | confirmada | CONTRATO.md, seção "Autenticação": `papel`, `nome`, `email` e `fotoUrl` |
| ASM-082 | A foto vale para os dois papéis; o administrador também pode ter foto | confirmada | CONTRATO.md, "Papéis e telas": `/auth/me/foto` está em "Ambos" |
| ASM-096 | `GET /investidores` devolve só o próprio investidor (o backend filtra pelo token), então o `id` para excluir sai dele, sem guardar o `id` na sessão | confirmada | `InvestidorService.listar` do backend, lido em 26/11/2026 |
| ASM-083 | A validação de tamanho e tipo no front olha o `File` (tamanho e tipo declarado); quem decide pelo conteúdo é o servidor (`AUT-017`) | confirmada | CONTRATO.md, "Foto de perfil": tipo detectado pelo conteúdo |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-047 | Como organizar as telas de conta? | respondida | Uma página `/conta` com Foto, E-mail e Senha; esqueci a senha numa tela pública em 2 passos; foto também no avatar do topo, com iniciais sem foto; documentação spec + tasks, sem PRD/ADR/TDD (Lucas, 24/11/2026) |
| Q-048 | O AC-038 da spec de acesso proíbe link de recuperação no login, e o bundle inicial passou 0,77 kB do teto (475,77/142,27 contra 475/142). O que fazer? | respondida | AC-038 marcado como superado pelo AC-329, com o teste antigo removido; teto sobe para 477 kB brutos / 143 kB gzip em `scripts/orcamento-bundle.mjs` (Lucas, 25/11/2026) |
| Q-054 | O que entra em "Dados pessoais"? | respondida | Ler nome e e-mail e excluir a própria conta, com confirmação; o ADMIN não vê a seção (Lucas, 26/11/2026). Issue #48 |
