# Plano de execução — corretoras

> gerado por `onp-spec plano` em 2026-09-09 03:28 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano corretoras --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 8 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/corretoras`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-030 | CNPJ: normalizar, mascarar e validar antes do envio | `claude-sonnet-5` | medium |
| T-031 | Contratos e serviço das corretoras | `claude-sonnet-5` | medium |
| T-032 | Selo de uso: contagem e rótulo | `claude-sonnet-5` | medium |
| T-033 | Diálogo de confirmação simples (compartilhado) | `claude-sonnet-5` | medium |
| T-034 | Tela de cadastro pelo CNPJ | `claude-sonnet-5` | medium |
| T-035 | Lista do catálogo com busca, paginação e selo | `claude-sonnet-5` | medium |
| T-036 | Detalhe da corretora e remoção | `claude-sonnet-5` | medium |
| T-037 | Rotas da área de corretoras | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/corretoras` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify corretoras` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/corretoras/executar-tarefas.sh
```

Cada tarefa roda `claude -p` com **janela de contexto limpa**, na árvore principal,
uma após a outra, com `--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`.
Os prompts exatos estão embutidos no script.
Logs: `../onp-worktrees/api-externa-frontend-v2-corretoras-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo corretoras --tabela   # a tabela de andamento
onp-spec resumo corretoras            # o resumo em texto
```

