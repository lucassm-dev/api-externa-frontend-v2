# Plano de execução — acesso

> gerado por `onp-spec plano` em 2026-09-09 00:40 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano acesso`

## Resumo — o que vai acontecer

- **7 tarefa(s) pendente(s)**: 7 em 7 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano acesso --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/acesso`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/acesso-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-013 | Corrigir o contrato da sessão para o que o backend devolve | `claude-sonnet-5` | medium | `src/app/core/sessao/sessao.model.ts`, `src/app/core/sessao/sessao.service.ts`, `src/app/core/sessao/sessao.service.spec.ts`, `src/app/core/sessao/sessao.guard.spec.ts`, `src/app/core/sessao/autenticacao.interceptor.spec.ts`, `src/app/core/erros/erro.interceptor.spec.ts` |

#### faixa-2 — branch `spec/acesso-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-014 | Serviço de acesso: cadastrar e entrar | `claude-sonnet-5` | medium | `src/app/features/acesso/acesso.model.ts`, `src/app/features/acesso/acesso.service.ts`, `src/app/features/acesso/acesso.service.spec.ts` |

#### faixa-3 — branch `spec/acesso-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-015 | Validação no cliente: CPF, senha e e-mail | `claude-sonnet-5` | medium | `src/app/features/acesso/validadores.ts`, `src/app/features/acesso/validadores.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/acesso-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-016 | Tela de cadastro | `claude-sonnet-5` | medium | `src/app/features/acesso/cadastro/cadastro.ts`, `src/app/features/acesso/cadastro/cadastro.html`, `src/app/features/acesso/cadastro/cadastro.scss`, `src/app/features/acesso/cadastro/cadastro.spec.ts` |

#### faixa-5 — branch `spec/acesso-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-017 | Tela de login | `claude-sonnet-5` | medium | `src/app/features/acesso/login/login.ts`, `src/app/features/acesso/login/login.html`, `src/app/features/acesso/login/login.scss`, `src/app/features/acesso/login/login.spec.ts` |

#### faixa-6 — branch `spec/acesso-faixa-6` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-018 | Casca da área interna: sair e aviso de sessão acabando | `claude-sonnet-5` | medium | `src/app/layout/casca.ts`, `src/app/layout/casca.html`, `src/app/layout/casca.scss`, `src/app/layout/casca.spec.ts` |

### Onda 3 — faixa-7

#### faixa-7 — branch `spec/acesso-faixa-7` — worktree `../onp-worktrees/api-externa-frontend-v2-acesso-faixa-7`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-019 | Rotas de acesso e destino mínimo da área interna | `claude-sonnet-5` | medium | `src/app/app.routes.ts`, `src/app/features/acesso/acesso.routes.ts`, `src/app/features/painel/painel-provisorio.ts`, `src/app/features/acesso/acesso.routes.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/acesso` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify acesso` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/acesso/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-acesso-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo acesso --tabela   # a tabela de andamento
onp-spec resumo acesso            # o resumo em texto
```

