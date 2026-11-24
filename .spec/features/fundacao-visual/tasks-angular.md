# Tasks: Fundacao visual

> feature: fundacao-visual

## T-080 — Dependências da repaginação [concluida]
- Refs: US-057, US-058, AC-215, AC-218
- Arquivos: package.json, package-lock.json
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: instala `@lucide/angular` (RFC-001) e `ngx-oneforall` (RFC-002). Bloqueia
  todas as outras tarefas. Conferir o orçamento de bundle depois do build
  (ASM-052). `@tanstack/angular-table` e `balloons-js` NÃO entram aqui — são das
  features seguintes.

## T-081 — Tokens de sucesso, barra de mercado e sombra [concluida]
- Refs: US-060, AC-226, AC-227, AC-232
- Arquivos: src/styles/_tokens.scss, src/styles/_tema.scss, src/styles/tokens.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: acrescenta `--cor-sucesso-borda/-fundo/-texto`,
  `--cor-barra-mercado-fundo/-texto/-borda/-fraco` e o par de destaque
  `--cor-destaque: #eaef1b` / `--cor-destaque-texto` (escuro) nos dois temas,
  mais escala de sombra em `_tema.scss`. O teste lê `_tokens.scss`, converte os
  pares texto/fundo e calcula o contraste WCAG — é a prova do AC-226 e do
  AC-232, e é o que impede escolher cor "que parece boa". Único arquivo do
  produto onde cor é escrita (P-003).
  O destaque tem papel definido: preenchimento de ação primária, chip ativo do
  ticker, realce de seleção e barra de progresso. O azul (`--cor-acento`)
  continua sendo link e foco. O destaque **nunca** vira cor de texto sobre os
  fundos do produto, e nunca entra em alta/baixa, que são semântica.

## T-082 — Nível sucesso e ícones no feedback [concluida]
- Refs: US-056, US-057, AC-212, AC-214, AC-215
- Arquivos: src/app/core/feedback/feedback.model.ts, src/app/core/feedback/mensagem-feedback.ts, src/app/core/feedback/mensagem-feedback.html, src/app/core/feedback/mensagem-feedback.scss, src/app/core/feedback/feedback.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: acrescenta `sucesso` ao `NivelFeedback` e troca os caracteres `i`/`!`/`×`
  por ícones do Lucide, mantendo o rótulo textual de cada nível (ADR-006: aviso
  nunca parece erro, e nada é comunicado só por cor). O ícone é decorativo; quem
  nomeia é o rótulo.

## T-083 — Primitiva: cartão [concluida]
- Refs: US-059, AC-225
- Arquivos: src/app/shared/cartao/cartao.ts, src/app/shared/cartao/cartao.html, src/app/shared/cartao/cartao.scss, src/app/shared/cartao/cartao.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: moldura padrão de bloco — cabeçalho de seção, apoio opcional, região de
  conteúdo e rodapé de ações. Referência de geometria: cartões do Investidor10 e
  do StatusInvest em `docs/references/`.

## T-084 — Primitiva: selo de situação [concluida]
- Refs: US-059, AC-222
- Arquivos: src/app/shared/selo/selo.ts, src/app/shared/selo/selo.html, src/app/shared/selo/selo.scss, src/app/shared/selo/selo.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: variantes alta, baixa, estável, sucesso, aviso e erro. Fundo tonal +
  seta + texto, no padrão observado no Investidor10 (`6,80% ▲`). Texto sempre
  presente — a cor acompanha, nunca carrega sozinha.

## T-085 — Primitiva: esqueleto de carregamento [concluida]
- Refs: US-059, US-061, AC-221, AC-229, AC-230
- Arquivos: src/app/shared/esqueleto/esqueleto.ts, src/app/shared/esqueleto/esqueleto.html, src/app/shared/esqueleto/esqueleto.scss, src/app/shared/esqueleto/esqueleto.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: substitui os três `<span>` vazios espalhados hoje. Aceita formato
  (linha, bloco, tabela) para casar com a silhueta do conteúdo. `aria-hidden`.
  O brilho anima só `transform`/`opacity` e some sob `prefers-reduced-motion` —
  é o que prova AC-229 e AC-230.

