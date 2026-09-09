# Plano de execução — repaginacao-tabelas

> gerado por `onp-spec plano` em 2026-09-09 17:53 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano repaginacao-tabelas`

## Resumo — o que vai acontecer

- **6 tarefa(s) pendente(s)**: 6 em 6 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano repaginacao-tabelas --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/repaginacao-tabelas`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/repaginacao-tabelas-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-097 | Dependência de tabela e ordenação compartilhada | `claude-sonnet-5` | high | `package.json`, `package-lock.json`, `src/app/shared/tabela/ordenacao.ts`, `src/app/shared/tabela/ordenacao.spec.ts` |

#### faixa-2 — branch `spec/repaginacao-tabelas-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-098 | Cabeçalho ordenável | `claude-sonnet-5` | medium | `src/app/shared/tabela/cabecalho-ordenavel.ts`, `src/app/shared/tabela/cabecalho-ordenavel.html`, `src/app/shared/tabela/cabecalho-ordenavel.scss`, `src/app/shared/tabela/cabecalho-ordenavel.spec.ts` |

#### faixa-3 — branch `spec/repaginacao-tabelas-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-099 | Estilo base de tabela | `claude-sonnet-5` | medium | `src/app/shared/tabela/tabela.scss` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/repaginacao-tabelas-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-100 | Extrato de operações | `claude-sonnet-5` | high | `src/app/features/operacoes/extrato/extrato-operacoes.ts`, `src/app/features/operacoes/extrato/extrato-operacoes.html`, `src/app/features/operacoes/extrato/extrato-operacoes.scss`, `src/app/features/operacoes/extrato/extrato-operacoes.spec.ts` |

#### faixa-5 — branch `spec/repaginacao-tabelas-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-101 | Posições e movimentações da carteira | `claude-sonnet-5` | high | `src/app/features/carteiras/detalhe/posicoes-carteira.ts`, `src/app/features/carteiras/detalhe/posicoes-carteira.html`, `src/app/features/carteiras/detalhe/posicoes-carteira.scss`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.ts`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.html`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.scss`, `src/app/features/carteiras/detalhe/posicoes-carteira.spec.ts`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.spec.ts` |

#### faixa-6 — branch `spec/repaginacao-tabelas-faixa-6` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-102 | Listas de ações, corretoras e carteiras | `claude-sonnet-5` | high | `src/app/features/acoes/lista/lista-acoes.ts`, `src/app/features/acoes/lista/lista-acoes.html`, `src/app/features/acoes/lista/lista-acoes.scss`, `src/app/features/corretoras/lista/lista-corretoras.ts`, `src/app/features/corretoras/lista/lista-corretoras.html`, `src/app/features/corretoras/lista/lista-corretoras.scss`, `src/app/features/carteiras/lista/lista-carteiras.ts`, `src/app/features/carteiras/lista/lista-carteiras.html`, `src/app/features/carteiras/lista/lista-carteiras.scss`, `src/app/features/acoes/lista/lista-acoes.spec.ts`, `src/app/features/corretoras/lista/lista-corretoras.spec.ts`, `src/app/features/carteiras/lista/lista-carteiras.spec.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/repaginacao-tabelas` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify repaginacao-tabelas` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/repaginacao-tabelas/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-repaginacao-tabelas-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo repaginacao-tabelas --tabela   # a tabela de andamento
onp-spec resumo repaginacao-tabelas            # o resumo em texto
```

