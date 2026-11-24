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
- Arquivos: web/package.json, web/vite.config.ts, web/tsconfig.json, web/index.html, web/components.json, web/src/main.tsx, web/src/styles/tokens.css, web/src/styles/global.css, web/src/lib/utils.ts, web/src/test/setup.ts, web/src/styles/tokens.spec.ts, onpspec.config.json
- Notas: porta `_tokens.scss` e `_tema.scss` para CSS (claro/escuro com `[data-tema='escuro']`), desliga a paleta do Tailwind e mapeia as variáveis do shadcn nos tokens. Proxy do Vite igual ao `proxy.conf.json` (ASM-073). O `testCommand` passa a rodar as duas suítes em TAP. Porta `styles/tokens.spec.ts` e `styles/movimento.spec.ts`.

## T-128 — Porta o núcleo: api, erros, sessão, feedback, formatação, dados e tema [concluida]

- Refs: US-083, AC-299
- Arquivos: web/src/core/api/api.spec.ts, web/src/core/api/erro-padrao.ts, web/src/core/api/http.ts, web/src/core/api/pagina.ts, web/src/core/erros/catalogo-erros.ts, web/src/core/erros/erro-em-formulario.ts, web/src/core/erros/erro-na-requisicao.spec.ts, web/src/core/erros/tradutor-erro.spec.ts, web/src/core/erros/tradutor-erro.ts, web/src/core/sessao/autenticacao.spec.ts, web/src/core/sessao/sessao.guard.ts, web/src/core/sessao/sessao.model.ts, web/src/core/sessao/sessao.service.spec.ts, web/src/core/sessao/sessao.service.ts, web/src/core/feedback/feedback.model.ts, web/src/core/feedback/feedback.service.ts, web/src/core/feedback/feedback.spec.tsx, web/src/core/feedback/mensagem-feedback.tsx, web/src/core/feedback/notificacao.spec.tsx, web/src/core/feedback/notificacao.tsx, web/src/core/feedback/painel-feedback.tsx, web/src/core/formatacao/formatacao.spec.ts, web/src/core/formatacao/formatacao.ts, web/src/core/dados/idade-dado.ts, web/src/core/tema/tema.service.spec.ts, web/src/core/tema/tema.service.ts, web/src/core/navegacao.ts, web/src/test/servidor.ts
- Notas: lógica idêntica. O `HttpClient` com interceptores vira um cliente `fetch` que injeta o token e traduz o erro pelo catálogo (P-004, ADR-009). O `MatSnackBar` vira sonner. Porta os testes de `src/app/core/**`.

## T-129 — Porta as primitivas compartilhadas para o kit [concluida]

- Refs: US-084, AC-303, AC-302
- Arquivos: web/src/components/ui/botao-icone.tsx, web/src/components/ui/botao.spec.tsx, web/src/components/ui/botao.tsx, web/src/components/ui/caixa-de-marcar.tsx, web/src/components/ui/campo.tsx, web/src/components/ui/cartao.tsx, web/src/components/ui/contagem-numero.tsx, web/src/components/ui/dialogo-confirmacao.tsx, web/src/components/ui/esqueleto.tsx, web/src/components/ui/holofote.tsx, web/src/components/ui/kit-nas-telas.spec.ts, web/src/components/ui/kit.spec.tsx, web/src/components/ui/marquee.tsx, web/src/components/ui/movimento.css, web/src/components/ui/nome-acessivel.spec.ts, web/src/components/ui/padrao-unico.spec.ts, web/src/components/ui/paginador.tsx, web/src/components/ui/selecao.tsx, web/src/components/ui/selo.tsx, web/src/components/ui/tabela.css, web/src/components/ui/tabela.spec.tsx, web/src/components/ui/tabela.tsx, web/src/shared/estado-vazio.tsx, web/src/shared/monograma.tsx, web/src/shared/ordenacao.spec.ts, web/src/shared/ordenacao.ts, web/src/shared/shared.spec.tsx, web/src/shared/valor-com-horario.tsx, web/src/shared/variacao.tsx, web/src/shared/visibilidade-senha.tsx, web/src/lib/movimento.ts, web/src/test/tailwind.ts
- Notas: botão, botão-ícone, cartão, confirmação, esqueleto, estado vazio, monograma (iniciais sem ngx-oneforall), paginador, selo, tabela (TanStack React), valor com horário, variação, visibilidade da senha. Porta os testes de `src/app/shared/**`.

