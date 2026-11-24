<!-- onp-spec:documentation-contract=v1 -->

# Tasks: Migracao react

> feature: migracao-react

<!--
  Status: pendente | em-andamento | concluida
    (atalho: `onp-spec tarefa <feature> <T-xxx> <status>`)
  Uma tarefa por rodada do loop. A ordem é obrigatória até T-130 (cada uma
  depende da anterior); de T-131 a T-137 os domínios tocam pastas disjuntas.
  "Porta" significa: reescrever em React + os testes de mesma área, com a
  mesma tag @spec:AC-xxx no título, e aplicar a crítica da skill impeccable.
-->

## T-127 — Base React em web/: Vite, Tailwind com tokens, kit shadcn e gate combinado [concluida]

- Refs: US-084, AC-300, AC-301, AC-304
- Arquivos: package.json, vite.config.ts, tsconfig.json, index.html, components.json, src/main.tsx, src/styles/tokens.css, src/styles/global.css, src/lib/utils.ts, src/test/setup.ts, src/styles/tokens.spec.ts, onpspec.config.json
- Notas: porta `_tokens.scss` e `_tema.scss` para CSS (claro/escuro com `[data-tema='escuro']`), desliga a paleta do Tailwind e mapeia as variáveis do shadcn nos tokens. Proxy do Vite igual ao `proxy.conf.json` (ASM-073). O `testCommand` passa a rodar as duas suítes em TAP. Porta `styles/tokens.spec.ts` e `styles/movimento.spec.ts`.

## T-128 — Porta o núcleo: api, erros, sessão, feedback, formatação, dados e tema [concluida]

- Refs: US-083, AC-299
- Arquivos: src/core/api/api.spec.ts, src/core/api/erro-padrao.ts, src/core/api/http.ts, src/core/api/pagina.ts, src/core/erros/catalogo-erros.ts, src/core/erros/erro-em-formulario.ts, src/core/erros/erro-na-requisicao.spec.ts, src/core/erros/tradutor-erro.spec.ts, src/core/erros/tradutor-erro.ts, src/core/sessao/autenticacao.spec.ts, src/core/sessao/sessao.guard.ts, src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.spec.ts, src/core/sessao/sessao.service.ts, src/core/feedback/feedback.model.ts, src/core/feedback/feedback.service.ts, src/core/feedback/feedback.spec.tsx, src/core/feedback/mensagem-feedback.tsx, src/core/feedback/notificacao.spec.tsx, src/core/feedback/notificacao.tsx, src/core/feedback/painel-feedback.tsx, src/core/formatacao/formatacao.spec.ts, src/core/formatacao/formatacao.ts, src/core/dados/idade-dado.ts, src/core/tema/tema.service.spec.ts, src/core/tema/tema.service.ts, src/core/navegacao.ts, src/test/servidor.ts
- Notas: lógica idêntica. O `HttpClient` com interceptores vira um cliente `fetch` que injeta o token e traduz o erro pelo catálogo (P-004, ADR-009). O `MatSnackBar` vira sonner. Porta os testes de `src/app/core/**`.

## T-129 — Porta as primitivas compartilhadas para o kit [concluida]

