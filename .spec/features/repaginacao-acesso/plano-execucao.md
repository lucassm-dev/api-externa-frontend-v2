# Plano de execução — repaginacao-acesso

> gerado por `onp-spec plano` em 2026-09-09 17:53 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano repaginacao-acesso`

## Resumo — o que vai acontecer

- **4 tarefa(s) pendente(s)**: 4 em 4 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano repaginacao-acesso --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/repaginacao-acesso`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/repaginacao-acesso-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-acesso-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-103 | Moldura da tela de acesso | `claude-sonnet-5` | high | `src/app/features/acesso/moldura-acesso.ts`, `src/app/features/acesso/moldura-acesso.html`, `src/app/features/acesso/moldura-acesso.scss`, `src/app/features/acesso/moldura-acesso.spec.ts` |

#### faixa-2 — branch `spec/repaginacao-acesso-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-acesso-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-104 | Medidor de força de senha | `claude-sonnet-5` | medium | `src/app/features/acesso/forca-da-senha.ts`, `src/app/features/acesso/forca-da-senha.html`, `src/app/features/acesso/forca-da-senha.scss`, `src/app/features/acesso/forca-da-senha.spec.ts` |

#### faixa-3 — branch `spec/repaginacao-acesso-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-acesso-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-105 | Tela de login | `claude-sonnet-5` | high | `src/app/features/acesso/login/login.ts`, `src/app/features/acesso/login/login.html`, `src/app/features/acesso/login/login.scss`, `src/app/features/acesso/login/login.spec.ts` |

### Onda 2 — faixa-4

#### faixa-4 — branch `spec/repaginacao-acesso-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-acesso-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-106 | Tela de cadastro | `claude-sonnet-5` | high | `src/app/features/acesso/cadastro/cadastro.ts`, `src/app/features/acesso/cadastro/cadastro.html`, `src/app/features/acesso/cadastro/cadastro.scss`, `src/app/features/acesso/cadastro/cadastro.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/repaginacao-acesso` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify repaginacao-acesso` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/repaginacao-acesso/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-repaginacao-acesso-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo repaginacao-acesso --tabela   # a tabela de andamento
onp-spec resumo repaginacao-acesso            # o resumo em texto
```