## T-130 — Porta a casca, as rotas e a guarda de sessão [concluida]

- Refs: US-083, AC-299
- Arquivos: web/src/app.tsx, web/src/rotas.tsx, web/src/layout/areas.ts, web/src/layout/casca.spec.tsx, web/src/layout/casca.tsx, web/src/test/rotas.tsx
- Notas: react-router com rotas carregadas sob demanda, guarda de sessão e redirecionamentos iguais a `app.routes.ts`. Porta `app.spec.ts` e `layout/casca.spec.ts`.

## T-131 — Porta acesso: login e cadastro [concluida]

- Refs: US-083, AC-302, AC-303
- Arquivos: web/src/features/acesso/acesso.model.ts, web/src/features/acesso/acesso.spec.ts, web/src/features/acesso/acesso.ts, web/src/features/acesso/cadastro.spec.tsx, web/src/features/acesso/cadastro.tsx, web/src/features/acesso/cartao-acesso.tsx, web/src/features/acesso/forca-da-senha.tsx, web/src/features/acesso/login.spec.tsx, web/src/features/acesso/login.tsx, web/src/features/acesso/moldura-acesso.tsx, web/src/features/acesso/moldura-e-forca.spec.tsx, web/src/features/acesso/validadores.ts, web/src/features/acesso/visitante.ts, web/src/lib/formulario.ts, web/src/test/telas-acesso.tsx
- Notas: inclui moldura de acesso com fundo Aceternity (parado com movimento reduzido), força e confirmação da senha (validadores reescritos sem ngx-oneforall).

## T-132 — Porta o painel [concluida]

- Refs: US-083, AC-302, AC-303
- Arquivos: web/src/features/painel/blocos/barra-mercado.spec.tsx, web/src/features/painel/blocos/barra-mercado.tsx, web/src/features/painel/blocos/consolidado.spec.tsx, web/src/features/painel/blocos/consolidado.tsx, web/src/features/painel/blocos/outros-blocos.spec.tsx, web/src/features/painel/blocos/outros-blocos.tsx, web/src/features/painel/carteira-preferida.spec.ts, web/src/features/painel/carteira-preferida.ts, web/src/features/painel/painel.model.ts, web/src/features/painel/painel.service.spec.ts, web/src/features/painel/painel.service.ts, web/src/features/painel/painel.spec.tsx, web/src/features/painel/painel.tsx, web/src/features/painel/proximo-passo.spec.ts, web/src/features/painel/proximo-passo.ts
- Notas: barra de cotações com o Marquee do Magic UI (sem borda e sem horário, decisão de 2026-11-15), números do consolidado com NumberTicker.

## T-133 — Porta corretoras [concluida]

- Refs: US-083, AC-303
- Arquivos: web/src/features/corretoras/cadastro-corretora.tsx, web/src/features/corretoras/cnpj.spec.ts, web/src/features/corretoras/cnpj.ts, web/src/features/corretoras/corretoras.model.ts, web/src/features/corretoras/corretoras.service.ts, web/src/features/corretoras/corretoras.spec.tsx, web/src/features/corretoras/detalhe-corretora.tsx, web/src/features/corretoras/lista-corretoras.tsx, web/src/features/corretoras/selo-de-uso.spec.ts, web/src/features/corretoras/selo-de-uso.ts

## T-134 — Porta carteiras [concluida]

- Refs: US-083, AC-303
- Arquivos: web/src/features/carteiras/carteiras.model.ts, web/src/features/carteiras/carteiras.service.spec.ts, web/src/features/carteiras/carteiras.service.ts, web/src/features/carteiras/criar-carteira.tsx, web/src/features/carteiras/detalhe-carteira.tsx, web/src/features/carteiras/detalhe.spec.tsx, web/src/features/carteiras/lista-carteiras.tsx, web/src/features/carteiras/lista-e-criacao.spec.tsx, web/src/features/carteiras/movimentacoes-carteira.tsx, web/src/features/carteiras/movimentacoes-da-carteira.spec.ts, web/src/features/carteiras/movimentacoes-da-carteira.ts, web/src/features/carteiras/posicoes-carteira.tsx, web/src/features/carteiras/posicoes-encerradas.spec.ts, web/src/features/carteiras/posicoes-encerradas.ts, web/src/features/carteiras/rentabilidade.spec.ts, web/src/features/carteiras/rentabilidade.ts

