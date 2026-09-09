# Plano de execução — fundacao-visual

> gerado por `onp-spec plano` em 2026-09-09 14:04 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano fundacao-visual --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 12 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/fundacao-visual`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-080 | Dependências da repaginação | `claude-sonnet-5` | low |
| T-081 | Tokens de sucesso, barra de mercado e sombra | `claude-sonnet-5` | medium |
| T-082 | Nível sucesso e ícones no feedback | `claude-sonnet-5` | medium |
| T-083 | Primitiva: cartão | `claude-sonnet-5` | medium |
| T-084 | Primitiva: selo de situação | `claude-sonnet-5` | medium |
| T-085 | Primitiva: esqueleto de carregamento | `claude-sonnet-5` | medium |
| T-086 | Primitiva: estado vazio | `claude-sonnet-5` | medium |
| T-087 | Primitiva: paginador | `claude-sonnet-5` | medium |
| T-088 | Primitiva: botão de ícone | `claude-sonnet-5` | medium |
| T-089 | Monograma do ativo | `claude-sonnet-5` | medium |
| T-090 | Notificação temporária de ação concluída | `claude-sonnet-5` | high |
| T-091 | Rótulo acessível verificável nos campos de formulário | `claude-sonnet-5` | low |

## Gestão de branches e commits

1. branch de trabalho `spec/fundacao-visual` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify fundacao-visual` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/fundacao-visual/executar-tarefas.sh
```

Cada tarefa roda `claude -p` com **janela de contexto limpa**, na árvore principal,
uma após a outra, com `--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`.
Os prompts exatos estão embutidos no script.
Logs: `../onp-worktrees/api-externa-frontend-v2-fundacao-visual-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo fundacao-visual --tabela   # a tabela de andamento
onp-spec resumo fundacao-visual            # o resumo em texto
```

