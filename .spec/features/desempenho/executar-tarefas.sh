#!/usr/bin/env bash
# executar-tarefas.sh — gerado por `onp-spec plano desempenho` em 2026-09-09 11:21
# NÃO edite à mão: mudou tasks.md ou a config, regenere o plano.
#
# uso:
#   bash executar-tarefas.sh                  tudo (ondas → sequenciais → gate)
#   bash executar-tarefas.sh --faixa <id>     reexecuta UMA faixa (+ merge + gate)
#   bash executar-tarefas.sh --seq <T-xxx>    reexecuta UMA tarefa sequencial
#   bash executar-tarefas.sh --gate           só o gate (verify + audit)
#   bash executar-tarefas.sh --listar         mostra faixas, tarefas e estados
#   (acrescente --sem-gate para não rodar o gate ao final)
#
# resumo do que está rolando, a qualquer momento: onp-spec resumo desempenho
set -u
set -o pipefail

RUN_ID='api-externa-frontend-v2-desempenho-mtu0cnzx'
FEATURE='desempenho'
BASE_BRANCH='spec/desempenho'
ENGINE='.claude/skills/onp-spec-driven/scripts/onp-spec.mjs'
CLAUDE_FLAGS=(--permission-mode acceptEdits --allowedTools 'Bash(git add:*),Bash(git commit:*),Bash(git status:*),Bash(git diff:*),Bash(git log:*),Bash(npx:*)')
STREAM_FLAGS=(--output-format stream-json --verbose)
FALHAS=""
COM_GATE=1
RESUMO_MODEL='claude-haiku-4-5'
RESUMO_PID=""

verde()    { printf '\033[32m%s\033[0m\n' "$*"; }
vermelho() { printf '\033[31m%s\033[0m\n' "$*"; }
amarelo()  { printf '\033[33m%s\033[0m\n' "$*"; }
info()     { printf '· %s\n' "$*"; }
falhar()   { vermelho "✘ $*"; exit 1; }

# eventos vão para o ledger GLOBAL (~/.onp-spec/painel/ledger.jsonl):
# um arquivo para todos os projetos, é o que o onp-spec resumo lê
evento() { node "$ENGINE" evento --run "$RUN_ID" "$@" >/dev/null 2>&1 || true; }

# ── ambiente (todos os modos passam por aqui) ────────────────────────
preparar_ambiente() {
  command -v git >/dev/null 2>&1 || falhar "git não encontrado"
  command -v node >/dev/null 2>&1 || falhar "node não encontrado"
  command -v claude >/dev/null 2>&1 || falhar "Claude Code CLI (claude) não encontrado — instale-o ou siga o modo manual em plano-execucao.md"
  TOPLEVEL=$(git rev-parse --show-toplevel 2>/dev/null) || falhar "fora de um repositório git"
  cd "$TOPLEVEL" || exit 1
  # artefatos recém-gerados pelo `onp-spec plano` são sujeira esperada:
  # se forem a ÚNICA sujeira, o script mesmo commita; qualquer outra, aborta
  if [ -n "$(git status --porcelain)" ]; then
    if [ -z "$(git status --porcelain | grep -v -e 'plano-execucao\.' -e 'plano\.json' -e 'executar-tarefas\.sh')" ]; then
      git add -A
      git commit -q -m "plano de execução: $FEATURE (artefatos gerados)"
      info "artefatos do plano commitados"
    else
      falhar "árvore suja além dos artefatos do plano — commite ou faça git stash antes (os worktrees partem do último commit)"
    fi
  fi
  git ls-files --error-unmatch -- '.spec/features/desempenho/spec.md' >/dev/null 2>&1 || falhar "spec.md não está commitada — os worktrees das faixas precisam dela no git"
  ATUAL=$(git rev-parse --abbrev-ref HEAD)
  [ "$ATUAL" != "HEAD" ] || falhar "HEAD destacado — troque para uma branch"
  if [ "$ATUAL" != "$BASE_BRANCH" ]; then
    if git show-ref --verify --quiet "refs/heads/$BASE_BRANCH"; then
      git checkout -q "$BASE_BRANCH" || falhar "não consegui trocar para $BASE_BRANCH"
    else
      git checkout -q -b "$BASE_BRANCH" || falhar "não consegui criar $BASE_BRANCH"
    fi
    info "branch de trabalho: $BASE_BRANCH (a partir de $ATUAL)"
  fi
  git worktree prune
  LOG_DIR="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-desempenho-logs"
  WT_BASE="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-desempenho"
  STREAMS_DIR="${ONP_SPEC_HOME:-$HOME/.onp-spec}/painel/streams/$RUN_ID"
  mkdir -p "$LOG_DIR" "$STREAMS_DIR"
}

