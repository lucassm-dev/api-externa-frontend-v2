#!/usr/bin/env bash
# executar-tarefas.sh — gerado por `onp-spec plano painel` em 2026-09-09 01:14
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
# resumo do que está rolando, a qualquer momento: onp-spec resumo painel
set -u
set -o pipefail

RUN_ID='api-externa-frontend-v2-painel-mttenwfa'
FEATURE='painel'
BASE_BRANCH='spec/painel'
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
  git ls-files --error-unmatch -- '.spec/features/painel/spec.md' >/dev/null 2>&1 || falhar "spec.md não está commitada — os worktrees das faixas precisam dela no git"
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
  LOG_DIR="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-painel-logs"
  WT_BASE="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-painel"
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
    amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --faixa $1"
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

# ── sequencial T-020 (ordem do tasks.md) ──
executar_seq_T_020() {
  info 'sequencial T-020 — Contratos e serviço do painel'
  if rodar_tarefa seq 'T-020' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-020 — "Contratos e serviço do painel"
  critérios/refs: AC-050 (Cada item traz símbolo, preço, variação e o horário do dado), AC-051 (Barra de mercado fora do ar não derruba o painel), AC-053 (O consolidado é de uma carteira só, em real, com a taxa visível), AC-057 (As carteiras chegam da mais recente para a mais antiga), AC-059 (No máximo cinco movimentações, com atalho para o extrato)
  arquivos permitidos (e seus testes): src/app/features/painel/painel.model.ts, src/app/features/painel/painel.service.ts, src/app/features/painel/painel.service.spec.ts
  mensagem de commit: "T-020 painel: Contratos e serviço do painel"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-020 painel: Contratos e serviço do painel (auto-commit do plano)'
    fi
    marcar_concluidas T-020
    verde "✔ T-020 concluída"
    return 0
  fi
  vermelho "✘ T-020 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-020"
  FALHAS="$FALHAS T-020"
  return 1
}

# ── sequencial T-021 (ordem do tasks.md) ──
executar_seq_T_021() {
  info 'sequencial T-021 — Regra do próximo passo único'
  if rodar_tarefa seq 'T-021' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-021 — "Regra do próximo passo único"
  critérios/refs: AC-060 (Catálogo de corretoras vazio pede o cadastro de corretora), AC-061 (Com corretora no catálogo e sem carteira, o passo é criar carteira), AC-062 (Com carteira e sem operação, o passo é registrar a primeira compra), AC-063 (Com corretora, carteira e operação não há próximo passo)
  arquivos permitidos (e seus testes): src/app/features/painel/proximo-passo.ts, src/app/features/painel/proximo-passo.spec.ts
  mensagem de commit: "T-021 painel: Regra do próximo passo único"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-021 painel: Regra do próximo passo único (auto-commit do plano)'
    fi
    marcar_concluidas T-021
    verde "✔ T-021 concluída"
    return 0
  fi
  vermelho "✘ T-021 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-021"
  FALHAS="$FALHAS T-021"
  return 1
}

# ── sequencial T-022 (ordem do tasks.md) ──
executar_seq_T_022() {
  info 'sequencial T-022 — Lembrar a carteira escolhida no consolidado'
  if rodar_tarefa seq 'T-022' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-022 — "Lembrar a carteira escolhida no consolidado"
  critérios/refs: AC-054 (A carteira escolhida é lembrada entre visitas)
  arquivos permitidos (e seus testes): src/app/features/painel/carteira-preferida.ts, src/app/features/painel/carteira-preferida.spec.ts
  mensagem de commit: "T-022 painel: Lembrar a carteira escolhida no consolidado"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-022 painel: Lembrar a carteira escolhida no consolidado (auto-commit do plano)'
    fi
    marcar_concluidas T-022
    verde "✔ T-022 concluída"
    return 0
  fi
  vermelho "✘ T-022 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-022"
  FALHAS="$FALHAS T-022"
  return 1
}

# ── sequencial T-023 (ordem do tasks.md) ──
executar_seq_T_023() {
  info 'sequencial T-023 — Shell: navegação das áreas, tema e sair'
  if rodar_tarefa seq 'T-023' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-023 — "Shell: navegação das áreas, tema e sair"
  critérios/refs: AC-047 (As seis áreas do produto ficam na barra superior), AC-048 (Sair nunca fica escondido), AC-049 (O tema escolhido sobrevive à visita)
  arquivos permitidos (e seus testes): src/app/layout/casca.ts, src/app/layout/casca.html, src/app/layout/casca.scss, src/app/layout/casca.spec.ts, src/app/layout/area-em-construcao.ts, src/app/app.routes.ts
  mensagem de commit: "T-023 painel: Shell: navegação das áreas, tema e sair"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-023 painel: Shell: navegação das áreas, tema e sair (auto-commit do plano)'
    fi
    marcar_concluidas T-023
    verde "✔ T-023 concluída"
    return 0
  fi
  vermelho "✘ T-023 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-023"
  FALHAS="$FALHAS T-023"
  return 1
}

