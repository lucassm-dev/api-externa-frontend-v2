# Spec: Administração

> feature: administracao
> status: implementada

## Contexto

O ADMIN entra por Corretoras porque o front não tinha painel administrativo (Q-044 da
identidade-papel). O backend já oferece ao ADMIN a lista de usuários com totais, o
bloqueio, a criação de outro administrador, o relatório de uso da API e a descontinuação
de corretora. Esta spec cresce um PR por vez, na ordem das issues #31 a #35 (milestone
v0.8); cada PR acrescenta as suas histórias.

Fonte: `docs/frontend/CONTRATO.md` (seções "Papéis e telas" e "Admin") e
`docs/frontend/openapi.json`, lidos em 25/11/2026. Escopo decidido pelo Lucas em
25/11/2026 (Q-050).

Esta spec substitui: identidade-papel AC-314 e AC-315 (o ADMIN entrava por Corretoras).

## Histórias

### US-098 — O ADMIN começa pelos usuários

Como administrador, quero entrar direto no painel de usuários, para que eu comece pelo
que só eu posso fazer.

#### AC-348 — O ADMIN entra por Usuários e o menu oferece as áreas dele

- **Dado** um administrador
- **Quando** o login termina ou ele abre o endereço inicial
- **Então** ele cai em `/admin/usuarios`, e o menu oferece Usuários, Corretoras e Ações

#### AC-349 — Rota de investidor aberta pelo ADMIN leva aos usuários

- **Dado** um administrador conectado
- **Quando** ele abre direto Painel, Carteiras, Operações ou Desempenho pelo endereço
- **Então** é levado a `/admin/usuarios` sem nenhuma requisição dessas áreas sair

#### AC-350 — O investidor não vê nem abre a área de usuários

- **Dado** um investidor conectado
- **Quando** a área interna abre, ou ele abre `/admin/usuarios` pelo endereço
- **Então** o menu não oferece Usuários, e o endereço o leva ao Painel sem requisitar `/admin`

### US-099 — Ver os usuários

Como administrador, quero ver os usuários com a situação de cada um, para que eu saiba
quem está ativo, quem está bloqueado e quem tem dinheiro investido.

#### AC-351 — A lista mostra quem é cada usuário e o que ele tem

- **Dado** a área de usuários
- **Quando** `GET /admin/usuarios` responde
- **Então** cada linha mostra e-mail, nome (ou "Sem nome" para o ADMIN), papel, situação,
  carteiras ativas e se tem posição aberta

#### AC-352 — Situação e papel filtram no servidor e moram no endereço

- **Dado** a área de usuários
- **Quando** o administrador escolhe situação, papel ou os dois
- **Então** `GET /admin/usuarios` sai com `situacao` e `papel` a partir da primeira página,
  a escolha vai para o endereço e sobrevive ao recarregar; a situação oferece só Ativo e
  Bloqueado, porque excluídos nunca aparecem

#### AC-353 — Os totais acompanham o papel

- **Dado** a área de usuários, com ou sem filtro de papel
- **Quando** a tela carrega ou o papel muda
- **Então** `GET /admin/usuarios/totais` sai com o mesmo `papel`, e a tela mostra quantos
  estão ativos e quantos estão bloqueados

#### AC-354 — A paginação leva os filtros

- **Dado** uma lista com mais de uma página e filtros escolhidos
- **Quando** o administrador vai para a próxima página
- **Então** a leitura sai com a página nova e os mesmos filtros

### US-100 — Bloquear e desbloquear

Como administrador, quero bloquear uma conta dizendo o motivo e desfazer o bloqueio,
para que eu contenha um uso indevido sem apagar nada.

#### AC-355 — Bloquear exige motivo e atualiza lista e totais

- **Dado** um usuário ativo na lista
- **Quando** o administrador aciona "Bloquear", escreve o motivo e confirma
- **Então** sai `PATCH /admin/usuarios/{id}/bloquear` com o `motivo` sem espaços nas pontas,
  e a lista e os totais são lidos de novo

#### AC-356 — Sem motivo, o bloqueio não sai

- **Dado** o diálogo de bloqueio com o motivo vazio ou só com espaços
- **Quando** o administrador confirma
- **Então** o campo diz que o motivo é obrigatório, o diálogo continua aberto e nenhuma
  requisição sai

#### AC-357 — O administrador não bloqueia a si mesmo

- **Dado** a linha do próprio administrador conectado
- **Quando** a lista aparece
- **Então** essa linha não oferece "Bloquear"; se o servidor recusar mesmo assim (`AUT-011`),
  a mensagem aparece no diálogo

#### AC-358 — Desbloquear devolve a conta à situação ativa

- **Dado** um usuário bloqueado na lista
- **Quando** o administrador aciona "Desbloquear"
- **Então** sai `PATCH /admin/usuarios/{id}/desbloquear`, e a lista e os totais são lidos de novo

#### AC-359 — A linha bloqueada mostra o motivo

- **Dado** um usuário bloqueado com motivo
- **Quando** a lista aparece
- **Então** a linha mostra o motivo junto da situação

### US-101 — Criar outro administrador

Como administrador, quero criar a conta de outro administrador, porque o cadastro
público só cria investidor.

#### AC-360 — A área de usuários leva ao formulário de novo administrador

- **Dado** a área de usuários
- **Quando** o administrador aciona "Novo administrador"
- **Então** `/admin/usuarios/novo` abre com e-mail, senha e confirmação de senha

#### AC-361 — Criar manda e-mail e senha e volta à lista

- **Dado** um e-mail válido e uma senha na política, repetida na confirmação
- **Quando** o administrador envia
- **Então** sai `POST /admin/usuarios` só com `email` e `senha`, a tela volta para
  `/admin/usuarios`, que é lida de novo, e um aviso confirma a criação

#### AC-362 — Dados inválidos não saem

- **Dado** um e-mail fora do formato, uma senha fora da política ou uma confirmação diferente
- **Quando** o administrador envia
- **Então** o campo com problema mostra a regra e nenhuma requisição sai

#### AC-363 — E-mail em uso aparece no campo

- **Dado** um e-mail que já tem conta (`AUT-001`)
- **Quando** o servidor recusa
- **Então** o campo "E-mail" diz que ele já está em uso e o que foi digitado continua lá

#### AC-364 — O investidor não abre o formulário

- **Dado** um investidor conectado
- **Quando** ele abre `/admin/usuarios/novo` pelo endereço
- **Então** é levado ao Painel sem requisitar `/admin`

## Fora de escopo

- Excluir usuário: o backend não oferece a rota.
- Buscar usuário por e-mail: o backend não filtra por e-mail.
- Ver as carteiras de um usuário: o ADMIN não vê conteúdo de carteira (ADR-013 do backend).

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-087 | Os totais trazem sempre as chaves `ATIVO` e `BLOQUEADO`, e só elas | confirmada | CONTRATO.md, seção "Admin" |
| ASM-089 | A linha do próprio administrador é reconhecida pelo e-mail da sessão, que é único | confirmada | E-mail é a identidade de login (CONTRATO.md, "Autenticação"); evita guardar o `id` na sessão |
| ASM-088 | A lista usa a página padrão de 20 itens, como o resto do produto | confirmada | Mesmo `size` das outras listas paginadas |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-050 | Como organizar o painel administrativo? | respondida | Áreas "Usuários" e "Uso" no menu, só do ADMIN, que passa a entrar por Usuários (resolve a Q-044); bloquear e desbloquear, criar administrador e descontinuar corretora entram; picos de uso em gráfico de barras; uma issue e um PR por entrega (Lucas, 25/11/2026) |
