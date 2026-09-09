# Plano de execução — operacoes

> gerado por `onp-spec plano` em 2026-09-09 04:38 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano operacoes`

## Resumo — o que vai acontecer

- **10 tarefa(s) pendente(s)**: 10 em 10 faixa(s) paralela(s) + 0 sequencial(is)
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano operacoes --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/operacoes`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/operacoes-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-055 | Contratos e serviço de operações | `claude-sonnet-5` | medium | `src/app/features/operacoes/operacoes.model.ts`, `src/app/features/operacoes/operacoes.service.ts`, `src/app/features/operacoes/operacoes.service.spec.ts` |

#### faixa-2 — branch `spec/operacoes-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-056 | Preço da operação: estimativa e casas decimais | `claude-sonnet-5` | low | `src/app/features/operacoes/preco-da-operacao.ts`, `src/app/features/operacoes/preco-da-operacao.spec.ts` |

#### faixa-3 — branch `spec/operacoes-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-057 | Disponível para venda: derivação pura | `claude-sonnet-5` | low | `src/app/features/operacoes/disponivel-para-venda.ts`, `src/app/features/operacoes/disponivel-para-venda.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/operacoes-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-058 | Formulário de compra e venda | `claude-sonnet-5` | high | `src/app/features/operacoes/formulario/formulario-operacao.ts`, `src/app/features/operacoes/formulario/formulario-operacao.html`, `src/app/features/operacoes/formulario/formulario-operacao.scss`, `src/app/features/operacoes/formulario/formulario-operacao.spec.ts` |

#### faixa-5 — branch `spec/operacoes-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-059 | Resultado da operação: registrada, com avisos que não são erro | `claude-sonnet-5` | medium | `src/app/features/operacoes/resultado/resultado-operacao.ts`, `src/app/features/operacoes/resultado/resultado-operacao.html`, `src/app/features/operacoes/resultado/resultado-operacao.scss`, `src/app/features/operacoes/resultado/resultado-operacao.spec.ts` |

#### faixa-6 — branch `spec/operacoes-faixa-6` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-060 | Extrato paginado, sem filtro nenhum | `claude-sonnet-5` | high | `src/app/features/operacoes/extrato/extrato-operacoes.ts`, `src/app/features/operacoes/extrato/extrato-operacoes.html`, `src/app/features/operacoes/extrato/extrato-operacoes.scss`, `src/app/features/operacoes/extrato/extrato-operacoes.spec.ts` |

### Onda 3 — faixa-7 ∥ faixa-8 ∥ faixa-9

#### faixa-7 — branch `spec/operacoes-faixa-7` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-7`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-061 | Edição de quantidade e preço | `claude-sonnet-5` | medium | `src/app/features/operacoes/edicao/editar-operacao.ts`, `src/app/features/operacoes/edicao/editar-operacao.html`, `src/app/features/operacoes/edicao/editar-operacao.scss`, `src/app/features/operacoes/edicao/editar-operacao.spec.ts` |

#### faixa-8 — branch `spec/operacoes-faixa-8` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-8`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-062 | Tela de operações: formulário no topo, extrato abaixo | `claude-sonnet-5` | high | `src/app/features/operacoes/operacoes.ts`, `src/app/features/operacoes/operacoes.html`, `src/app/features/operacoes/operacoes.scss`, `src/app/features/operacoes/operacoes.spec.ts` |

#### faixa-9 — branch `spec/operacoes-faixa-9` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-9`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-063 | Editar e excluir a partir da carteira, com os números recalculados | `claude-sonnet-5` | medium | `src/app/features/carteiras/detalhe/movimentacoes-carteira.ts`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.html`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.spec.ts`, `src/app/features/carteiras/detalhe/detalhe-carteira.ts`, `src/app/features/carteiras/detalhe/detalhe-carteira.html`, `src/app/features/carteiras/detalhe/detalhe-carteira.spec.ts` |

### Onda 4 — faixa-10

#### faixa-10 — branch `spec/operacoes-faixa-10` — worktree `../onp-worktrees/api-externa-frontend-v2-operacoes-faixa-10`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-064 | Rotas da área de operações | `claude-sonnet-5` | low | `src/app/features/operacoes/operacoes.routes.ts`, `src/app/features/operacoes/operacoes.routes.spec.ts`, `src/app/app.routes.ts` |

## Gestão de branches e commits

1. branch de trabalho `spec/operacoes` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify operacoes` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/operacoes/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-operacoes-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo operacoes --tabela   # a tabela de andamento
onp-spec resumo operacoes            # o resumo em texto
```