# ── sequencial T-024 (ordem do tasks.md) ──
executar_seq_T_024() {
  info 'sequencial T-024 — Bloco 1: barra de mercado'
  if rodar_tarefa seq 'T-024' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-024 — "Bloco 1: barra de mercado"
  critérios/refs: AC-050 (Cada item traz símbolo, preço, variação e o horário do dado), AC-052 (O que faltou na barra vira aviso, nunca erro)
  arquivos permitidos (e seus testes): src/app/features/painel/blocos/barra-mercado.ts, src/app/features/painel/blocos/barra-mercado.html, src/app/features/painel/blocos/barra-mercado.scss, src/app/features/painel/blocos/barra-mercado.spec.ts
  mensagem de commit: "T-024 painel: Bloco 1: barra de mercado"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-024 painel: Bloco 1: barra de mercado (auto-commit do plano)'
    fi
    marcar_concluidas T-024
    verde "✔ T-024 concluída"
    return 0
  fi
  vermelho "✘ T-024 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-024"
  FALHAS="$FALHAS T-024"
  return 1
}

# ── sequencial T-025 (ordem do tasks.md) ──
executar_seq_T_025() {
  info 'sequencial T-025 — Bloco 2: consolidado de uma carteira'
  if rodar_tarefa seq 'T-025' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-025 — "Bloco 2: consolidado de uma carteira"
  critérios/refs: AC-053 (O consolidado é de uma carteira só, em real, com a taxa visível), AC-054 (A carteira escolhida é lembrada entre visitas), AC-055 (Câmbio indisponível é aviso, não erro), AC-056 (Taxa velha ganha marcação)
  arquivos permitidos (e seus testes): src/app/features/painel/blocos/consolidado.ts, src/app/features/painel/blocos/consolidado.html, src/app/features/painel/blocos/consolidado.scss, src/app/features/painel/blocos/consolidado.spec.ts
  mensagem de commit: "T-025 painel: Bloco 2: consolidado de uma carteira"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-025 painel: Bloco 2: consolidado de uma carteira (auto-commit do plano)'
    fi
    marcar_concluidas T-025
    verde "✔ T-025 concluída"
    return 0
  fi
  vermelho "✘ T-025 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-025"
  FALHAS="$FALHAS T-025"
  return 1
}

# ── sequencial T-026 (ordem do tasks.md) ──
executar_seq_T_026() {
  info 'sequencial T-026 — Bloco 3: cartões das carteiras'
  if rodar_tarefa seq 'T-026' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-026 — "Bloco 3: cartões das carteiras"
  critérios/refs: AC-057 (As carteiras chegam da mais recente para a mais antiga), AC-058 (Cada cartão mostra nome e corretora e abre a carteira)
  arquivos permitidos (e seus testes): src/app/features/painel/blocos/carteiras-do-investidor.ts, src/app/features/painel/blocos/carteiras-do-investidor.html, src/app/features/painel/blocos/carteiras-do-investidor.scss, src/app/features/painel/blocos/carteiras-do-investidor.spec.ts
  mensagem de commit: "T-026 painel: Bloco 3: cartões das carteiras"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-026 painel: Bloco 3: cartões das carteiras (auto-commit do plano)'
    fi
    marcar_concluidas T-026
    verde "✔ T-026 concluída"
    return 0
  fi
  vermelho "✘ T-026 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-026"
  FALHAS="$FALHAS T-026"
  return 1
}

# ── sequencial T-027 (ordem do tasks.md) ──
executar_seq_T_027() {
  info 'sequencial T-027 — Bloco 4: últimas movimentações'
  if rodar_tarefa seq 'T-027' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-027 — "Bloco 4: últimas movimentações"
  critérios/refs: AC-059 (No máximo cinco movimentações, com atalho para o extrato)
  arquivos permitidos (e seus testes): src/app/features/painel/blocos/ultimas-movimentacoes.ts, src/app/features/painel/blocos/ultimas-movimentacoes.html, src/app/features/painel/blocos/ultimas-movimentacoes.scss, src/app/features/painel/blocos/ultimas-movimentacoes.spec.ts
  mensagem de commit: "T-027 painel: Bloco 4: últimas movimentações"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-027 painel: Bloco 4: últimas movimentações (auto-commit do plano)'
    fi
    marcar_concluidas T-027
    verde "✔ T-027 concluída"
    return 0
  fi
  vermelho "✘ T-027 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-027"
  FALHAS="$FALHAS T-027"
  return 1
}