# worktree limpo mesmo depois de uma tentativa que falhou
preparar_worktree() { # $1=faixa $2=branch $3=worktree
  git worktree prune
  if [ -e "$3" ]; then git worktree remove --force "$3" >/dev/null 2>&1; rm -rf "$3"; fi
  if git show-ref --verify --quiet "refs/heads/$2"; then git branch -D "$2" >/dev/null 2>&1; fi
  git worktree add "$3" -b "$2" >/dev/null 2>&1 || { vermelho "✘ não consegui criar o worktree de $1 em $3"; return 1; }
}

tentativa() { # $1=faixa — conta reexecuções (vai para o ledger)
  local arq="$LOG_DIR/.tentativa-$1"
  local n=1
  [ -f "$arq" ] && n=$(( $(cat "$arq") + 1 ))
  printf "%s" "$n" > "$arq"
  printf "%s" "$n"
}

# uma tarefa = uma sessão claude headless com contexto limpo.
# o JSONL da sessão vira o stream da tarefa no ledger
rodar_tarefa() { # $1=escopo(faixa|seq) $2=T-xxx $3=prompt $4=modelo $5=esforço
  local chave="$1--$2"
  local stream="$STREAMS_DIR/$chave.jsonl"
  evento --tipo tarefa --tarefa "$2" --faixa "$1" --estado executando --stream "$chave"
  info "$2 — claude -p ($4 · $5) · stream: $chave"
  if claude -p "$3" --model "$4" --effort "$5" "${STREAM_FLAGS[@]}" "${CLAUDE_FLAGS[@]}" > "$stream" 2>>"$LOG_DIR/$1.log"; then
    evento --tipo tarefa --tarefa "$2" --faixa "$1" --estado concluida --stream "$chave"
    node "$ENGINE" stream-resumo "$RUN_ID" "$chave" 2>/dev/null || true
    return 0
  fi
  evento --tipo tarefa --tarefa "$2" --faixa "$1" --estado falhou --stream "$chave"
  node "$ENGINE" stream-resumo "$RUN_ID" "$chave" 2>/dev/null || true
  return 1
}

mesclar_faixa() { # $1=faixa $2=branch $3=worktree $4=exit-da-faixa
  if [ "$4" -ne 0 ]; then
    evento --tipo faixa --faixa "$1" --estado falhou
    vermelho "✘ $1 falhou (log: $LOG_DIR/$1.log) — worktree mantido para inspeção: $3"
    amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --faixa $1"
    FALHAS="$FALHAS $1"; return 1
  fi
  evento --tipo faixa --faixa "$1" --estado mesclando
  if git merge --no-ff "$2" -m "merge $1 ($FEATURE)"; then
    git worktree remove --force "$3" >/dev/null 2>&1
    git branch -d "$2" >/dev/null 2>&1
    evento --tipo faixa --faixa "$1" --estado mesclada
    verde "✔ $1 mesclada em $BASE_BRANCH"
  else
    git merge --abort >/dev/null 2>&1
    evento --tipo faixa --faixa "$1" --estado conflito
    vermelho "✘ conflito ao mesclar $1 — resolva na mão: git merge $2 (worktree mantido: $3)"
    FALHAS="$FALHAS $1"; return 1
  fi
}

marcar_concluidas() { # $@=T-xxx
  for t in "$@"; do node "$ENGINE" tarefa "$FEATURE" "$t" concluida >/dev/null || true; done
}

