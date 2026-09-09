# Plano de execução — desempenho

> gerado por `onp-spec plano` em 2026-09-09 11:21 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano desempenho --paralelizar T-066,T-069,T-070`

## Resumo — o que vai acontecer

- **15 tarefa(s) pendente(s)**: 3 em 3 faixa(s) paralela(s) + 12 sequencial(is)
- **seleção do usuário**: paralelizar só T-066, T-069, T-070 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano desempenho --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/desempenho`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/desempenho-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-desempenho-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-066 | Os quatro números e os percentuais sobre o investido | `claude-sonnet-5` | medium | `src/app/features/desempenho/resultados.ts`, `src/app/features/desempenho/resultados.spec.ts` |

#### faixa-2 — branch `spec/desempenho-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-desempenho-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-069 | Lucro realizado por ticker | `claude-sonnet-5` | medium | `src/app/features/desempenho/realizado-por-ticker.ts`, `src/app/features/desempenho/realizado-por-ticker.spec.ts` |

#### faixa-3 — branch `spec/desempenho-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-desempenho-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-070 | Idade das cotações da carteira | `claude-sonnet-5` | medium | `src/app/features/desempenho/idade-das-cotacoes.ts`, `src/app/features/desempenho/idade-das-cotacoes.spec.ts` |

## Tarefas sequenciais (após as ondas, na árvore principal)

| tarefa | título | modelo | esforço | por que sequencial |
|---|---|---|---|---|
| T-065 | Moeda de cada posição e conversão para real | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-067 | Composição do valor de mercado e conferência com o consolidado | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-068 | Contribuição por ativo | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-071 | Contratos e serviço da tela | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-072 | Tokens de cor das séries dos gráficos | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-073 | Gráfico de composição em SVG | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-074 | Gráfico de contribuição em SVG | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-075 | Gráfico de lucro realizado em SVG | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-076 | Bloco dos quatro números | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-077 | Confissões permanentes e idade dos preços | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-078 | Tela de desempenho: seletor, orquestração e estados vazios | `claude-sonnet-5` | medium | fora da seleção do usuário |
| T-079 | Rota de desempenho no lugar da área em construção | `claude-sonnet-5` | medium | fora da seleção do usuário |

## Gestão de branches e commits

1. branch de trabalho `spec/desempenho` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify desempenho` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/desempenho/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-desempenho-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo desempenho --tabela   # a tabela de andamento
onp-spec resumo desempenho            # o resumo em texto
```