## T-086 — Primitiva: estado vazio [concluida]
- Refs: US-059, AC-223
- Arquivos: src/app/shared/estado-vazio/estado-vazio.ts, src/app/shared/estado-vazio/estado-vazio.html, src/app/shared/estado-vazio/estado-vazio.scss, src/app/shared/estado-vazio/estado-vazio.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: ícone, explicação e próximo passo. Substitui os `<p class="vazio">`
  atuais. Conversa com `proximo-passo.ts` do painel, mas não o substitui.

## T-087 — Primitiva: paginador [concluida]
- Refs: US-059, AC-224
- Arquivos: src/app/shared/paginador/paginador.ts, src/app/shared/paginador/paginador.html, src/app/shared/paginador/paginador.scss, src/app/shared/paginador/paginador.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: página atual, total de páginas e faixa exibida ("1–10 de 135"),
  desabilitando nas pontas. Só apresentação — a busca continua paginada pelo
  servidor, sem filtro (ADR-010). Substitui os dois botões do extrato.

## T-088 — Primitiva: botão de ícone [concluida]
- Refs: US-057, US-060, AC-216, AC-217, AC-228
- Arquivos: src/app/shared/botao-icone/botao-icone.ts, src/app/shared/botao-icone/botao-icone.html, src/app/shared/botao-icone/botao-icone.scss, src/app/shared/botao-icone/botao-icone.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: exige nome acessível como entrada obrigatória — sem ele o componente não
  compila. Área acionável de no mínimo 24px mesmo com ícone menor, e foco
  visível. É o que permite trocar "Editar"/"Excluir" por ícones no extrato sem
  perder acessibilidade.

## T-089 — Monograma do ativo [concluida]
- Refs: US-058, AC-218, AC-219, AC-220
- Arquivos: src/app/shared/monograma/monograma.ts, src/app/shared/monograma/monograma.html, src/app/shared/monograma/monograma.scss, src/app/shared/monograma/monograma.spec.ts
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: iniciais via `pipes/initials` do `ngx-oneforall` (ASM-051) e cor por
  hash estável do ticker sobre `--cor-serie-1..8`. Resolve o D1 do RFC-001 sem
  hotlink de logo de terceiro. Aceita logo curado em `public/ativos/` por cima,
  quando existir.

## T-090 — Notificação temporária de ação concluída [concluida]
- Refs: US-056, AC-213, AC-214
- Arquivos: src/app/core/feedback/notificacao.service.ts, src/app/core/feedback/notificacao.service.spec.ts
- Modelo: claude-sonnet-5
- Esforço: alto
- Notas: Q-027 e Q-028 respondidas. Usa `MatSnackBar` com `MensagemFeedback` como
  conteúdo, para não criar um segundo vocabulário de comunicação — o tema do
  Material é sobrescrito pelos tokens. Sucesso desaparece sozinho em ~5s; erro
  permanece até dispensa manual, para que mensagem e código (P-004) não se
  percam. Depende de T-082 (o nível `sucesso` precisa existir antes).

## T-091 — Rótulo acessível verificável nos campos de formulário [concluida]
- Refs: US-062, AC-231
- Arquivos: src/app/features/acesso/cadastro/cadastro.html, src/app/features/acesso/login/login.html, src/app/features/acoes/cadastro/cadastro-acao.html, src/app/features/acoes/lista/lista-acoes.html, src/app/features/carteiras/criacao/criar-carteira.html, src/app/features/corretoras/cadastro/cadastro-corretora.html, src/app/features/corretoras/lista/lista-corretoras.html, src/app/shared/nome-acessivel.spec.ts
- Modelo: claude-sonnet-5
- Esforço: baixo
- Notas: resposta de Q-026. Acrescenta `aria-label` a 11 campos em 7 arquivos, com
  o mesmo texto do `mat-label` correspondente. O `mat-label` do Angular Material
  só vira associação em tempo de execução, e o motor de UI analisa estaticamente —
  sem isso o gate nunca sai limpo. **Só o rótulo muda**: nenhuma outra alteração
  nessas telas, que pertencem a outras features já provadas.

<!-- nota da T-091: a prova do AC-231 é `src/app/shared/nome-acessivel.spec.ts`,
     que lê os templates do produto e falha se algum `<input>` ou `<select>`
     estiver sem nome acessível declarado no próprio arquivo. É teste de
     convenção, não de componente — protege a regra contra regressão futura,
     que é o que o `aria-label` isolado não faria. -->
