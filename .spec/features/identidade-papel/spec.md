# Spec: Identidade e papel

> feature: identidade-papel
> status: implementada

## Contexto

O backend passou a saber quem é o usuário (`GET /auth/me`, spec-17), a separar
INVESTIDOR de ADMIN (spec-16), a restringir o cadastro e a exclusão de corretora ao
ADMIN e a incluir ações no catálogo pela pesquisa (ADR-015 do backend), sem cadastro
nem exclusão de ação. O front ainda trata todo mundo como investidor, mostra o e-mail
digitado no lugar do nome, oferece ações que o servidor recusa com 403 ou 404, e cai
na mensagem genérica para os códigos de erro novos (conta bloqueada, entre outros).

Fonte: `docs/frontend/CONTRATO.md`, `docs/frontend/openapi.json` e `docs/erros.md` do
repositório `api-externa-backend-v1`, lidos em 24/11/2026. Escopo e conflitos decididos
pelo Lucas em 24/11/2026 ("Correções + identidade"; ações: adaptar; identidade:
substituir ASM-007; corretoras: só leitura para investidor; critérios superados:
marcar nas specs antigas).

Esta spec substitui: ações AC-125 a AC-129 e AC-143 a AC-146; corretoras AC-090;
acesso ASM-007.

## Histórias

### US-086 — Ver quem está conectado

Como usuário, quero ver meu nome e meu papel no topo da área interna, para que eu saiba
com que conta e com que permissões estou trabalhando.

#### AC-311 — Depois do login, o topo mostra o nome e o papel de quem entrou

- **Dado** um investidor que acabou de acertar e-mail e senha
- **Quando** a área interna abre
- **Então** o topo mostra o nome que o servidor informou em "quem sou eu" (`GET /auth/me`)
  e o papel "Investidor", e não o e-mail digitado

#### AC-312 — Administrador sem nome aparece pelo e-mail

- **Dado** um administrador, que não tem perfil de investidor (`nome` vem nulo)
- **Quando** a área interna abre
- **Então** o topo mostra o e-mail e o papel "Administrador"

#### AC-313 — Falha ao saber quem é não deixa a pessoa entrar pela metade

- **Dado** um login aceito, mas a consulta "quem sou eu" falha
- **Quando** o login termina
- **Então** a sessão é encerrada, o formulário de login continua na tela com a mensagem
  de erro, e nenhuma área interna abre

### US-087 — Ver só o que o meu papel pode usar

Como administrador, quero que o menu e as rotas mostrem só as áreas que eu posso usar,
para que eu não caia em telas que o servidor recusa.

#### ~~AC-314~~ — Administrador vê só Corretoras e Ações e entra pelas corretoras (superado por administracao, AC-348)

- **Dado** um administrador conectado
- **Quando** o login termina ou ele abre o endereço inicial
- **Então** ele cai em Corretoras, e o menu oferece só Corretoras e Ações

#### ~~AC-315~~ — Rota de investidor aberta pelo administrador leva às corretoras (superado por administracao, AC-349)

- **Dado** um administrador conectado
- **Quando** ele abre direto Painel, Carteiras, Operações ou Desempenho pelo endereço
- **Então** é levado a Corretoras sem nenhuma requisição dessas áreas sair

#### AC-316 — O investidor continua com todas as áreas

- **Dado** um investidor conectado
- **Quando** a área interna abre
- **Então** o menu oferece Painel, Corretoras, Carteiras, Ações, Operações e Desempenho,
  e o login leva ao Painel, como antes

### US-088 — Corretora: o investidor consulta, o administrador mantém

Como investidor, quero consultar as corretoras sem esbarrar em ações que não são minhas,
porque cadastrar e excluir corretora é tarefa do administrador.

#### AC-317 — Investidor não vê cadastrar nem remover corretora

- **Dado** um investidor conectado
- **Quando** abre a lista de corretoras, uma busca sem resultado ou o detalhe de uma corretora
- **Então** não aparece "Nova corretora", "Cadastrar esta corretora" nem "Remover do
  catálogo", e abrir `/corretoras/nova` pelo endereço leva à lista

#### AC-318 — Administrador cadastra e remove corretora

- **Dado** um administrador conectado
- **Quando** abre a lista ou o detalhe de uma corretora
- **Então** "Nova corretora" e "Remover do catálogo" estão disponíveis e funcionam como antes

