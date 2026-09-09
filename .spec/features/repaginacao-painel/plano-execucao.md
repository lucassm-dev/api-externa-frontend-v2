# Plano de execução — repaginacao-painel

> gerado por `onp-spec plano` em 2026-09-09 17:53 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano repaginacao-painel`

## Resumo — o que vai acontecer

- **5 tarefa(s) pendente(s)**: 5 em 5 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano repaginacao-painel --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/repaginacao-painel`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/repaginacao-painel-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-092 | Barra de mercado: chips, superfície escura e rolagem | `claude-sonnet-5` | high | `src/app/features/painel/blocos/barra-mercado.ts`, `src/app/features/painel/blocos/barra-mercado.html`, `src/app/features/painel/blocos/barra-mercado.scss`, `src/app/features/painel/blocos/barra-mercado.spec.ts` |

#### faixa-2 — branch `spec/repaginacao-painel-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-093 | Consolidado com hierarquia de número | `claude-sonnet-5` | medium | `src/app/features/painel/blocos/consolidado.ts`, `src/app/features/painel/blocos/consolidado.html`, `src/app/features/painel/blocos/consolidado.scss`, `src/app/features/painel/blocos/consolidado.spec.ts` |

#### faixa-3 — branch `spec/repaginacao-painel-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-094 | Últimas movimentações com monograma e selo | `claude-sonnet-5` | medium | `src/app/features/painel/blocos/ultimas-movimentacoes.ts`, `src/app/features/painel/blocos/ultimas-movimentacoes.html`, `src/app/features/painel/blocos/ultimas-movimentacoes.scss`, `src/app/features/painel/blocos/ultimas-movimentacoes.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5

#### faixa-4 — branch `spec/repaginacao-painel-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-095 | Carteiras e convite ao próximo passo | `claude-sonnet-5` | medium | `src/app/features/painel/blocos/carteiras-do-investidor.ts`, `src/app/features/painel/blocos/carteiras-do-investidor.html`, `src/app/features/painel/blocos/carteiras-do-investidor.scss`, `src/app/features/painel/blocos/convite-proximo-passo.ts`, `src/app/features/painel/blocos/convite-proximo-passo.html`, `src/app/features/painel/blocos/convite-proximo-passo.scss`, `src/app/features/painel/blocos/carteiras-do-investidor.spec.ts`, `src/app/features/painel/blocos/convite-proximo-passo.spec.ts` |

#### faixa-5 — branch `spec/repaginacao-painel-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-096 | Composição da tela do painel | `claude-sonnet-5` | low | `src/app/features/painel/painel.html`, `src/app/features/painel/painel.scss`, `src/app/features/painel/painel.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/repaginacao-painel` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify repaginacao-painel` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/repaginacao-painel/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-repaginacao-painel-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo repaginacao-painel --tabela   # a tabela de andamento
onp-spec resumo repaginacao-painel            # o resumo em texto
```

