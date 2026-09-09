# Plano de execução — fundacao

> gerado por `onp-spec plano` em 2026-09-09 00:11 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano fundacao`

## Resumo — o que vai acontecer

- **12 tarefa(s) pendente(s)**: 12 em 12 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano fundacao --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/fundacao`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/fundacao-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-001 | Projeto Angular, Material, Vitest, proxy e estrutura de pastas | `claude-sonnet-5` | medium | `angular.json`, `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json`, `proxy.conf.json`, `onpspec.config.json`, `.gitignore`, `src/main.ts`, `src/index.html`, `src/app/app.ts`, `src/app/app.html`, `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/features/LEIA-ME.md` |

#### faixa-2 — branch `spec/fundacao-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-002 | Locale pt-BR, moeda e data | `claude-sonnet-5` | medium | `src/app/core/formatacao/formatacao.ts`, `src/app/core/formatacao/formatacao.spec.ts` |

#### faixa-3 — branch `spec/fundacao-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-003 | Tokens de cor e alternância de tema | `claude-sonnet-5` | medium | `src/styles.scss`, `src/styles/_tokens.scss`, `src/styles/_tema.scss`, `src/app/core/tema/tema.service.ts`, `src/app/core/tema/tema.service.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/fundacao-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-004 | Tipos do contrato da API | `claude-sonnet-5` | medium | `src/app/core/api/pagina.ts`, `src/app/core/api/erro-padrao.ts`, `src/app/core/api/api.spec.ts` |

#### faixa-5 — branch `spec/fundacao-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-005 | Sessão: modelo, armazenamento e estado | `claude-sonnet-5` | medium | `src/app/core/sessao/sessao.model.ts`, `src/app/core/sessao/sessao.service.ts`, `src/app/core/sessao/sessao.service.spec.ts` |

#### faixa-6 — branch `spec/fundacao-faixa-6` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-006 | Interceptor que envia o token | `claude-sonnet-5` | medium | `src/app/core/sessao/autenticacao.interceptor.ts`, `src/app/core/sessao/autenticacao.interceptor.spec.ts` |

### Onda 3 — faixa-7 ∥ faixa-8 ∥ faixa-9

#### faixa-7 — branch `spec/fundacao-faixa-7` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-7`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-007 | Guarda de rota das telas internas | `claude-sonnet-5` | medium | `src/app/core/sessao/sessao.guard.ts`, `src/app/core/sessao/sessao.guard.spec.ts` |

#### faixa-8 — branch `spec/fundacao-faixa-8` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-8`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-008 | Catálogo de erros e tradutor por código | `claude-sonnet-5` | medium | `src/app/core/erros/catalogo-erros.ts`, `src/app/core/erros/tradutor-erro.ts`, `src/app/core/erros/tradutor-erro.spec.ts` |

#### faixa-9 — branch `spec/fundacao-faixa-9` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-9`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-009 | Interceptor de erro que encerra a sessão | `claude-sonnet-5` | medium | `src/app/core/erros/erro.interceptor.ts`, `src/app/core/erros/erro.interceptor.spec.ts` |

### Onda 4 — faixa-10 ∥ faixa-11 ∥ faixa-12

#### faixa-10 — branch `spec/fundacao-faixa-10` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-10`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-010 | Componentes de feedback dos três níveis | `claude-sonnet-5` | medium | `src/app/core/feedback/feedback.model.ts`, `src/app/core/feedback/feedback.service.ts`, `src/app/core/feedback/mensagem-feedback.ts`, `src/app/core/feedback/mensagem-feedback.html`, `src/app/core/feedback/mensagem-feedback.scss`, `src/app/core/feedback/feedback.spec.ts` |

#### faixa-11 — branch `spec/fundacao-faixa-11` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-11`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-011 | Valor com horário e marcação de dado defasado | `claude-sonnet-5` | medium | `src/app/core/dados/idade-dado.ts`, `src/app/shared/valor-com-horario/valor-com-horario.ts`, `src/app/shared/valor-com-horario/valor-com-horario.html`, `src/app/shared/valor-com-horario/valor-com-horario.scss`, `src/app/shared/valor-com-horario/valor-com-horario.spec.ts` |

#### faixa-12 — branch `spec/fundacao-faixa-12` — worktree `../onp-worktrees/api-externa-frontend-v2-fundacao-faixa-12`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-012 | Variação com sinal, sem depender de cor | `claude-sonnet-5` | medium | `src/app/shared/variacao/variacao.ts`, `src/app/shared/variacao/variacao.html`, `src/app/shared/variacao/variacao.scss`, `src/app/shared/variacao/variacao.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/fundacao` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify fundacao` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/fundacao/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-fundacao-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo fundacao --tabela   # a tabela de andamento
onp-spec resumo fundacao            # o resumo em texto
```

