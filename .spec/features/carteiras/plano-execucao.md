# Plano de execução — carteiras

> gerado por `onp-spec plano` em 2026-09-09 03:48 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano carteiras --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 10 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/carteiras`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-038 | Contratos e serviço das carteiras | `claude-sonnet-5` | medium |
| T-039 | Posições encerradas: derivação pura | `claude-sonnet-5` | medium |
| T-040 | Recorte do extrato por carteira: derivação pura | `claude-sonnet-5` | medium |
| T-041 | Rentabilidade percentual da posição | `claude-sonnet-5` | medium |
| T-042 | Tela de criação de carteira | `claude-sonnet-5` | medium |
| T-043 | Lista de carteiras com números e ações rápidas | `claude-sonnet-5` | medium |
| T-044 | Seção de posições abertas e encerradas | `claude-sonnet-5` | medium |
| T-045 | Seção de movimentações da carteira | `claude-sonnet-5` | medium |
| T-046 | Detalhe da carteira: cabeçalho, renomear e excluir | `claude-sonnet-5` | medium |
| T-047 | Rotas da área de carteiras | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/carteiras` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify carteiras` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/carteiras/executar-tarefas.sh
```

Cada tarefa roda `claude -p` com **janela de contexto limpa**, na árvore principal,
uma após a outra, com `--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`.
Os prompts exatos estão embutidos no script.
Logs: `../onp-worktrees/api-externa-frontend-v2-carteiras-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo carteiras --tabela   # a tabela de andamento
onp-spec resumo carteiras            # o resumo em texto
```