# ── sequencial T-028 (ordem do tasks.md) ──
executar_seq_T_028() {
  info 'sequencial T-028 — Convite do próximo passo'
  if rodar_tarefa seq 'T-028' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-028 — "Convite do próximo passo"
  critérios/refs: AC-060 (Catálogo de corretoras vazio pede o cadastro de corretora), AC-061 (Com corretora no catálogo e sem carteira, o passo é criar carteira), AC-062 (Com carteira e sem operação, o passo é registrar a primeira compra), AC-064 (O próximo passo ocupa o corpo da tela e nunca vira lista)
  arquivos permitidos (e seus testes): src/app/features/painel/blocos/convite-proximo-passo.ts, src/app/features/painel/blocos/convite-proximo-passo.html, src/app/features/painel/blocos/convite-proximo-passo.scss, src/app/features/painel/blocos/convite-proximo-passo.spec.ts
  mensagem de commit: "T-028 painel: Convite do próximo passo"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-028 painel: Convite do próximo passo (auto-commit do plano)'
    fi
    marcar_concluidas T-028
    verde "✔ T-028 concluída"
    return 0
  fi
  vermelho "✘ T-028 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-028"
  FALHAS="$FALHAS T-028"
  return 1
}

# ── sequencial T-029 (ordem do tasks.md) ──
executar_seq_T_029() {
  info 'sequencial T-029 — Tela do painel: orquestração, esqueletos e degradação'
  if rodar_tarefa seq 'T-029' 'Você executa UMA tarefa da feature "painel" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/painel/spec.md, .spec/features/painel/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-029 — "Tela do painel: orquestração, esqueletos e degradação"
  critérios/refs: AC-051 (Barra de mercado fora do ar não derruba o painel), AC-063 (Com corretora, carteira e operação não há próximo passo), AC-064 (O próximo passo ocupa o corpo da tela e nunca vira lista), AC-065 (Carregando é esqueleto, não spinner de tela inteira)
  arquivos permitidos (e seus testes): src/app/features/painel/painel.ts, src/app/features/painel/painel.html, src/app/features/painel/painel.scss, src/app/features/painel/painel.spec.ts, src/app/features/painel/painel-provisorio.ts
  mensagem de commit: "T-029 painel: Tela do painel: orquestração, esqueletos e degradação"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-029 painel: Tela do painel: orquestração, esqueletos e degradação (auto-commit do plano)'
    fi
    marcar_concluidas T-029
    verde "✔ T-029 concluída"
    return 0
  fi
  vermelho "✘ T-029 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/painel/executar-tarefas.sh --seq T-029"
  FALHAS="$FALHAS T-029"
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
      amarelo "  para o veredito: bash .spec/features/painel/executar-tarefas.sh --gate"
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
  executar_seq_T_020 || true
  executar_seq_T_021 || true
  executar_seq_T_022 || true
  executar_seq_T_023 || true
  executar_seq_T_024 || true
  executar_seq_T_025 || true
  executar_seq_T_026 || true
  executar_seq_T_027 || true
  executar_seq_T_028 || true
  executar_seq_T_029 || true
  encerrar tudo
}

listar() {
  echo "execução: $RUN_ID (feature $FEATURE, branch $BASE_BRANCH)"
  echo "  seq       T-020 (sequencial)"
  echo "  seq       T-021 (sequencial)"
  echo "  seq       T-022 (sequencial)"
  echo "  seq       T-023 (sequencial)"
  echo "  seq       T-024 (sequencial)"
  echo "  seq       T-025 (sequencial)"
  echo "  seq       T-026 (sequencial)"
  echo "  seq       T-027 (sequencial)"
  echo "  seq       T-028 (sequencial)"
  echo "  seq       T-029 (sequencial)"
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
      *) falhar "faixa desconhecida: '$ALVO' — veja as disponíveis com --listar" ;;
    esac ;;
  seq)
    case "$ALVO" in
      T-020) evento --tipo inicio --escopo "seq:T-020"; iniciar_resumos; executar_seq_T_020 || true; encerrar "seq:T-020" ;;
      T-021) evento --tipo inicio --escopo "seq:T-021"; iniciar_resumos; executar_seq_T_021 || true; encerrar "seq:T-021" ;;
      T-022) evento --tipo inicio --escopo "seq:T-022"; iniciar_resumos; executar_seq_T_022 || true; encerrar "seq:T-022" ;;
      T-023) evento --tipo inicio --escopo "seq:T-023"; iniciar_resumos; executar_seq_T_023 || true; encerrar "seq:T-023" ;;
      T-024) evento --tipo inicio --escopo "seq:T-024"; iniciar_resumos; executar_seq_T_024 || true; encerrar "seq:T-024" ;;
      T-025) evento --tipo inicio --escopo "seq:T-025"; iniciar_resumos; executar_seq_T_025 || true; encerrar "seq:T-025" ;;
      T-026) evento --tipo inicio --escopo "seq:T-026"; iniciar_resumos; executar_seq_T_026 || true; encerrar "seq:T-026" ;;
      T-027) evento --tipo inicio --escopo "seq:T-027"; iniciar_resumos; executar_seq_T_027 || true; encerrar "seq:T-027" ;;
      T-028) evento --tipo inicio --escopo "seq:T-028"; iniciar_resumos; executar_seq_T_028 || true; encerrar "seq:T-028" ;;
      T-029) evento --tipo inicio --escopo "seq:T-029"; iniciar_resumos; executar_seq_T_029 || true; encerrar "seq:T-029" ;;
      *) falhar "tarefa sequencial desconhecida: '$ALVO' — veja as disponíveis com --listar" ;;
    esac ;;
esac
