# Plano de execução — repaginacao-visual

> gerado por `onp-spec plano` em 2026-09-10 00:50 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano repaginacao-visual --paralelizar T-114,T-115,T-116,T-117,T-118,T-119,T-120,T-121,T-123`

## Resumo — o que vai acontecer

- **10 tarefa(s) pendente(s)**: 9 em 9 faixa(s) paralela(s) + 1 sequencial(is) (2 já concluída(s): T-112, T-113)
- **seleção do usuário**: paralelizar só T-114, T-115, T-116, T-117, T-118, T-119, T-120, T-121, T-123 — as demais rodam uma após a outra, ao final
- **1 faixa = 1 worktree + 1 branch + 1 janela de contexto limpa** — faixas não compartilham nenhum arquivo entre si
- prefere outra seleção ou uma após a outra? Regenere com `onp-spec plano repaginacao-visual --paralelizar T-xxx,T-yyy` ou `--sequencial`
- tudo acontece na branch de trabalho `spec/repaginacao-visual`; levar para a main é decisão sua

## Faixas e ondas

### Onda 1 — faixa-1 ∥ faixa-2 ∥ faixa-3

#### faixa-1 — branch `spec/repaginacao-visual-faixa-1` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-1`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-114 | Migrar todo template para o botão único | `claude-sonnet-5` | high | `src/app/layout/casca.html`, `src/app/shared/paginador/paginador.html`, `src/app/shared/confirmacao/dialogo-confirmacao.html`, `src/app/shared/estado-vazio/estado-vazio.html`, `src/app/shared/tabela/cabecalho-ordenavel.html`, `src/app/features/acesso/login/login.html`, `src/app/features/acesso/cadastro/cadastro.html`, `src/app/features/carteiras/lista/lista-carteiras.html`, `src/app/features/carteiras/criacao/criar-carteira.html`, `src/app/features/carteiras/detalhe/detalhe-carteira.html`, `src/app/features/carteiras/detalhe/movimentacoes-carteira.html`, `src/app/features/corretoras/lista/lista-corretoras.html`, `src/app/features/corretoras/cadastro/cadastro-corretora.html`, `src/app/features/corretoras/detalhe/detalhe-corretora.html`, `src/app/features/acoes/lista/lista-acoes.html`, `src/app/features/acoes/cadastro/cadastro-acao.html`, `src/app/features/acoes/detalhe/detalhe-acao.html`, `src/app/features/operacoes/formulario/formulario-operacao.html`, `src/app/features/operacoes/edicao/editar-operacao.html`, `src/app/shared/botao/padrao-unico.spec.ts` |

#### faixa-2 — branch `spec/repaginacao-visual-faixa-2` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-2`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-115 | Casca responsiva com menu compacto | `claude-sonnet-5` | high | `src/styles.scss`, `src/app/layout/casca.ts`, `src/app/layout/casca.scss`, `src/app/layout/casca.spec.ts` |

#### faixa-3 — branch `spec/repaginacao-visual-faixa-3` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-3`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-116 | Tabela com rolagem contida | `claude-sonnet-5` | medium | `src/app/shared/tabela/tabela.scss`, `src/app/shared/tabela/tabela.spec.ts`, `src/app/shared/tabela/rolagem-contida.spec.ts` |

### Onda 2 — faixa-4 ∥ faixa-5 ∥ faixa-6

#### faixa-4 — branch `spec/repaginacao-visual-faixa-4` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-4`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-117 | Barra de cotações contida | `claude-sonnet-5` | medium | `src/app/features/painel/blocos/barra-mercado.html`, `src/app/features/painel/blocos/barra-mercado.scss`, `src/app/features/painel/blocos/barra-mercado.spec.ts` |

#### faixa-5 — branch `spec/repaginacao-visual-faixa-5` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-5`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-118 | Mapa de blocos das posições | `claude-sonnet-5` | high | `src/app/features/desempenho/blocos/blocos-do-mapa.ts`, `src/app/features/desempenho/blocos/blocos-do-mapa.spec.ts`, `src/app/features/desempenho/blocos/grafico-mapa-posicoes.ts`, `src/app/features/desempenho/blocos/grafico-mapa-posicoes.html`, `src/app/features/desempenho/blocos/grafico-mapa-posicoes.scss`, `src/app/features/desempenho/blocos/grafico-mapa-posicoes.spec.ts` |

#### faixa-6 — branch `spec/repaginacao-visual-faixa-6` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-6`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-119 | Investido × valor de mercado | `claude-sonnet-5` | medium | `src/app/features/desempenho/blocos/grafico-investido-mercado.ts`, `src/app/features/desempenho/blocos/grafico-investido-mercado.html`, `src/app/features/desempenho/blocos/grafico-investido-mercado.scss`, `src/app/features/desempenho/blocos/grafico-investido-mercado.spec.ts` |

### Onda 3 — faixa-7 ∥ faixa-8 ∥ faixa-9

#### faixa-7 — branch `spec/repaginacao-visual-faixa-7` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-7`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-120 | Quadrante participação × rentabilidade | `claude-sonnet-5` | high | `src/app/features/desempenho/blocos/grafico-quadrante.ts`, `src/app/features/desempenho/blocos/grafico-quadrante.html`, `src/app/features/desempenho/blocos/grafico-quadrante.scss`, `src/app/features/desempenho/blocos/grafico-quadrante.spec.ts` |

#### faixa-8 — branch `spec/repaginacao-visual-faixa-8` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-8`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-121 | Medidor de concentração | `claude-sonnet-5` | medium | `src/app/features/desempenho/blocos/concentracao-da-carteira.ts`, `src/app/features/desempenho/blocos/concentracao-da-carteira.spec.ts`, `src/app/features/desempenho/blocos/grafico-concentracao.ts`, `src/app/features/desempenho/blocos/grafico-concentracao.html`, `src/app/features/desempenho/blocos/grafico-concentracao.scss`, `src/app/features/desempenho/blocos/grafico-concentracao.spec.ts` |

#### faixa-9 — branch `spec/repaginacao-visual-faixa-9` — worktree `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-faixa-9`

| tarefa | título | modelo | esforço | arquivos |
|---|---|---|---|---|
| T-123 | Movimento com freio | `claude-sonnet-5` | low | `src/styles/movimento.spec.ts`, `.onp-uiux.json` |

## Tarefas sequenciais (após as ondas, na árvore principal)

| tarefa | título | modelo | esforço | por que sequencial |
|---|---|---|---|---|
| T-122 | Grade responsiva do desempenho | `claude-sonnet-5` | medium | fora da seleção do usuário |

## Gestão de branches e commits

1. branch de trabalho `spec/repaginacao-visual` criada do ponto atual (se ainda não existir)
2. cada faixa nasce dela como branch própria e roda no seu worktree — **1 tarefa = 1 commit** (`T-xxx feature: título`)
3. terminou a onda → merge `--no-ff` de cada faixa de volta, na ordem; conflito interrompe a faixa e pede resolução humana
4. faixa mesclada → worktree removido, branch apagada, tarefa marcada `[concluida]` no tasks.md
5. gate final na branch de trabalho: `onp-spec verify repaginacao-visual` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/repaginacao-visual/executar-tarefas.sh
```

Cada faixa roda `claude -p` com **janela de contexto limpa**, no seu worktree, com
`--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`. Os prompts exatos estão
embutidos no script — quer rodar uma faixa na mão, é só copiá-los de lá.
Logs: `../onp-worktrees/api-externa-frontend-v2-repaginacao-visual-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo repaginacao-visual --tabela   # a tabela de andamento
onp-spec resumo repaginacao-visual            # o resumo em texto
```