- Refs: US-084, AC-303, AC-302
- Arquivos: src/components/ui/botao-icone.tsx, src/components/ui/botao.spec.tsx, src/components/ui/botao.tsx, src/components/ui/caixa-de-marcar.tsx, src/components/ui/campo.tsx, src/components/ui/cartao.tsx, src/components/ui/contagem-numero.tsx, src/components/ui/dialogo-confirmacao.tsx, src/components/ui/esqueleto.tsx, src/components/ui/holofote.tsx, src/components/ui/kit-nas-telas.spec.ts, src/components/ui/kit.spec.tsx, src/components/ui/marquee.tsx, src/components/ui/movimento.css, src/components/ui/nome-acessivel.spec.ts, src/components/ui/padrao-unico.spec.ts, src/components/ui/paginador.tsx, src/components/ui/selecao.tsx, src/components/ui/selo.tsx, src/components/ui/tabela.css, src/components/ui/tabela.spec.tsx, src/components/ui/tabela.tsx, src/shared/estado-vazio.tsx, src/shared/monograma.tsx, src/shared/ordenacao.spec.ts, src/shared/ordenacao.ts, src/shared/shared.spec.tsx, src/shared/valor-com-horario.tsx, src/shared/variacao.tsx, src/shared/visibilidade-senha.tsx, src/lib/movimento.ts, src/test/tailwind.ts
- Notas: botão, botão-ícone, cartão, confirmação, esqueleto, estado vazio, monograma (iniciais sem ngx-oneforall), paginador, selo, tabela (TanStack React), valor com horário, variação, visibilidade da senha. Porta os testes de `src/app/shared/**`.

## T-130 — Porta a casca, as rotas e a guarda de sessão [concluida]

- Refs: US-083, AC-299
- Arquivos: src/app.tsx, src/rotas.tsx, src/layout/areas.ts, src/layout/casca.spec.tsx, src/layout/casca.tsx, src/test/rotas.tsx
- Notas: react-router com rotas carregadas sob demanda, guarda de sessão e redirecionamentos iguais a `app.routes.ts`. Porta `app.spec.ts` e `layout/casca.spec.ts`.

## T-131 — Porta acesso: login e cadastro [concluida]

- Refs: US-083, AC-302, AC-303
- Arquivos: src/features/acesso/acesso.model.ts, src/features/acesso/acesso.spec.ts, src/features/acesso/acesso.ts, src/features/acesso/cadastro.spec.tsx, src/features/acesso/cadastro.tsx, src/features/acesso/cartao-acesso.tsx, src/features/acesso/forca-da-senha.tsx, src/features/acesso/login.spec.tsx, src/features/acesso/login.tsx, src/features/acesso/moldura-acesso.tsx, src/features/acesso/moldura-e-forca.spec.tsx, src/features/acesso/validadores.ts, src/features/acesso/visitante.ts, src/lib/formulario.ts, src/test/telas-acesso.tsx
- Notas: inclui moldura de acesso com fundo Aceternity (parado com movimento reduzido), força e confirmação da senha (validadores reescritos sem ngx-oneforall).

## T-132 — Porta o painel [concluida]

- Refs: US-083, AC-302, AC-303
- Arquivos: src/features/painel/blocos/barra-mercado.spec.tsx, src/features/painel/blocos/barra-mercado.tsx, src/features/painel/blocos/consolidado.spec.tsx, src/features/painel/blocos/consolidado.tsx, src/features/painel/blocos/outros-blocos.spec.tsx, src/features/painel/blocos/outros-blocos.tsx, src/features/painel/carteira-preferida.spec.ts, src/features/painel/carteira-preferida.ts, src/features/painel/painel.model.ts, src/features/painel/painel.service.spec.ts, src/features/painel/painel.service.ts, src/features/painel/painel.spec.tsx, src/features/painel/painel.tsx, src/features/painel/proximo-passo.spec.ts, src/features/painel/proximo-passo.ts
- Notas: barra de cotações com o Marquee do Magic UI (sem borda e sem horário, decisão de 2026-11-15), números do consolidado com NumberTicker.

## T-133 — Porta corretoras [concluida]

- Refs: US-083, AC-303
- Arquivos: src/features/corretoras/cadastro-corretora.tsx, src/features/corretoras/cnpj.spec.ts, src/features/corretoras/cnpj.ts, src/features/corretoras/corretoras.model.ts, src/features/corretoras/corretoras.service.ts, src/features/corretoras/corretoras.spec.tsx, src/features/corretoras/detalhe-corretora.tsx, src/features/corretoras/lista-corretoras.tsx, src/features/corretoras/selo-de-uso.spec.ts, src/features/corretoras/selo-de-uso.ts