## T-135 — Porta ações [concluida]

- Refs: US-083, AC-303
- Arquivos: web/src/features/acoes/acoes.model.ts, web/src/features/acoes/acoes.service.ts, web/src/features/acoes/acoes.spec.tsx, web/src/features/acoes/cadastro-acao.tsx, web/src/features/acoes/desfecho-cotacao.spec.ts, web/src/features/acoes/desfecho-cotacao.ts, web/src/features/acoes/detalhe-acao.tsx, web/src/features/acoes/lista-acoes.tsx

## T-136 — Porta operações [concluida]

- Refs: US-083, AC-303
- Arquivos: web/src/features/operacoes/disponivel-para-venda.ts, web/src/features/operacoes/editar-operacao.spec.tsx, web/src/features/operacoes/editar-operacao.tsx, web/src/features/operacoes/extrato-operacoes.spec.tsx, web/src/features/operacoes/extrato-operacoes.tsx, web/src/features/operacoes/formulario-operacao.spec.tsx, web/src/features/operacoes/formulario-operacao.tsx, web/src/features/operacoes/operacoes.model.ts, web/src/features/operacoes/operacoes.service.spec.ts, web/src/features/operacoes/operacoes.service.ts, web/src/features/operacoes/operacoes.spec.tsx, web/src/features/operacoes/operacoes.tsx, web/src/features/operacoes/preco-da-operacao.ts, web/src/features/operacoes/regras-da-operacao.spec.ts, web/src/features/operacoes/resultado-operacao.spec.tsx, web/src/features/operacoes/resultado-operacao.tsx, web/src/components/ui/grupo-de-opcoes.tsx, web/src/components/ui/campo.tsx, web/src/components/ui/selecao.tsx, web/src/features/acoes/acoes.service.ts, web/src/rotas.tsx

## T-137 — Porta desempenho [concluida]

- Refs: US-083, AC-303
- Arquivos: web/src/features/desempenho/blocos/blocos-do-mapa.spec.ts, web/src/features/desempenho/blocos/blocos-do-mapa.ts, web/src/features/desempenho/blocos/concentracao-da-carteira.spec.ts, web/src/features/desempenho/blocos/concentracao-da-carteira.ts, web/src/features/desempenho/blocos/confissoes-desempenho.spec.tsx, web/src/features/desempenho/blocos/confissoes-desempenho.tsx, web/src/features/desempenho/blocos/grafico-composicao.spec.tsx, web/src/features/desempenho/blocos/grafico-composicao.tsx, web/src/features/desempenho/blocos/grafico-concentracao.spec.tsx, web/src/features/desempenho/blocos/grafico-concentracao.tsx, web/src/features/desempenho/blocos/grafico-contribuicao.spec.tsx, web/src/features/desempenho/blocos/grafico-contribuicao.tsx, web/src/features/desempenho/blocos/grafico-investido-mercado.spec.tsx, web/src/features/desempenho/blocos/grafico-investido-mercado.tsx, web/src/features/desempenho/blocos/grafico-mapa-posicoes.spec.tsx, web/src/features/desempenho/blocos/grafico-mapa-posicoes.tsx, web/src/features/desempenho/blocos/grafico-quadrante.spec.tsx, web/src/features/desempenho/blocos/grafico-quadrante.tsx, web/src/features/desempenho/blocos/grafico-realizado.spec.tsx, web/src/features/desempenho/blocos/grafico-realizado.tsx, web/src/features/desempenho/blocos/numeros-desempenho.spec.tsx, web/src/features/desempenho/blocos/numeros-desempenho.tsx, web/src/features/desempenho/blocos/setores-da-rosca.spec.ts, web/src/features/desempenho/blocos/setores-da-rosca.ts, web/src/features/desempenho/composicao.spec.ts, web/src/features/desempenho/composicao.ts, web/src/features/desempenho/contribuicao.spec.ts, web/src/features/desempenho/contribuicao.ts, web/src/features/desempenho/desempenho.model.ts, web/src/features/desempenho/desempenho.service.spec.ts, web/src/features/desempenho/desempenho.service.ts, web/src/features/desempenho/desempenho.spec.tsx, web/src/features/desempenho/desempenho.tsx, web/src/features/desempenho/idade-das-cotacoes.spec.ts, web/src/features/desempenho/idade-das-cotacoes.ts, web/src/features/desempenho/moeda-das-posicoes.spec.ts, web/src/features/desempenho/moeda-das-posicoes.ts, web/src/features/desempenho/realizado-por-ticker.spec.ts, web/src/features/desempenho/realizado-por-ticker.ts, web/src/features/desempenho/resultados.spec.ts, web/src/features/desempenho/resultados.ts, web/src/rotas.tsx
- Notas: gráficos continuam SVG próprios (ADR-010: sem série histórica, sem biblioteca de gráfico).

