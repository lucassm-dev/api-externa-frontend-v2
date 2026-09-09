# Prompt de handoff para o Codex

> Cole o bloco abaixo como primeira mensagem. Ele é autossuficiente: não depende
> de nenhuma conversa anterior.

---

Você vai implementar a repaginação visual deste frontend Angular 22. **As decisões
já foram tomadas e as especificações já estão escritas.** Seu trabalho é
implementar, não redecidir.

## 1. Antes de escrever qualquer código, leia nesta ordem

1. `.spec/constituicao.md` — os princípios com verificação mecânica. P-003 e P-004
   afetam quase tudo que você vai tocar.
2. `docs/adr/README.md` — as dez decisões que restringem o que as telas podem
   prometer. **ADR-005 e ADR-010 são as que mais limitam esta feature.**
3. `docs/rfc/RFC-001-v1-estrategia-de-ui-e-bibliotecas.md` — por que não há
   Tailwind, por que não há biblioteca de gráficos, e as decisões D1 a D7.
4. `docs/rfc/RFC-002-v1-zard-ui-e-ngx-oneforall.md` — por que Zard UI foi recusado
   e qual é a fronteira de uso do `ngx-oneforall`.
5. `.spec/features/fundacao-visual/spec.md` e `tasks.md` — o que você vai
   construir agora.

As outras quatro features (`repaginacao-painel`, `repaginacao-tabelas`,
`repaginacao-acesso`, `repaginacao-desempenho`) já estão especificadas e
**dependem da `fundacao-visual`**. Não comece por elas.

## 2. Use as skills do projeto

- `.agents/skills/onp-spec-driven/SKILL.md` — o fluxo e o motor de auditoria.
- `.agents/skills/onp-ui-ux/SKILL.md` — as regras de UI e o motor de validação.

Leia as duas antes de começar. Os motores rodam assim, a partir da raiz:

```bash
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs <comando>
python3 .agents/skills/onp-ui-ux/scripts/onp_uiux.py validate src/ --ci
```

## 3. Cinco armadilhas já mapeadas — não caia nelas de novo

1. **Não rode `onp-spec scaffold`.** Ele gera `test/<feature>.spec.test.js` usando
   `node:test`, que neste projeto **nunca executa**: o `onpspec.config.json`
   procura testes em `src/**/*.spec.ts` e o comando é `npx ng test` (Vitest pelo
   builder do Angular). Escreva os testes você mesmo, ao lado do componente,
   com `TestBed` e o código de rastreio no título:
   `it('@spec:AC-221 o esqueleto ocupa a silhueta do conteúdo', ...)`.
   Veja `src/app/core/feedback/feedback.spec.ts` como modelo — há 211 testes já
   nessa convenção.

2. **Não rode `.spec/features/*/executar-tarefas.sh`.** Ele exige árvore limpa e
   parte do último commit; **este repositório não tem nenhum commit ainda**. No
   modo paralelo ele ainda cria worktrees sem rodar `npm install`, e com 269 MB de
   `node_modules` fora do git toda faixa falharia. Implemente as tarefas
   diretamente na árvore principal.

3. **Não commite sem o Lucas pedir.** O primeiro commit define o que entra na
   história do repositório, e essa escolha é dele.

4. **Não instale Tailwind, Zard UI, spartan/ui, PrimeNG nem biblioteca de
   gráficos.** Todas foram avaliadas e recusadas com motivo escrito nos dois RFCs.
   As únicas dependências novas autorizadas agora são `@lucide/angular` e
   `ngx-oneforall`.

5. **Não troque código já testado por equivalente de biblioteca.** `validadores.ts`,
   `cnpj.ts`, `autenticacao.interceptor.ts`, `sessao.guard.ts` e `tema.service.ts`
   ficam como estão. O `ngx-oneforall` só entra onde não existe código nosso, e
   só em peças folha: pipe, validador, diretiva, operador rxjs. Nada de
   interceptors, guards ou serviços de sessão dele.

## 4. O que implementar, nesta ordem

As 12 tarefas de `.spec/features/fundacao-visual/tasks.md`, de T-080 a T-091.
A ordem importa: T-080 instala as dependências que T-082 e T-089 importam, e
T-090 precisa do nível `sucesso` que T-082 cria.

