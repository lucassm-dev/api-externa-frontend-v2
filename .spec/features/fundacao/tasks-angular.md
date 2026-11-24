# Tasks: Fundacao

> feature: fundacao

## T-001 — Projeto Angular, Material, Vitest, proxy e estrutura de pastas [concluida]

- Refs: AC-024, US-010
- Arquivos: angular.json, package.json, tsconfig.json, tsconfig.app.json, tsconfig.spec.json, proxy.conf.json, onpspec.config.json, .gitignore, src/main.ts, src/index.html, src/app/app.ts, src/app/app.html, src/app/app.config.ts, src/app/app.routes.ts, src/app/app.scss, src/app/app.spec.ts, src/app/features/LEIA-ME.md
- Notas: Angular CLI 22.1.7 estável, Material 22.1.5, runner Vitest pelo builder @angular/build:unit-test. Proxy cobre as raízes de recurso da suposição ASM-003 apontando para http://localhost:8080. Sete pastas de feature vazias, uma por PRD. Nenhuma tarefa começa antes desta.

## T-002 — Locale pt-BR, moeda e data [concluida]

- Refs: AC-019, AC-020
- Arquivos: src/app/core/formatacao/formatacao.ts, src/app/core/formatacao/formatacao.spec.ts
- Notas: registrar o locale pt-BR uma vez em app.config e expor funções de formatação de real, dólar e data-hora. O símbolo distingue as moedas (R$ e US$), a convenção numérica é a brasileira nas duas.

## T-003 — Tokens de cor e alternância de tema [concluida]

- Refs: AC-022
- Arquivos: src/styles.scss, src/styles/_tokens.scss, src/styles/_tema.scss, src/app/core/tema/tema.service.ts, src/app/core/tema/tema.service.spec.ts
- Notas: todas as cores do produto ficam em _tokens.scss, claro e escuro; nenhuma outra folha define cor literal. O serviço aplica o tema no elemento raiz e guarda a escolha.

## T-004 — Tipos do contrato da API [concluida]

- Refs: AC-023
- Arquivos: src/app/core/api/pagina.ts, src/app/core/api/erro-padrao.ts, src/app/core/api/api.spec.ts
- Notas: Pagina<T> com content/totalElements/totalPages/number/size; ErroPadrao com timestamp/status/codigo/error/message/path e fieldErrors opcional (omitido quando vazio).

## T-005 — Sessão: modelo, armazenamento e estado [concluida]

- Refs: AC-011, AC-012, AC-013, AC-014
- Arquivos: src/app/core/sessao/sessao.model.ts, src/app/core/sessao/sessao.service.ts, src/app/core/sessao/sessao.service.spec.ts
- Notas: guarda em localStorage (sobrevive ao fechamento do navegador), lê expiraEm do login, trata expirado como ausência de sessão e sinaliza "acabando" a 5 minutos do fim, sem consultar o servidor.

## T-006 — Interceptor que envia o token [concluida]

- Refs: AC-017, AC-018
- Arquivos: src/app/core/sessao/autenticacao.interceptor.ts, src/app/core/sessao/autenticacao.interceptor.spec.ts
- Notas: Authorization: Bearer <token> quando há sessão; nada quando não há.

## T-007 — Guarda de rota das telas internas [concluida]

- Refs: AC-015, AC-016
- Arquivos: src/app/core/sessao/sessao.guard.ts, src/app/core/sessao/sessao.guard.spec.ts
- Notas: nega antes de renderizar e redireciona ao login; libera com sessão dentro do prazo.

## T-008 — Catálogo de erros e tradutor por código [concluida]

- Refs: AC-001, AC-002, AC-003, AC-004
- Arquivos: src/app/core/erros/catalogo-erros.ts, src/app/core/erros/tradutor-erro.ts, src/app/core/erros/tradutor-erro.spec.ts
- Notas: a tabela do PRD-009 inteira, decidida por código e nunca por texto (ADR-009). VAL-001 distribui por campo; código desconhecido cai no genérico com o código visível; ausência de resposta tem texto próprio.

## T-009 — Interceptor de erro que encerra a sessão [concluida]

- Refs: AC-005
- Arquivos: src/app/core/erros/erro.interceptor.ts, src/app/core/erros/erro.interceptor.spec.ts
- Notas: AUT-005 e AUT-006 limpam a sessão e levam ao login com a mensagem do código.

## T-010 — Componentes de feedback dos três níveis [concluida]

- Refs: AC-006, AC-007
- Arquivos: src/app/core/feedback/feedback.model.ts, src/app/core/feedback/feedback.service.ts, src/app/core/feedback/mensagem-feedback.ts, src/app/core/feedback/mensagem-feedback.html, src/app/core/feedback/mensagem-feedback.scss, src/app/core/feedback/painel-feedback.ts, src/app/core/feedback/feedback.spec.ts
- Notas: informação, aviso e erro com papel e rótulo próprios. Aviso acompanha sucesso, não bloqueia e nunca usa a apresentação de erro (ADR-006).

## T-011 — Valor com horário e marcação de dado defasado [concluida]

- Refs: AC-008, AC-009, AC-010
- Arquivos: src/app/core/dados/idade-dado.ts, src/app/shared/valor-com-horario/valor-com-horario.ts, src/app/shared/valor-com-horario/valor-com-horario.html, src/app/shared/valor-com-horario/valor-com-horario.scss, src/app/shared/valor-com-horario/valor-com-horario.spec.ts
- Notas: limite de 15 minutos exato — 15 minutos ainda não é defasado, 15 minutos e um segundo é (ADR-005).

## T-012 — Variação com sinal, sem depender de cor [concluida]

- Refs: AC-021
- Arquivos: src/app/shared/variacao/variacao.ts, src/app/shared/variacao/variacao.html, src/app/shared/variacao/variacao.scss, src/app/shared/variacao/variacao.spec.ts
- Notas: alta, baixa e estável têm sinal ou seta própria além da cor (PRD-001).