## T-138 — Corte final: remove o Angular e promove o React à raiz [pendente]

- Refs: US-083, AC-305
- Arquivos: package.json, package-lock.json, angular.json, tsconfig.json, tsconfig.app.json, tsconfig.spec.json, proxy.conf.json, src, web, onpspec.config.json, README.md
- Notas: só com 298/298 critérios antigos provados pela suíte React. Depende da resposta da Q-040 para a linha de verificação do P-003. `docs/prompt-codex.md` e os RFCs ficam preservados como histórico.

## T-139 — Corrige no React os bugs achados no Angular [concluida]

- Refs: US-085, AC-306, AC-307, AC-308, AC-309, AC-310
- Arquivos: web/src/features/painel/painel.tsx, web/src/features/corretoras/cadastro-corretora.tsx, web/src/features/carteiras/carteiras.model.ts, web/src/features/carteiras/carteiras.service.spec.ts, web/src/features/carteiras/carteiras.service.ts, web/src/features/carteiras/criar-carteira.tsx, web/src/features/carteiras/detalhe-carteira.tsx, web/src/features/carteiras/detalhe.spec.tsx, web/src/features/carteiras/lista-carteiras.tsx, web/src/features/carteiras/lista-e-criacao.spec.tsx, web/src/features/carteiras/movimentacoes-carteira.tsx, web/src/features/carteiras/movimentacoes-da-carteira.spec.ts, web/src/features/carteiras/movimentacoes-da-carteira.ts, web/src/features/carteiras/posicoes-carteira.tsx, web/src/features/carteiras/posicoes-encerradas.spec.ts, web/src/features/carteiras/posicoes-encerradas.ts, web/src/features/carteiras/rentabilidade.spec.ts, web/src/features/carteiras/rentabilidade.ts, web/src/features/operacoes/disponivel-para-venda.ts, web/src/features/operacoes/editar-operacao.spec.tsx, web/src/features/operacoes/editar-operacao.tsx, web/src/features/operacoes/extrato-operacoes.spec.tsx, web/src/features/operacoes/extrato-operacoes.tsx, web/src/features/operacoes/formulario-operacao.spec.tsx, web/src/features/operacoes/formulario-operacao.tsx, web/src/features/operacoes/operacoes.model.ts, web/src/features/operacoes/operacoes.service.spec.ts, web/src/features/operacoes/operacoes.service.ts, web/src/features/operacoes/operacoes.spec.tsx, web/src/features/operacoes/operacoes.tsx, web/src/features/operacoes/preco-da-operacao.ts, web/src/features/operacoes/regras-da-operacao.spec.ts, web/src/features/operacoes/resultado-operacao.spec.tsx, web/src/features/operacoes/resultado-operacao.tsx, web/src/features/desempenho/desempenho.tsx, web/src/features/desempenho/desempenho.spec.tsx
- Notas: decisão do cliente em 2026-11-23. Cada correção entra junto do porte da área (T-134, T-136, T-137) e ganha teste próprio. O painel (AC-309) e o cadastro de corretora (AC-310) já saem nesta tarefa.

## Documentos relacionados

[PRD](prd.md) · [ADR](adr.md) · [TDD](design.md) · [Spec](spec.md) · [Pesquisa](research.md)