## T-134 — Porta carteiras [concluida]

- Refs: US-083, AC-303
- Arquivos: src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/movimentacoes-da-carteira.spec.ts, src/features/carteiras/movimentacoes-da-carteira.ts, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/posicoes-encerradas.spec.ts, src/features/carteiras/posicoes-encerradas.ts, src/features/carteiras/rentabilidade.spec.ts, src/features/carteiras/rentabilidade.ts

## T-135 — Porta ações [concluida]

- Refs: US-083, AC-303
- Arquivos: src/features/acoes/acoes.model.ts, src/features/acoes/acoes.service.ts, src/features/acoes/acoes.spec.tsx, src/features/acoes/cadastro-acao.tsx, src/features/acoes/desfecho-cotacao.spec.ts, src/features/acoes/desfecho-cotacao.ts, src/features/acoes/detalhe-acao.tsx, src/features/acoes/lista-acoes.tsx

## T-136 — Porta operações [concluida]

- Refs: US-083, AC-303
- Arquivos: src/features/operacoes/disponivel-para-venda.ts, src/features/operacoes/editar-operacao.spec.tsx, src/features/operacoes/editar-operacao.tsx, src/features/operacoes/extrato-operacoes.spec.tsx, src/features/operacoes/extrato-operacoes.tsx, src/features/operacoes/formulario-operacao.spec.tsx, src/features/operacoes/formulario-operacao.tsx, src/features/operacoes/operacoes.model.ts, src/features/operacoes/operacoes.service.spec.ts, src/features/operacoes/operacoes.service.ts, src/features/operacoes/operacoes.spec.tsx, src/features/operacoes/operacoes.tsx, src/features/operacoes/preco-da-operacao.ts, src/features/operacoes/regras-da-operacao.spec.ts, src/features/operacoes/resultado-operacao.spec.tsx, src/features/operacoes/resultado-operacao.tsx, src/components/ui/grupo-de-opcoes.tsx, src/components/ui/campo.tsx, src/components/ui/selecao.tsx, src/features/acoes/acoes.service.ts, src/rotas.tsx

## T-137 — Porta desempenho [concluida]

- Refs: US-083, AC-303
- Arquivos: src/features/desempenho/blocos/blocos-do-mapa.spec.ts, src/features/desempenho/blocos/blocos-do-mapa.ts, src/features/desempenho/blocos/concentracao-da-carteira.spec.ts, src/features/desempenho/blocos/concentracao-da-carteira.ts, src/features/desempenho/blocos/confissoes-desempenho.spec.tsx, src/features/desempenho/blocos/confissoes-desempenho.tsx, src/features/desempenho/blocos/grafico-composicao.spec.tsx, src/features/desempenho/blocos/grafico-composicao.tsx, src/features/desempenho/blocos/grafico-concentracao.spec.tsx, src/features/desempenho/blocos/grafico-concentracao.tsx, src/features/desempenho/blocos/grafico-contribuicao.spec.tsx, src/features/desempenho/blocos/grafico-contribuicao.tsx, src/features/desempenho/blocos/grafico-investido-mercado.spec.tsx, src/features/desempenho/blocos/grafico-investido-mercado.tsx, src/features/desempenho/blocos/grafico-mapa-posicoes.spec.tsx, src/features/desempenho/blocos/grafico-mapa-posicoes.tsx, src/features/desempenho/blocos/grafico-quadrante.spec.tsx, src/features/desempenho/blocos/grafico-quadrante.tsx, src/features/desempenho/blocos/grafico-realizado.spec.tsx, src/features/desempenho/blocos/grafico-realizado.tsx, src/features/desempenho/blocos/numeros-desempenho.spec.tsx, src/features/desempenho/blocos/numeros-desempenho.tsx, src/features/desempenho/blocos/setores-da-rosca.spec.ts, src/features/desempenho/blocos/setores-da-rosca.ts, src/features/desempenho/composicao.spec.ts, src/features/desempenho/composicao.ts, src/features/desempenho/contribuicao.spec.ts, src/features/desempenho/contribuicao.ts, src/features/desempenho/desempenho.model.ts, src/features/desempenho/desempenho.service.spec.ts, src/features/desempenho/desempenho.service.ts, src/features/desempenho/desempenho.spec.tsx, src/features/desempenho/desempenho.tsx, src/features/desempenho/idade-das-cotacoes.spec.ts, src/features/desempenho/idade-das-cotacoes.ts, src/features/desempenho/moeda-das-posicoes.spec.ts, src/features/desempenho/moeda-das-posicoes.ts, src/features/desempenho/realizado-por-ticker.spec.ts, src/features/desempenho/realizado-por-ticker.ts, src/features/desempenho/resultados.spec.ts, src/features/desempenho/resultados.ts, src/rotas.tsx
- Notas: gráficos continuam SVG próprios (ADR-010: sem série histórica, sem biblioteca de gráfico).