# ── resumo geral de andamento: 1/min enquanto a execução roda ─────────
# escrito por IA (claude -p, sem ferramentas) com fallback do motor; vai
# para o terminal e para o ledger — o agente repassa o texto no chat.
gerar_resumo() {
  local ctx ia
  ctx=$(node "$ENGINE" resumo "$FEATURE" --contexto 2>/dev/null) || ctx=""
  [ -n "$ctx" ] || return 0
  ia=$(claude -p "Você narra, para o dono do produto, uma execução de tarefas de código em andamento. Estado mecânico:

$ctx

Escreva o RESUMO GERAL DE ANDAMENTO: um parágrafo único de 2 a 4 frases, em português simples, dizendo o que está acontecendo agora, o que já terminou, o que falhou e se o usuário precisa agir. Sem markdown, sem listas." --model "$RESUMO_MODEL" 2>/dev/null)
  if [ -n "$ia" ]; then
    node "$ENGINE" resumo "$FEATURE" --gravar --origem ia --texto "$ia" >/dev/null 2>&1 || true
    printf '\n📣 resumo (IA): %s\n' "$ia"
  else
    node "$ENGINE" resumo "$FEATURE" --gravar >/dev/null 2>&1 || true
    printf '\n📣 resumo: %s\n' "$(node "$ENGINE" resumo "$FEATURE" 2>/dev/null)"
  fi
}

# mata o loop E o sleep filho — senão o sleep herda o stdout e quem chamou
# o script via pipe fica esperando EOF por até 60s depois do exit
parar_resumos() {
  [ -n "$RESUMO_PID" ] || return 0
  command -v pkill >/dev/null 2>&1 && pkill -P "$RESUMO_PID" 2>/dev/null
  kill "$RESUMO_PID" 2>/dev/null
  RESUMO_PID=""
}

iniciar_resumos() {
  ( while :; do sleep 60; gerar_resumo; done ) &
  RESUMO_PID=$!
  # ao sair: para o loop e grava um último resumo (o estado final, do motor)
  trap 'parar_resumos; node "$ENGINE" resumo "$FEATURE" --gravar >/dev/null 2>&1 || true' EXIT
}

# ── faixa-1: T-066 ──
executar_faixa_1() {
  local WT="$WT_BASE-faixa-1"
  preparar_worktree 'faixa-1' 'spec/desempenho-faixa-1' "$WT" || return 1
  evento --tipo faixa --faixa 'faixa-1' --estado executando --tentativa "$(tentativa 'faixa-1')"
  : > "$LOG_DIR/faixa-1.log"
  (
    cd "$WT" || exit 9
    rodar_tarefa 'faixa-1' 'T-066' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-066 — "Os quatro números e os percentuais sobre o investido"
  critérios/refs: AC-183 (Os quatro números aparecem no topo, nesta ordem, em real), AC-184 (Realizado e não realizado nunca aparecem somados), AC-185 (Cada resultado traz também o percentual sobre o investido), AC-186 (Investido zero não vira percentual)
  arquivos permitidos (e seus testes): src/app/features/desempenho/resultados.ts, src/app/features/desempenho/resultados.spec.ts
  mensagem de commit: "T-066 desempenho: Os quatro números e os percentuais sobre o investido"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium
  ) >> "$LOG_DIR/faixa-1.log" 2>&1
  local st=$?
  mesclar_faixa 'faixa-1' 'spec/desempenho-faixa-1' "$WT" "$st" || return 1
  marcar_concluidas T-066
  return 0
}

# ── faixa-2: T-069 ──
executar_faixa_2() {
  local WT="$WT_BASE-faixa-2"
  preparar_worktree 'faixa-2' 'spec/desempenho-faixa-2' "$WT" || return 1
  evento --tipo faixa --faixa 'faixa-2' --estado executando --tentativa "$(tentativa 'faixa-2')"
  : > "$LOG_DIR/faixa-2.log"
  (
    cd "$WT" || exit 9
    rodar_tarefa 'faixa-2' 'T-069' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-069 — "Lucro realizado por ticker"
  critérios/refs: AC-202 (O realizado por ticker vem do que o backend apurou), AC-203 (Sem venda nenhuma, o realizado é zero explicado)
  arquivos permitidos (e seus testes): src/app/features/desempenho/realizado-por-ticker.ts, src/app/features/desempenho/realizado-por-ticker.spec.ts
  mensagem de commit: "T-069 desempenho: Lucro realizado por ticker"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium
  ) >> "$LOG_DIR/faixa-2.log" 2>&1
  local st=$?
  mesclar_faixa 'faixa-2' 'spec/desempenho-faixa-2' "$WT" "$st" || return 1
  marcar_concluidas T-069
  return 0
}

# ── faixa-3: T-070 ──
executar_faixa_3() {
  local WT="$WT_BASE-faixa-3"
  preparar_worktree 'faixa-3' 'spec/desempenho-faixa-3' "$WT" || return 1
  evento --tipo faixa --faixa 'faixa-3' --estado executando --tentativa "$(tentativa 'faixa-3')"
  : > "$LOG_DIR/faixa-3.log"
  (
    cd "$WT" || exit 9
    rodar_tarefa 'faixa-3' 'T-070' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-070 — "Idade das cotações da carteira"
  critérios/refs: AC-206 (O horário mais antigo entre as cotações qualifica a tela), AC-207 (Cotação defasada marca o ativo e avisa no topo)
  arquivos permitidos (e seus testes): src/app/features/desempenho/idade-das-cotacoes.ts, src/app/features/desempenho/idade-das-cotacoes.spec.ts
  mensagem de commit: "T-070 desempenho: Idade das cotações da carteira"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium
  ) >> "$LOG_DIR/faixa-3.log" 2>&1
  local st=$?
  mesclar_faixa 'faixa-3' 'spec/desempenho-faixa-3' "$WT" "$st" || return 1
  marcar_concluidas T-070
  return 0
}

# ── sequencial T-065 (fora da seleção do usuário) ──
executar_seq_T_065() {
  info 'sequencial T-065 — Moeda de cada posição e conversão para real'
  if rodar_tarefa seq 'T-065' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-065 — "Moeda de cada posição e conversão para real"
  critérios/refs: AC-193 (Posição em dólar é convertida antes de compor), AC-199 (A contribuição de posição em dólar é convertida)
  arquivos permitidos (e seus testes): src/app/features/desempenho/moeda-das-posicoes.ts, src/app/features/desempenho/moeda-das-posicoes.spec.ts
  mensagem de commit: "T-065 desempenho: Moeda de cada posição e conversão para real"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-065 desempenho: Moeda de cada posição e conversão para real (auto-commit do plano)'
    fi
    marcar_concluidas T-065
    verde "✔ T-065 concluída"
    return 0
  fi
  vermelho "✘ T-065 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-065"
  FALHAS="$FALHAS T-065"
  return 1
}

# ── sequencial T-067 (fora da seleção do usuário) ──
executar_seq_T_067() {
  info 'sequencial T-067 — Composição do valor de mercado e conferência com o consolidado'
  if rodar_tarefa seq 'T-067' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-067 — "Composição do valor de mercado e conferência com o consolidado"
  critérios/refs: AC-192 (A composição distribui o valor de mercado entre os ativos), AC-194 (A soma das fatias bate com o valor de mercado do consolidado), AC-195 (Composição que não fecha confessa no próprio gráfico), AC-196 (Posição zerada por venda fica fora da composição)
  arquivos permitidos (e seus testes): src/app/features/desempenho/composicao.ts, src/app/features/desempenho/composicao.spec.ts
  mensagem de commit: "T-067 desempenho: Composição do valor de mercado e conferência com o consolidado"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-067 desempenho: Composição do valor de mercado e conferência com o consolidado (auto-commit do plano)'
    fi
    marcar_concluidas T-067
    verde "✔ T-067 concluída"
    return 0
  fi
  vermelho "✘ T-067 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-067"
  FALHAS="$FALHAS T-067"
  return 1
}

# ── sequencial T-068 (fora da seleção do usuário) ──
executar_seq_T_068() {
  info 'sequencial T-068 — Contribuição por ativo'
  if rodar_tarefa seq 'T-068' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-068 — "Contribuição por ativo"
  critérios/refs: AC-198 (A contribuição é ordenada do maior ganho à maior perda), AC-199 (A contribuição de posição em dólar é convertida)
  arquivos permitidos (e seus testes): src/app/features/desempenho/contribuicao.ts, src/app/features/desempenho/contribuicao.spec.ts
  mensagem de commit: "T-068 desempenho: Contribuição por ativo"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-068 desempenho: Contribuição por ativo (auto-commit do plano)'
    fi
    marcar_concluidas T-068
    verde "✔ T-068 concluída"
    return 0
  fi
  vermelho "✘ T-068 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-068"
  FALHAS="$FALHAS T-068"
  return 1
}

# ── sequencial T-071 (fora da seleção do usuário) ──
executar_seq_T_071() {
  info 'sequencial T-071 — Contratos e serviço da tela'
  if rodar_tarefa seq 'T-071' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-071 — "Contratos e serviço da tela"
  critérios/refs: AC-189 (O seletor troca a carteira inteira da tela), AC-211 (Leitura que falha degrada o bloco, não a tela)
  arquivos permitidos (e seus testes): src/app/features/desempenho/desempenho.model.ts, src/app/features/desempenho/desempenho.service.ts, src/app/features/desempenho/desempenho.service.spec.ts
  mensagem de commit: "T-071 desempenho: Contratos e serviço da tela"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-071 desempenho: Contratos e serviço da tela (auto-commit do plano)'
    fi
    marcar_concluidas T-071
    verde "✔ T-071 concluída"
    return 0
  fi
  vermelho "✘ T-071 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-071"
  FALHAS="$FALHAS T-071"
  return 1
}

# ── sequencial T-072 (fora da seleção do usuário) ──
executar_seq_T_072() {
  info 'sequencial T-072 — Tokens de cor das séries dos gráficos'
  if rodar_tarefa seq 'T-072' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-072 — "Tokens de cor das séries dos gráficos"
  critérios/refs: AC-187 (Ganho e perda se distinguem sem depender de cor), AC-200 (Ganho e perda no gráfico se distinguem sem cor)
  arquivos permitidos (e seus testes): src/styles/_tokens.scss
  mensagem de commit: "T-072 desempenho: Tokens de cor das séries dos gráficos"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-072 desempenho: Tokens de cor das séries dos gráficos (auto-commit do plano)'
    fi
    marcar_concluidas T-072
    verde "✔ T-072 concluída"
    return 0
  fi
  vermelho "✘ T-072 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-072"
  FALHAS="$FALHAS T-072"
  return 1
}

# ── sequencial T-073 (fora da seleção do usuário) ──
executar_seq_T_073() {
  info 'sequencial T-073 — Gráfico de composição em SVG'
  if rodar_tarefa seq 'T-073' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-073 — "Gráfico de composição em SVG"
  critérios/refs: AC-192 (A composição distribui o valor de mercado entre os ativos), AC-195 (Composição que não fecha confessa no próprio gráfico), AC-197 (Composição não tem eixo de tempo)
  arquivos permitidos (e seus testes): src/app/features/desempenho/blocos/grafico-composicao.ts, src/app/features/desempenho/blocos/grafico-composicao.html, src/app/features/desempenho/blocos/grafico-composicao.scss, src/app/features/desempenho/blocos/grafico-composicao.spec.ts
  mensagem de commit: "T-073 desempenho: Gráfico de composição em SVG"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-073 desempenho: Gráfico de composição em SVG (auto-commit do plano)'
    fi
    marcar_concluidas T-073
    verde "✔ T-073 concluída"
    return 0
  fi
  vermelho "✘ T-073 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-073"
  FALHAS="$FALHAS T-073"
  return 1
}

# ── sequencial T-074 (fora da seleção do usuário) ──
executar_seq_T_074() {
  info 'sequencial T-074 — Gráfico de contribuição em SVG'
  if rodar_tarefa seq 'T-074' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-074 — "Gráfico de contribuição em SVG"
  critérios/refs: AC-198 (A contribuição é ordenada do maior ganho à maior perda), AC-200 (Ganho e perda no gráfico se distinguem sem cor), AC-201 (Contribuição não tem eixo de tempo)
  arquivos permitidos (e seus testes): src/app/features/desempenho/blocos/grafico-contribuicao.ts, src/app/features/desempenho/blocos/grafico-contribuicao.html, src/app/features/desempenho/blocos/grafico-contribuicao.scss, src/app/features/desempenho/blocos/grafico-contribuicao.spec.ts
  mensagem de commit: "T-074 desempenho: Gráfico de contribuição em SVG"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-074 desempenho: Gráfico de contribuição em SVG (auto-commit do plano)'
    fi
    marcar_concluidas T-074
    verde "✔ T-074 concluída"
    return 0
  fi
  vermelho "✘ T-074 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-074"
  FALHAS="$FALHAS T-074"
  return 1
}

# ── sequencial T-075 (fora da seleção do usuário) ──
executar_seq_T_075() {
  info 'sequencial T-075 — Gráfico de lucro realizado em SVG'
  if rodar_tarefa seq 'T-075' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-075 — "Gráfico de lucro realizado em SVG"
  critérios/refs: AC-202 (O realizado por ticker vem do que o backend apurou), AC-204 (Realizado não tem eixo de tempo)
  arquivos permitidos (e seus testes): src/app/features/desempenho/blocos/grafico-realizado.ts, src/app/features/desempenho/blocos/grafico-realizado.html, src/app/features/desempenho/blocos/grafico-realizado.scss, src/app/features/desempenho/blocos/grafico-realizado.spec.ts
  mensagem de commit: "T-075 desempenho: Gráfico de lucro realizado em SVG"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-075 desempenho: Gráfico de lucro realizado em SVG (auto-commit do plano)'
    fi
    marcar_concluidas T-075
    verde "✔ T-075 concluída"
    return 0
  fi
  vermelho "✘ T-075 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-075"
  FALHAS="$FALHAS T-075"
  return 1
}

# ── sequencial T-076 (fora da seleção do usuário) ──
executar_seq_T_076() {
  info 'sequencial T-076 — Bloco dos quatro números'
  if rodar_tarefa seq 'T-076' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-076 — "Bloco dos quatro números"
  critérios/refs: AC-183 (Os quatro números aparecem no topo, nesta ordem, em real), AC-184 (Realizado e não realizado nunca aparecem somados), AC-185 (Cada resultado traz também o percentual sobre o investido), AC-186 (Investido zero não vira percentual), AC-187 (Ganho e perda se distinguem sem depender de cor), AC-188 (Nada de rentabilidade anualizada)
  arquivos permitidos (e seus testes): src/app/features/desempenho/blocos/numeros-desempenho.ts, src/app/features/desempenho/blocos/numeros-desempenho.html, src/app/features/desempenho/blocos/numeros-desempenho.scss, src/app/features/desempenho/blocos/numeros-desempenho.spec.ts
  mensagem de commit: "T-076 desempenho: Bloco dos quatro números"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-076 desempenho: Bloco dos quatro números (auto-commit do plano)'
    fi
    marcar_concluidas T-076
    verde "✔ T-076 concluída"
    return 0
  fi
  vermelho "✘ T-076 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-076"
  FALHAS="$FALHAS T-076"
  return 1
}

# ── sequencial T-077 (fora da seleção do usuário) ──
executar_seq_T_077() {
  info 'sequencial T-077 — Confissões permanentes e idade dos preços'
  if rodar_tarefa seq 'T-077' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-077 — "Confissões permanentes e idade dos preços"
  critérios/refs: AC-205 (O aviso sobre dividendos e JCP é permanente e visível), AC-206 (O horário mais antigo entre as cotações qualifica a tela), AC-207 (Cotação defasada marca o ativo e avisa no topo), AC-208 (Câmbio indisponível mostra a última taxa com o aviso do backend)
  arquivos permitidos (e seus testes): src/app/features/desempenho/blocos/confissoes-desempenho.ts, src/app/features/desempenho/blocos/confissoes-desempenho.html, src/app/features/desempenho/blocos/confissoes-desempenho.scss, src/app/features/desempenho/blocos/confissoes-desempenho.spec.ts
  mensagem de commit: "T-077 desempenho: Confissões permanentes e idade dos preços"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-077 desempenho: Confissões permanentes e idade dos preços (auto-commit do plano)'
    fi
    marcar_concluidas T-077
    verde "✔ T-077 concluída"
    return 0
  fi
  vermelho "✘ T-077 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-077"
  FALHAS="$FALHAS T-077"
  return 1
}

# ── sequencial T-078 (fora da seleção do usuário) ──
executar_seq_T_078() {
  info 'sequencial T-078 — Tela de desempenho: seletor, orquestração e estados vazios'
  if rodar_tarefa seq 'T-078' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-078 — "Tela de desempenho: seletor, orquestração e estados vazios"
  critérios/refs: AC-189 (O seletor troca a carteira inteira da tela), AC-190 (A carteira escolhida é lembrada entre visitas), AC-191 (Não existe visão somada de todas as carteiras), AC-209 (Sem operação nenhuma, a tela convida a registrar a primeira compra), AC-210 (Sem carteira nenhuma, a tela convida a criar a primeira), AC-211 (Leitura que falha degrada o bloco, não a tela)
  arquivos permitidos (e seus testes): src/app/features/desempenho/desempenho.ts, src/app/features/desempenho/desempenho.html, src/app/features/desempenho/desempenho.scss, src/app/features/desempenho/desempenho.spec.ts
  mensagem de commit: "T-078 desempenho: Tela de desempenho: seletor, orquestração e estados vazios"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-078 desempenho: Tela de desempenho: seletor, orquestração e estados vazios (auto-commit do plano)'
    fi
    marcar_concluidas T-078
    verde "✔ T-078 concluída"
    return 0
  fi
  vermelho "✘ T-078 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-078"
  FALHAS="$FALHAS T-078"
  return 1
}

# ── sequencial T-079 (fora da seleção do usuário) ──
executar_seq_T_079() {
  info 'sequencial T-079 — Rota de desempenho no lugar da área em construção'
  if rodar_tarefa seq 'T-079' 'Você executa UMA tarefa da feature "desempenho" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/desempenho/spec.md, .spec/features/desempenho/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-079 — "Rota de desempenho no lugar da área em construção"
  critérios/refs: AC-209 (Sem operação nenhuma, a tela convida a registrar a primeira compra), AC-210 (Sem carteira nenhuma, a tela convida a criar a primeira)
  arquivos permitidos (e seus testes): src/app/features/desempenho/desempenho.routes.ts, src/app/features/desempenho/desempenho.routes.spec.ts, src/app/app.routes.ts
  mensagem de commit: "T-079 desempenho: Rota de desempenho no lugar da área em construção"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-079 desempenho: Rota de desempenho no lugar da área em construção (auto-commit do plano)'
    fi
    marcar_concluidas T-079
    verde "✔ T-079 concluída"
    return 0
  fi
  vermelho "✘ T-079 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/desempenho/executar-tarefas.sh --seq T-079"
  FALHAS="$FALHAS T-079"
  return 1
}

# ── gate: quem decide é a máquina ────────────────────────────────────
rodar_gate() {
  echo
  info "gate: verify + audit --ci"
  evento --tipo gate --etapa inicio
  node "$ENGINE" verify "$FEATURE"
  local v=$?
  evento --tipo gate --etapa verify --exit "$v"
  node "$ENGINE" audit --ci
  AUDIT=$?
  evento --tipo gate --etapa audit --exit "$AUDIT"
  # fecha a contabilidade: status das tarefas + prova do verify no git
  if [ -n "$(git status --porcelain -- '.spec')" ]; then
    git add -A -- '.spec'
    git commit -q -m "$FEATURE: status das tarefas + prova do verify (plano)"
    info "status das tarefas e prova do verify commitados"
  fi
  return "$AUDIT"
}

encerrar() { # $1=escopo
  echo
  if [ -n "$FALHAS" ]; then vermelho "faixas/tarefas com falha:$FALHAS"; fi
  # sem gate não existe veredito: NUNCA anunciar alinhamento sem o audit
  if [ "$COM_GATE" -eq 0 ]; then
    evento --tipo fim --exit 1 --escopo "$1"
    if [ -z "$FALHAS" ]; then
      amarelo "○ trabalho de '$1' terminou SEM o gate (--sem-gate) — isto NÃO é prova de nada"
      amarelo "  para o veredito: bash .spec/features/desempenho/executar-tarefas.sh --gate"
      exit 0
    fi
    vermelho "e ainda há falhas — conserte e rode o gate"
    exit 1
  fi
  rodar_gate
  local audit=$?
  if [ "$audit" -eq 0 ] && [ -z "$FALHAS" ]; then
    evento --tipo fim --exit 0 --escopo "$1"
    verde "✔ plano concluído — especificação e código alinhados (audit exit 0) na branch $BASE_BRANCH"
    info "próximo passo: revise e leve para a main quando quiser (git merge $BASE_BRANCH)"
    exit 0
  fi
  evento --tipo fim --exit 1 --escopo "$1"
  vermelho "plano terminou com pendências — leia a saída do audit acima e os logs em $LOG_DIR"
  amarelo "dica: reexecute só o que falhou (--faixa <id> / --seq <T-xxx>)"
  exit 1
}

executar_tudo() {
  evento --tipo inicio --escopo tudo
  iniciar_resumos
  info "logs em: $LOG_DIR"
  info "resumo geral de andamento: a cada 1 min aqui no terminal (e via: onp-spec resumo)"
  # onda 1: faixa-1 ∥ faixa-2 ∥ faixa-3
  info "onda 1: faixa-1 ∥ faixa-2 ∥ faixa-3 — janelas limpas em paralelo"
  executar_faixa_1 & PID_FAIXA_1=$!
  executar_faixa_2 & PID_FAIXA_2=$!
  executar_faixa_3 & PID_FAIXA_3=$!
  wait "$PID_FAIXA_1" || true
  wait "$PID_FAIXA_2" || true
  wait "$PID_FAIXA_3" || true
  executar_seq_T_065 || true
  executar_seq_T_067 || true
  executar_seq_T_068 || true
  executar_seq_T_071 || true
  executar_seq_T_072 || true
  executar_seq_T_073 || true
  executar_seq_T_074 || true
  executar_seq_T_075 || true
  executar_seq_T_076 || true
  executar_seq_T_077 || true
  executar_seq_T_078 || true
  executar_seq_T_079 || true
  encerrar tudo
}

listar() {
  echo "execução: $RUN_ID (feature $FEATURE, branch $BASE_BRANCH)"
  echo "  faixa-1  onda 1  T-066"
  echo "  faixa-2  onda 1  T-069"
  echo "  faixa-3  onda 1  T-070"
  echo "  seq       T-065 (sequencial)"
  echo "  seq       T-067 (sequencial)"
  echo "  seq       T-068 (sequencial)"
  echo "  seq       T-071 (sequencial)"
  echo "  seq       T-072 (sequencial)"
  echo "  seq       T-073 (sequencial)"
  echo "  seq       T-074 (sequencial)"
  echo "  seq       T-075 (sequencial)"
  echo "  seq       T-076 (sequencial)"
  echo "  seq       T-077 (sequencial)"
  echo "  seq       T-078 (sequencial)"
  echo "  seq       T-079 (sequencial)"
  echo
  echo "reexecutar uma faixa:    --faixa <id>"
  echo "reexecutar sequencial:   --seq <T-xxx>"
  echo "só o gate:               --gate"
}

MODO="tudo"
ALVO=""
while [ $# -gt 0 ]; do
  case "$1" in
    --listar) MODO="listar" ;;
    --gate) MODO="gate" ;;
    --sem-gate) COM_GATE=0 ;;
    --faixa) MODO="faixa"; ALVO="${2:-}"; shift ;;
    --seq) MODO="seq"; ALVO="${2:-}"; shift ;;
    -h|--help) sed -n "2,14p" "$0"; exit 0 ;;
    *) vermelho "argumento desconhecido: $1"; sed -n "2,14p" "$0"; exit 2 ;;
  esac
  shift
