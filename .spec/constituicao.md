# Constituição — v1.2.0

<!--
  Princípios inegociáveis do projeto. Não são estilo: são restrições.
  P-xxx = princípio (código de rastreio, como US/AC/T).
  Níveis: [DEVE] obrigatório · [RECOMENDADO] forte · [PODE] permitido/explícito.
  Todo [DEVE] precisa de verificação executável — senão o audit acusa
  "princípio sem verificação" (PRINCIPIO_SEM_VERIFICACAO). Formatos:
    - verificação(gate): satisfeita pelo próprio audit (só p/ princípios "meta")
    - verificação(teste): @principle:P-xxx
    - verificação(proibido): `regex` em `glob`
    - verificação(obrigatório): `regex` em `glob`
-->

## P-001 [DEVE] Todo requisito tem prova executável

Nenhuma feature é declarada pronta sem o audit em modo CI sair limpo (exit 0).
Este princípio é verificado pelo próprio mecanismo do audit (AC_SEM_TESTE,
AC_SEM_PROVA, TASK_CONCLUIDA_SEM_PROVA) — não precisa de teste extra seu.

- verificação(gate): intrínseca ao audit

## P-002 [RECOMENDADO] Segredos nunca em código

Chaves e senhas vêm de variáveis de ambiente, nunca hard-coded. O padrão mira
valor que parece segredo — cadeia longa e sem espaços — e não a palavra
"senha", que neste produto é nome de campo de formulário.

- verificação(proibido): `(api[_-]?key|apikey|secret|password|senha|token)\s*[:=]\s*['"][^'"\s]{20,}['"]` em `src/app/**/*.ts`

## P-003 [DEVE] Cor do produto vem dos tokens, nunca da tela

Nenhum componente ou folha de estilo de tela define cor literal (hex, `rgb()`,
`hsl()`). As cores vivem em `src/styles/_tokens.scss`, em claro e escuro, e as
telas consomem variáveis. É o que permite os dois temas obrigatórios (PRD-001)
sem caçar cor solta.

- verificação(proibido): `(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()` em `src/app/**/*.scss`

## P-004 [DEVE] Erro é tratado por código, nunca por texto

O frontend decide o comportamento olhando o `codigo` do erro. Comparar,
procurar dentro ou casar padrão no texto da mensagem do servidor é proibido —
o texto muda e a tela quebra (ADR-009). Exibir o texto do servidor como
conteúdo continua permitido (é o que COR-003 exige).

- verificação(proibido): `\.message\s*(===|==|!==|!=)|\.message\.(includes|indexOf|match|startsWith|search)\(` em `src/app/**/*.ts`
