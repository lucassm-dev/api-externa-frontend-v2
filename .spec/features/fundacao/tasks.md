# Tasks: Fundacao

> feature: fundacao

## T-001 — Projeto Angular, Material, Vitest, proxy e estrutura de pastas [concluida]

- Refs: AC-024, US-010
- Arquivos: package.json, tsconfig.json, onpspec.config.json, .gitignore, proxy.config.ts, src/app.spec.ts, src/core/api/api.spec.ts, src/core/api/erro-padrao.ts, src/core/api/pagina.ts, src/core/formatacao/formatacao.ts
- Notas: Angular CLI 22.1.7 estável, Material 22.1.5, runner Vitest pelo builder @angular/build:unit-test. Proxy cobre as raízes de recurso da suposição ASM-003 apontando para http://localhost:8080. Sete pastas de feature vazias, uma por PRD. Nenhuma tarefa começa antes desta.

## T-002 — Locale pt-BR, moeda e data [concluida]

- Refs: AC-019, AC-020
- Arquivos: proxy.config.ts, src/app.spec.ts, src/core/formatacao/formatacao.spec.ts, src/core/formatacao/formatacao.ts
- Notas: registrar o locale pt-BR uma vez em app.config e expor funções de formatação de real, dólar e data-hora. O símbolo distingue as moedas (R$ e US$), a convenção numérica é a brasileira nas duas.

## T-003 — Tokens de cor e alternância de tema [concluida]

- Refs: AC-022
- Arquivos: src/core/tema/tema.service.spec.ts, src/core/tema/tema.service.ts
- Notas: todas as cores do produto ficam em _tokens.scss, claro e escuro; nenhuma outra folha define cor literal. O serviço aplica o tema no elemento raiz e guarda a escolha.

## T-004 — Tipos do contrato da API [concluida]

- Refs: AC-023
- Arquivos: src/core/api/api.spec.ts, src/core/api/erro-padrao.ts, src/core/api/pagina.ts
- Notas: Pagina<T> com content/totalElements/totalPages/number/size; ErroPadrao com timestamp/status/codigo/error/message/path e fieldErrors opcional (omitido quando vazio).

## T-005 — Sessão: modelo, armazenamento e estado [concluida]

- Refs: AC-011, AC-012, AC-013, AC-014
- Arquivos: src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.spec.ts, src/core/sessao/sessao.service.ts
- Notas: guarda em localStorage (sobrevive ao fechamento do navegador), lê expiraEm do login, trata expirado como ausência de sessão e sinaliza "acabando" a 5 minutos do fim, sem consultar o servidor.

## T-006 — Interceptor que envia o token [concluida]

- Refs: AC-017, AC-018
- Arquivos: src/core/api/http.ts, src/core/sessao/autenticacao.spec.ts, src/core/sessao/sessao.service.ts
- Notas: Authorization: Bearer <token> quando há sessão; nada quando não há.

## T-007 — Guarda de rota das telas internas [concluida]

- Refs: AC-015, AC-016
- Arquivos: src/core/sessao/sessao.guard.ts, src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.ts, src/rotas.spec.tsx, src/rotas.tsx
- Notas: nega antes de renderizar e redireciona ao login; libera com sessão dentro do prazo.

## T-008 — Catálogo de erros e tradutor por código [concluida]

- Refs: AC-001, AC-002, AC-003, AC-004
- Arquivos: src/core/api/erro-padrao.ts, src/core/erros/catalogo-erros.ts, src/core/erros/tradutor-erro.spec.ts, src/core/erros/tradutor-erro.ts
- Notas: a tabela do PRD-009 inteira, decidida por código e nunca por texto (ADR-009). VAL-001 distribui por campo; código desconhecido cai no genérico com o código visível; ausência de resposta tem texto próprio.

## T-009 — Interceptor de erro que encerra a sessão [concluida]

- Refs: AC-005
- Arquivos: src/core/api/http.ts, src/core/erros/erro-na-requisicao.spec.ts, src/core/erros/tradutor-erro.ts, src/core/navegacao.ts, src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.ts
- Notas: AUT-005 e AUT-006 limpam a sessão e levam ao login com a mensagem do código.

## T-010 — Componentes de feedback dos três níveis [concluida]

- Refs: AC-006, AC-007
- Arquivos: src/core/feedback/feedback.model.ts, src/core/feedback/feedback.service.ts, src/core/feedback/feedback.spec.tsx, src/core/feedback/mensagem-feedback.tsx
- Notas: informação, aviso e erro com papel e rótulo próprios. Aviso acompanha sucesso, não bloqueia e nunca usa a apresentação de erro (ADR-006).

## T-011 — Valor com horário e marcação de dado defasado [concluida]

- Refs: AC-008, AC-009, AC-010
- Arquivos: src/core/dados/idade-dado.ts, src/shared/estado-vazio.tsx, src/shared/monograma.tsx, src/shared/shared.spec.tsx, src/shared/valor-com-horario.tsx, src/shared/variacao.tsx, src/shared/visibilidade-senha.tsx
- Notas: limite de 15 minutos exato — 15 minutos ainda não é defasado, 15 minutos e um segundo é (ADR-005).

## T-012 — Variação com sinal, sem depender de cor [concluida]

- Refs: AC-021
- Arquivos: src/core/dados/idade-dado.ts, src/shared/estado-vazio.tsx, src/shared/monograma.tsx, src/shared/shared.spec.tsx, src/shared/valor-com-horario.tsx, src/shared/variacao.tsx, src/shared/visibilidade-senha.tsx
- Notas: alta, baixa e estável têm sinal ou seta própria além da cor (PRD-001).
