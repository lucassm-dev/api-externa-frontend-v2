# ADR-001: Sessão por token de prazo fixo, sem renovação automática

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: autenticação, sessão, frontend

## Contexto e problema

O backend autentica por token emitido no login, com prazo de validade fixo. Não existe endpoint de renovação, não existe refresh token e não existe sessão no servidor — cada requisição é independente. O cadastro (`POST /auth/cadastro`) devolve os dados do investidor, **não** um token.

O frontend precisa decidir como se comporta ao longo da vida dessa sessão, e o que acontece quando ela acaba no meio de uma tarefa.

## Fatores de decisão

- Não há como estender a sessão sem um novo login — é uma restrição do backend, não uma escolha do frontend
- O produto exibe dados financeiros do investidor; sessão infinita em máquina compartilhada é risco real
- Escopo de trabalho de disciplina: renovação silenciosa exigiria endpoint novo no backend

## Opções consideradas

- Aceitar o prazo fixo e tratar a expiração como fim de sessão
- Implementar renovação silenciosa no frontend, reemitindo login com credenciais guardadas
- Pedir ao backend um endpoint de refresh antes de começar o frontend

## Decisão

**Aceitar o prazo fixo.** A sessão dura o que o token dura. Quando ele expira, a próxima ação do investidor o devolve ao login com a mensagem de expiração, e o trabalho não confirmado se perde.

Guardar credenciais no cliente para reautenticar sozinho foi descartado: transforma um token de prazo curto numa senha em repouso no navegador, que é exatamente o que a expiração existe para evitar. Pedir refresh ao backend foi descartado por escopo — pode voltar num ADR que supersede este.

Consequência direta para as telas: **cadastro e login são dois passos**. Concluir o cadastro leva ao login com o e-mail preenchido, e não ao painel. Inventar login automático depois do cadastro seria o frontend guardando a senha digitada — a mesma decisão já recusada acima.

### Consequências positivas

- Sessão expira de fato, inclusive em máquina compartilhada
- Nenhuma credencial persiste no cliente
- Comportamento de expiração é único e testável em todas as telas

### Consequências negativas

- O investidor é deslogado no meio do trabalho, sem aviso prévio
- Formulário longo preenchido durante a expiração é perdido
- Cadastro seguido de login é um passo a mais no primeiro uso

## Prós e contras

### Prazo fixo, sem renovação ✅ Escolhida

- ✅ Nada guardado no cliente além do token
- ✅ Sem trabalho novo no backend
- ❌ Interrupção sem aviso

### Renovação silenciosa no frontend

- ✅ Sessão contínua
- ❌ Exige guardar a senha no cliente
- ❌ Anula o propósito do prazo do token

### Refresh token no backend

- ✅ Melhor experiência sem guardar senha
- ❌ Fora do escopo atual

## Links

- PRD-002 v1 — Acesso e identidade
- Catálogo de erros: `docs/erros.md` (AUT-005, AUT-006, AUT-007)
