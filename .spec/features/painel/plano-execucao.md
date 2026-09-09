# Plano de execução — painel

> gerado por `onp-spec plano` em 2026-09-09 01:14 — NÃO edite à mão;
> mudou tasks.md ou a config? Regenere: `onp-spec plano painel --sequencial`

## Resumo — o que vai acontecer

- **modo SEQUENCIAL (escolha do usuário)**: 10 tarefa(s) pendente(s), UMA APÓS A OUTRA, na árvore principal
- sem worktrees e sem paralelismo — cada tarefa roda numa janela de contexto limpa, na ordem do tasks.md
- tudo acontece na branch de trabalho `spec/painel`; levar para a main é decisão sua

## Ordem de execução (uma tarefa após a outra)

| tarefa | título | modelo | esforço |
|---|---|---|---|
| T-020 | Contratos e serviço do painel | `claude-sonnet-5` | medium |
| T-021 | Regra do próximo passo único | `claude-sonnet-5` | medium |
| T-022 | Lembrar a carteira escolhida no consolidado | `claude-sonnet-5` | medium |
| T-023 | Shell: navegação das áreas, tema e sair | `claude-sonnet-5` | medium |
| T-024 | Bloco 1: barra de mercado | `claude-sonnet-5` | medium |
| T-025 | Bloco 2: consolidado de uma carteira | `claude-sonnet-5` | medium |
| T-026 | Bloco 3: cartões das carteiras | `claude-sonnet-5` | medium |
| T-027 | Bloco 4: últimas movimentações | `claude-sonnet-5` | medium |
| T-028 | Convite do próximo passo | `claude-sonnet-5` | medium |
| T-029 | Tela do painel: orquestração, esqueletos e degradação | `claude-sonnet-5` | medium |

## Gestão de branches e commits

1. branch de trabalho `spec/painel` criada do ponto atual (se ainda não existir)
2. as tarefas rodam nela mesma, na ordem — **1 tarefa = 1 commit** (`T-xxx feature: título`), marcada `[concluida]` só com trabalho feito
3. gate final na branch de trabalho: `onp-spec verify painel` + `onp-spec audit --ci` — **exit 0 ou não está pronto**

## Como executar

### ▶ Execução — Claude Code headless

```bash
bash .spec/features/painel/executar-tarefas.sh
```

Cada tarefa roda `claude -p` com **janela de contexto limpa**, na árvore principal,
uma após a outra, com `--model` e `--effort` já definidos por tarefa e permissões `acceptEdits`.
Os prompts exatos estão embutidos no script.
Logs: `../onp-worktrees/api-externa-frontend-v2-painel-logs/`.

### 📣 Acompanhamento — tabela + resumo no chat (a cada 1 min)

O script roda em **background**: o agente AVISA o usuário antes de iniciar e,
enquanto roda, posta no chat a cada ~1 minuto a **tabela de andamento** (qual
tarefa está rodando, qual não está, o que concluiu/falhou) junto com o
**resumo geral de andamento** (escrito por IA; sem IA, o motor resume). Ao
final, o usuário recebe o resumo completo da execução. A qualquer momento:

```bash
onp-spec resumo painel --tabela   # a tabela de andamento
onp-spec resumo painel            # o resumo em texto
```