### US-089 — Incluir ação no catálogo pela pesquisa

Como usuário, quero informar ticker e mercado para incluir uma ação no catálogo, para que
eu consiga operá-la, sem precisar ter carteira antes.

#### AC-319 — Incluir ação pesquisa o ticker no mercado e abre a ação

- **Dado** o formulário de inclusão com ticker e mercado preenchidos
- **Quando** o usuário envia
- **Então** a pesquisa sai pelo ticker com o mercado escolhido
  (`GET /acoes/ticker/{ticker}?mercado=BR|US`) e, achada, a ação abre no detalhe

#### AC-320 — O formulário abre sem exigir carteira

- **Dado** um usuário sem nenhuma carteira
- **Quando** abre a inclusão de ação
- **Então** o formulário aparece na hora, sem consultar carteiras e sem bloqueio

#### AC-321 — O detalhe da ação não oferece remover

- **Dado** o detalhe de uma ação do catálogo
- **Quando** a tela abre
- **Então** não existe ação de remover a ação, porque o servidor não tem essa operação

### US-090 — Entender as recusas novas do servidor

Como usuário, quero uma mensagem específica para cada recusa nova do servidor, para que
eu saiba o que aconteceu em vez de ler "algo deu errado".

#### AC-322 — Conta bloqueada no login é dita no formulário

- **Dado** um login com senha certa de uma conta bloqueada (`AUT-009`)
- **Quando** o servidor recusa
- **Então** o formulário diz que a conta está bloqueada, e nenhuma sessão começa

#### AC-323 — Conta bloqueada durante o uso encerra a sessão com o motivo

- **Dado** um usuário conectado cuja conta foi bloqueada (`AUT-010`)
- **Quando** qualquer requisição volta com esse código
- **Então** a sessão é encerrada e o login abre dizendo que a conta foi bloqueada

#### AC-324 — Os códigos novos do contrato têm texto próprio

- **Dado** os códigos novos do contrato do backend (`AUT-009` a `AUT-018`, `COR-005`,
  `COR-006`, `OPE-006`, `EXT-012`, `VAL-002`)
- **Quando** um deles é traduzido
- **Então** sai um texto específico em português, nunca a mensagem genérica, e os códigos
  que o servidor não emite mais (`ACA-002`, `ACA-003`, `ACA-004`) saem do catálogo

## Fora de escopo

- Telas de conta (trocar senha, e-mail ou foto; esqueci a senha): próxima rodada.
- Painel administrativo, gestão de usuários e relatório de uso: rodada seguinte. Até lá,
  o administrador entra por Corretoras.
- Descontinuar corretora e filtros do histórico de operações.
- Mostrar a foto de perfil no topo.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-077 | O papel vem de `GET /auth/me` e fica guardado junto da sessão; sessão guardada antes desta mudança, sem identidade, é tratada como investidor até expirar (no máximo 1 hora, ADR-001) | confirmada | Implementado em `sessao.papel()`, que devolve INVESTIDOR sem identidade guardada; os testes de rotas (AC-299) e da casca usam sessão sem identidade e seguem passando (24/11/2026) |
| ASM-078 | Sem `ACA-004` no backend, incluir ação não exige mais carteira; o pré-requisito do ADR-003 do front deixa de valer para ações | confirmada | Decorre do ADR-015 do backend e da escolha "Adaptar" do Lucas em 24/11/2026 |
| ASM-079 | Esconder botões e rotas é só ergonomia: quem garante o acesso é o servidor (403 `AUT-007`) | confirmada | CONTRATO.md, seção "Papéis e telas" |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-044 | Para onde vai o administrador depois do login? | respondida | Painel administrativo próprio numa rodada futura; nesta, Corretoras (Lucas, 24/11/2026) |
| Q-045 | O que fazer com critérios das specs antigas que o backend novo tornou impossíveis? | respondida | Marcar como superados nas specs originais, com ponteiro para esta (Lucas, 24/11/2026) |
| Q-046 | O catálogo completo de erros passou 0,79 kB do teto do bundle inicial (470 kB brutos / 141 kB gzip, design-v2 da migração). Subir o teto ou cortar? | respondida | Subir para 475 kB brutos / 142 kB gzip em `scripts/orcamento-bundle.mjs` (Lucas, 24/11/2026); o design-v2 original fica como estava |