Para cada tarefa: escreva o teste anotado primeiro, implemente até passar, e
marque o status com
`node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs tarefa fundacao-visual T-0xx concluida`.

## 5. Restrições que quebram o gate se você violar

- **Cor literal só em `src/styles/_tokens.scss`.** Nenhum `#hex`, `rgb()` ou
  `hsl()` em `src/app/**/*.scss` — há um regex no audit checando isso (P-003).
- **Nada de tempo real.** Todo preço é retrato datado; o carimbo "Atualizado às
  HH:MM" é obrigatório e não pode ser escondido por animação (ADR-005).
- **Nada de série histórica.** Proibido sparkline, gráfico de evolução, eixo de
  tempo e comparação com período anterior — o backend não guarda isso (ADR-010).
  É o motivo de não haver biblioteca de gráficos aqui.
- **Erro é tratado por código, nunca por texto.** Não compare nem faça `includes`
  na mensagem do servidor (P-004).
- **Nada é comunicado só por cor.** Alta e baixa levam sinal; todo selo tem texto.
- **Animação:** só `transform` e `opacity`, sempre com
  `@media (prefers-reduced-motion: reduce)` desligando (regras M02 e M04).
- **Alvo acionável:** mínimo 24×24 px; foco sempre visível (T01, F01, F02).

## 6. Decisões já tomadas — implemente assim, não reabra

- **Cor de destaque `#eaef1b`** (extraída de `docs/references/`): entra como
  **preenchimento com texto escuro por cima**, nunca como cor de texto — sobre o
  fundo claro ela dá 1,16:1. Papel: ação primária, chip ativo do ticker, realce de
  seleção, barra de progresso. O azul `--cor-acento` continua sendo link e foco.
  O destaque não entra em alta/baixa, que são semântica.
- **Logo de ativo:** monograma gerado a partir do ticker (`pipes/initials` do
  `ngx-oneforall`), com cor estável por hash sobre `--cor-serie-1..8`. Aceita SVG
  curado em `public/ativos/` por cima. **Nunca** buscar imagem do investidor10.
- **Notificação:** `MatSnackBar` com `MensagemFeedback` dentro. Sucesso some em
  ~5s; erro fica até dispensa manual, para não perder o código do erro.
- **Rótulo acessível (T-091):** `aria-label` explícito nos 11 campos, porque o
  `mat-label` do Material só vira associação em tempo de execução e o motor de UI
  analisa estaticamente.

## 7. Definição de pronto

A feature só fecha quando os quatro comandos abaixo passarem. Cole a saída dos
quatro ao terminar.

```bash
npx ng test
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs verify fundacao-visual
node .agents/skills/onp-spec-driven/scripts/onp-spec.mjs audit --ci
python3 .agents/skills/onp-ui-ux/scripts/onp_uiux.py validate src/ --ci
```

Referência do estado atual, para você saber se melhorou ou piorou:

- Testes hoje: **211 critérios de aceite, todos com teste e todos provados.** Não
  quebre nenhum.
- Motor de UI hoje: **55/100** — a11y 0, consistência 100, motion 100, responsivo
  100. Os 11 erros de a11y são os falso-positivos do Material que a T-091 resolve.
  Ao terminar, a11y deve estar em 100.
- Orçamento de bundle: 500 kB de aviso, 1 MB de erro. Confira depois de instalar
  as dependências (é a suposição ASM-052 da spec).

Se o audit falhar três vezes seguidas no mesmo problema, pare e relate — não
contorne o gate, não enfraqueça teste, não apague critério.

## 8. Referências visuais

`docs/references/` tem 12 capturas — Investidor10, StatusInvest e quatro mocks de
dashboard. Use para geometria: proporção de cartão, densidade de tabela, forma do
selo de variação, chip de cotação. **Atenção:** todas são tema claro, exceto o
mock cripto. O tema escuro não tem referência — desenhe a partir dos tokens.

E dois padrões que aparecem nelas e que você **não** pode copiar: os cartões do
StatusInvest trazem "+X% em relação ao mês anterior", e o mock cripto tem
sparkline por ativo. Os dois exigem série histórica, que o ADR-010 proíbe.