## T-138 — Corte final: remove o Angular e promove o React à raiz [concluida]

- Refs: US-083, AC-305
- Arquivos: package.json, package-lock.json, tsconfig.json, index.html, vite.config.ts, proxy.config.ts, components.json, public/favicon.ico, src/main.tsx, src/corte.spec.ts, scripts/orcamento-bundle.mjs, onpspec.config.json, README.md, PRODUCT.md, .gitignore, Dockerfile, .dockerignore, nginx/padrao.conf.template, .vscode/extensions.json, .vscode/launch.json, .vscode/tasks.json, .spec/constituicao.md, .spec/constituicao-v1.3.0.md, .spec/features/migracao-react/design-v2.md, src/features/painel/blocos/barra-mercado.tsx, src/features/painel/blocos/barra-mercado.spec.tsx, src/features/painel/blocos/consolidado.tsx, src/features/painel/blocos/consolidado.spec.tsx
- Notas: só com 298/298 critérios antigos provados pela suíte React. Depende da resposta da Q-040 para a linha de verificação do P-003. `docs/prompt-codex.md` e os RFCs ficam preservados como histórico.

## T-139 — Corrige no React os bugs achados no Angular [concluida]

- Refs: US-085, AC-306, AC-307, AC-308, AC-309, AC-310
- Arquivos: src/features/painel/painel.tsx, src/features/corretoras/cadastro-corretora.tsx, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/movimentacoes-da-carteira.spec.ts, src/features/carteiras/movimentacoes-da-carteira.ts, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/posicoes-encerradas.spec.ts, src/features/carteiras/posicoes-encerradas.ts, src/features/carteiras/rentabilidade.spec.ts, src/features/carteiras/rentabilidade.ts, src/features/operacoes/disponivel-para-venda.ts, src/features/operacoes/editar-operacao.spec.tsx, src/features/operacoes/editar-operacao.tsx, src/features/operacoes/extrato-operacoes.spec.tsx, src/features/operacoes/extrato-operacoes.tsx, src/features/operacoes/formulario-operacao.spec.tsx, src/features/operacoes/formulario-operacao.tsx, src/features/operacoes/operacoes.model.ts, src/features/operacoes/operacoes.service.spec.ts, src/features/operacoes/operacoes.service.ts, src/features/operacoes/operacoes.spec.tsx, src/features/operacoes/operacoes.tsx, src/features/operacoes/preco-da-operacao.ts, src/features/operacoes/regras-da-operacao.spec.ts, src/features/operacoes/resultado-operacao.spec.tsx, src/features/operacoes/resultado-operacao.tsx, src/features/desempenho/desempenho.tsx, src/features/desempenho/desempenho.spec.tsx
- Notas: decisão do cliente em 2026-11-23. Cada correção entra junto do porte da área (T-134, T-136, T-137) e ganha teste próprio. O painel (AC-309) e o cadastro de corretora (AC-310) já saem nesta tarefa.

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Pesquisa](research.md)