done

if [ "$MODO" = "listar" ]; then listar; exit 0; fi

preparar_ambiente

case "$MODO" in
  tudo) executar_tudo ;;
  gate) COM_GATE=1; iniciar_resumos; encerrar gate ;;
  faixa)
    case "$ALVO" in
      faixa-1) evento --tipo inicio --escopo "faixa:faixa-1"; iniciar_resumos; executar_faixa_1 || true; encerrar "faixa:faixa-1" ;;
      faixa-2) evento --tipo inicio --escopo "faixa:faixa-2"; iniciar_resumos; executar_faixa_2 || true; encerrar "faixa:faixa-2" ;;
      faixa-3) evento --tipo inicio --escopo "faixa:faixa-3"; iniciar_resumos; executar_faixa_3 || true; encerrar "faixa:faixa-3" ;;
      *) falhar "faixa desconhecida: '$ALVO' — veja as disponíveis com --listar" ;;
    esac ;;
  seq)
    case "$ALVO" in
      T-065) evento --tipo inicio --escopo "seq:T-065"; iniciar_resumos; executar_seq_T_065 || true; encerrar "seq:T-065" ;;
      T-067) evento --tipo inicio --escopo "seq:T-067"; iniciar_resumos; executar_seq_T_067 || true; encerrar "seq:T-067" ;;
      T-068) evento --tipo inicio --escopo "seq:T-068"; iniciar_resumos; executar_seq_T_068 || true; encerrar "seq:T-068" ;;
      T-071) evento --tipo inicio --escopo "seq:T-071"; iniciar_resumos; executar_seq_T_071 || true; encerrar "seq:T-071" ;;
      T-072) evento --tipo inicio --escopo "seq:T-072"; iniciar_resumos; executar_seq_T_072 || true; encerrar "seq:T-072" ;;
      T-073) evento --tipo inicio --escopo "seq:T-073"; iniciar_resumos; executar_seq_T_073 || true; encerrar "seq:T-073" ;;
      T-074) evento --tipo inicio --escopo "seq:T-074"; iniciar_resumos; executar_seq_T_074 || true; encerrar "seq:T-074" ;;
      T-075) evento --tipo inicio --escopo "seq:T-075"; iniciar_resumos; executar_seq_T_075 || true; encerrar "seq:T-075" ;;
      T-076) evento --tipo inicio --escopo "seq:T-076"; iniciar_resumos; executar_seq_T_076 || true; encerrar "seq:T-076" ;;
      T-077) evento --tipo inicio --escopo "seq:T-077"; iniciar_resumos; executar_seq_T_077 || true; encerrar "seq:T-077" ;;
      T-078) evento --tipo inicio --escopo "seq:T-078"; iniciar_resumos; executar_seq_T_078 || true; encerrar "seq:T-078" ;;
      T-079) evento --tipo inicio --escopo "seq:T-079"; iniciar_resumos; executar_seq_T_079 || true; encerrar "seq:T-079" ;;
      *) falhar "tarefa sequencial desconhecida: '$ALVO' — veja as disponíveis com --listar" ;;
    esac ;;
esac
