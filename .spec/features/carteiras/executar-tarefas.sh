#!/usr/bin/env bash
# executar-tarefas.sh — gerado por `onp-spec plano carteiras` em 2026-09-09 03:48
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
# resumo do que está rolando, a qualquer momento: onp-spec resumo carteiras
set -u
set -o pipefail

RUN_ID='api-externa-frontend-v2-carteiras-mttk5tt2'
FEATURE='carteiras'
BASE_BRANCH='spec/carteiras'
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
  git ls-files --error-unmatch -- '.spec/features/carteiras/spec.md' >/dev/null 2>&1 || falhar "spec.md não está commitada — os worktrees das faixas precisam dela no git"
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
  LOG_DIR="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-carteiras-logs"
  WT_BASE="$(dirname "$TOPLEVEL")/onp-worktrees/api-externa-frontend-v2-carteiras"
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
    amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --faixa $1"
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

# ── sequencial T-038 (ordem do tasks.md) ──
executar_seq_T_038() {
  info 'sequencial T-038 — Contratos e serviço das carteiras'
  if rodar_tarefa seq 'T-038' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-038 — "Contratos e serviço das carteiras"
  critérios/refs: AC-093 (Nenhum mercado é escolhido escondido pelo frontend), AC-094 (Carteira criada abre no detalhe dela), AC-097 (A lista é paginada, da mais recente para a mais antiga), AC-100 (Número que falha some da linha sem derrubar a lista), AC-112 (A seção mostra apenas as operações desta carteira), AC-113 (Extrato maior do que o buscado é declarado como recorte parcial)
  arquivos permitidos (e seus testes): src/app/features/carteiras/carteiras.model.ts, src/app/features/carteiras/carteiras.service.ts, src/app/features/carteiras/carteiras.service.spec.ts
  mensagem de commit: "T-038 carteiras: Contratos e serviço das carteiras"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-038 carteiras: Contratos e serviço das carteiras (auto-commit do plano)'
    fi
    marcar_concluidas T-038
    verde "✔ T-038 concluída"
    return 0
  fi
  vermelho "✘ T-038 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-038"
  FALHAS="$FALHAS T-038"
  return 1
}

# ── sequencial T-039 (ordem do tasks.md) ──
executar_seq_T_039() {
  info 'sequencial T-039 — Posições encerradas: derivação pura'
  if rodar_tarefa seq 'T-039' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-039 — "Posições encerradas: derivação pura"
  critérios/refs: AC-109 (A seção "Encerradas" lista exatamente os tickers com resultado realizado e sem posição aberta), AC-110 (Sem ativo encerrado, a seção não aparece), AC-111 (A seção mostra ticker e resultado realizado, e nada de posição)
  arquivos permitidos (e seus testes): src/app/features/carteiras/posicoes-encerradas.ts, src/app/features/carteiras/posicoes-encerradas.spec.ts
  mensagem de commit: "T-039 carteiras: Posições encerradas: derivação pura"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-039 carteiras: Posições encerradas: derivação pura (auto-commit do plano)'
    fi
    marcar_concluidas T-039
    verde "✔ T-039 concluída"
    return 0
  fi
  vermelho "✘ T-039 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-039"
  FALHAS="$FALHAS T-039"
  return 1
}

# ── sequencial T-040 (ordem do tasks.md) ──
executar_seq_T_040() {
  info 'sequencial T-040 — Recorte do extrato por carteira: derivação pura'
  if rodar_tarefa seq 'T-040' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-040 — "Recorte do extrato por carteira: derivação pura"
  critérios/refs: AC-112 (A seção mostra apenas as operações desta carteira), AC-113 (Extrato maior do que o buscado é declarado como recorte parcial), AC-114 (Extrato que coube inteiro não recebe aviso de recorte)
  arquivos permitidos (e seus testes): src/app/features/carteiras/movimentacoes-da-carteira.ts, src/app/features/carteiras/movimentacoes-da-carteira.spec.ts
  mensagem de commit: "T-040 carteiras: Recorte do extrato por carteira: derivação pura"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-040 carteiras: Recorte do extrato por carteira: derivação pura (auto-commit do plano)'
    fi
    marcar_concluidas T-040
    verde "✔ T-040 concluída"
    return 0
  fi
  vermelho "✘ T-040 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-040"
  FALHAS="$FALHAS T-040"
  return 1
}

# ── sequencial T-041 (ordem do tasks.md) ──
executar_seq_T_041() {
  info 'sequencial T-041 — Rentabilidade percentual da posição'
  if rodar_tarefa seq 'T-041' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-041 — "Rentabilidade percentual da posição"
  critérios/refs: AC-107 (A rentabilidade não realizada aparece em valor e em percentual)
  arquivos permitidos (e seus testes): src/app/features/carteiras/rentabilidade.ts, src/app/features/carteiras/rentabilidade.spec.ts
  mensagem de commit: "T-041 carteiras: Rentabilidade percentual da posição"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-041 carteiras: Rentabilidade percentual da posição (auto-commit do plano)'
    fi
    marcar_concluidas T-041
    verde "✔ T-041 concluída"
    return 0
  fi
  vermelho "✘ T-041 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-041"
  FALHAS="$FALHAS T-041"
  return 1
}

# ── sequencial T-042 (ordem do tasks.md) ──
executar_seq_T_042() {
  info 'sequencial T-042 — Tela de criação de carteira'
  if rodar_tarefa seq 'T-042' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-042 — "Tela de criação de carteira"
  critérios/refs: AC-091 (O formulário pede nome, corretora e mercado), AC-092 (Sem corretora no catálogo, a criação conduz ao cadastro de corretora), AC-093 (Nenhum mercado é escolhido escondido pelo frontend), AC-094 (Carteira criada abre no detalhe dela), AC-095 (A tela nunca afirma que a carteira aceita só um mercado)
  arquivos permitidos (e seus testes): src/app/features/carteiras/criacao/criar-carteira.ts, src/app/features/carteiras/criacao/criar-carteira.html, src/app/features/carteiras/criacao/criar-carteira.scss, src/app/features/carteiras/criacao/criar-carteira.spec.ts
  mensagem de commit: "T-042 carteiras: Tela de criação de carteira"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-042 carteiras: Tela de criação de carteira (auto-commit do plano)'
    fi
    marcar_concluidas T-042
    verde "✔ T-042 concluída"
    return 0
  fi
  vermelho "✘ T-042 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-042"
  FALHAS="$FALHAS T-042"
  return 1
}

# ── sequencial T-043 (ordem do tasks.md) ──
executar_seq_T_043() {
  info 'sequencial T-043 — Lista de carteiras com números e ações rápidas'
  if rodar_tarefa seq 'T-043' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-043 — "Lista de carteiras com números e ações rápidas"
  critérios/refs: AC-096 (Cada carteira aparece com nome, corretora, mercado e os números dela), AC-097 (A lista é paginada, da mais recente para a mais antiga), AC-098 (Cada linha oferece abrir, renomear e excluir), AC-099 (A tela nunca sugere que existem carteiras de outros investidores), AC-100 (Número que falha some da linha sem derrubar a lista), AC-119 (Exclusão aceita faz a carteira sumir, sem lixeira e sem desfazer)
  arquivos permitidos (e seus testes): src/app/features/carteiras/lista/lista-carteiras.ts, src/app/features/carteiras/lista/lista-carteiras.html, src/app/features/carteiras/lista/lista-carteiras.scss, src/app/features/carteiras/lista/lista-carteiras.spec.ts
  mensagem de commit: "T-043 carteiras: Lista de carteiras com números e ações rápidas"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-043 carteiras: Lista de carteiras com números e ações rápidas (auto-commit do plano)'
    fi
    marcar_concluidas T-043
    verde "✔ T-043 concluída"
    return 0
  fi
  vermelho "✘ T-043 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-043"
  FALHAS="$FALHAS T-043"
  return 1
}

# ── sequencial T-044 (ordem do tasks.md) ──
executar_seq_T_044() {
  info 'sequencial T-044 — Seção de posições abertas e encerradas'
  if rodar_tarefa seq 'T-044' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-044 — "Seção de posições abertas e encerradas"
  critérios/refs: AC-106 (Cada posição traz ticker, empresa, quantidade, preço médio e cotação com horário), AC-107 (A rentabilidade não realizada aparece em valor e em percentual), AC-108 (Cotação com mais de 15 minutos aparece marcada), AC-109 (A seção "Encerradas" lista exatamente os tickers com resultado realizado e sem posição aberta), AC-110 (Sem ativo encerrado, a seção não aparece), AC-111 (A seção mostra ticker e resultado realizado, e nada de posição)
  arquivos permitidos (e seus testes): src/app/features/carteiras/detalhe/posicoes-carteira.ts, src/app/features/carteiras/detalhe/posicoes-carteira.html, src/app/features/carteiras/detalhe/posicoes-carteira.scss, src/app/features/carteiras/detalhe/posicoes-carteira.spec.ts
  mensagem de commit: "T-044 carteiras: Seção de posições abertas e encerradas"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-044 carteiras: Seção de posições abertas e encerradas (auto-commit do plano)'
    fi
    marcar_concluidas T-044
    verde "✔ T-044 concluída"
    return 0
  fi
  vermelho "✘ T-044 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-044"
  FALHAS="$FALHAS T-044"
  return 1
}

# ── sequencial T-045 (ordem do tasks.md) ──
executar_seq_T_045() {
  info 'sequencial T-045 — Seção de movimentações da carteira'
  if rodar_tarefa seq 'T-045' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-045 — "Seção de movimentações da carteira"
  critérios/refs: AC-112 (A seção mostra apenas as operações desta carteira), AC-113 (Extrato maior do que o buscado é declarado como recorte parcial), AC-114 (Extrato que coube inteiro não recebe aviso de recorte)
  arquivos permitidos (e seus testes): src/app/features/carteiras/detalhe/movimentacoes-carteira.ts, src/app/features/carteiras/detalhe/movimentacoes-carteira.html, src/app/features/carteiras/detalhe/movimentacoes-carteira.scss, src/app/features/carteiras/detalhe/movimentacoes-carteira.spec.ts
  mensagem de commit: "T-045 carteiras: Seção de movimentações da carteira"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-045 carteiras: Seção de movimentações da carteira (auto-commit do plano)'
    fi
    marcar_concluidas T-045
    verde "✔ T-045 concluída"
    return 0
  fi
  vermelho "✘ T-045 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-045"
  FALHAS="$FALHAS T-045"
  return 1
}

# ── sequencial T-046 (ordem do tasks.md) ──
executar_seq_T_046() {
  info 'sequencial T-046 — Detalhe da carteira: cabeçalho, renomear e excluir'
  if rodar_tarefa seq 'T-046' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-046 — "Detalhe da carteira: cabeçalho, renomear e excluir"
  critérios/refs: AC-101 (O cabeçalho traz identificação e os quatro totais), AC-102 (Os totais aparecem em real, com a taxa de câmbio e o horário dela), AC-103 (Resultado realizado e não realizado nunca são somados), AC-104 (Aviso do consolidado é aviso, não erro), AC-105 (A tela oferece registrar compra e registrar venda para esta carteira), AC-115 (A edição alcança só o nome), AC-116 (Renomear preserva os demais dados na tela), AC-117 (A exclusão pede confirmação simples com a consequência descrita), AC-118 (Carteira com posição aberta não é excluída, e a mensagem diz o que fazer), AC-119 (Exclusão aceita faz a carteira sumir, sem lixeira e sem desfazer), AC-120 (CAR-001 nunca revela que a carteira é de outro investidor)
  arquivos permitidos (e seus testes): src/app/features/carteiras/detalhe/detalhe-carteira.ts, src/app/features/carteiras/detalhe/detalhe-carteira.html, src/app/features/carteiras/detalhe/detalhe-carteira.scss, src/app/features/carteiras/detalhe/detalhe-carteira.spec.ts
  mensagem de commit: "T-046 carteiras: Detalhe da carteira: cabeçalho, renomear e excluir"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-046 carteiras: Detalhe da carteira: cabeçalho, renomear e excluir (auto-commit do plano)'
    fi
    marcar_concluidas T-046
    verde "✔ T-046 concluída"
    return 0
  fi
  vermelho "✘ T-046 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-046"
  FALHAS="$FALHAS T-046"
  return 1
}

# ── sequencial T-047 (ordem do tasks.md) ──
executar_seq_T_047() {
  info 'sequencial T-047 — Rotas da área de carteiras'
  if rodar_tarefa seq 'T-047' 'Você executa UMA tarefa da feature "carteiras" (fluxo onp-spec, spec-anchored).
Leia primeiro: .spec/features/carteiras/spec.md, .spec/features/carteiras/tasks.md e .spec/constituicao.md.

Sua tarefa (somente ela):
T-047 — "Rotas da área de carteiras"
  critérios/refs: AC-094 (Carteira criada abre no detalhe dela), AC-098 (Cada linha oferece abrir, renomear e excluir), AC-120 (CAR-001 nunca revela que a carteira é de outro investidor)
  arquivos permitidos (e seus testes): src/app/features/carteiras/carteiras.routes.ts, src/app/features/carteiras/carteiras.routes.spec.ts, src/app/app.routes.ts
  mensagem de commit: "T-047 carteiras: Rotas da área de carteiras"

Regras inegociáveis:
- Todo critério de aceite referenciado vira teste com @spec:AC-xxx no título.
- NUNCA enfraqueça, pule (skip/todo) ou apague um teste para passar — teste pulado não é prova e o audit acusa.
- Rode os testes localmente com `npx ng test` até passarem.
- NÃO edite tasks.md, NÃO rode onp-spec verify/audit e NÃO toque em outras tarefas — o orquestrador cuida disso.
- Ao final de CADA tarefa: `git add` só no que você tocou e um commit próprio.' 'claude-sonnet-5' medium >> "$LOG_DIR/seq.log" 2>&1; then
    # commit de segurança se o agente esqueceu (rastreabilidade > perfeição)
    if [ -n "$(git status --porcelain)" ]; then
      git add -A && git commit -q -m 'T-047 carteiras: Rotas da área de carteiras (auto-commit do plano)'
    fi
    marcar_concluidas T-047
    verde "✔ T-047 concluída"
    return 0
  fi
  vermelho "✘ T-047 falhou (log: $LOG_DIR/seq.log)"
  amarelo "  reexecute só ela: bash .spec/features/carteiras/executar-tarefas.sh --seq T-047"
  FALHAS="$FALHAS T-047"
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
      amarelo "  para o veredito: bash .spec/features/carteiras/executar-tarefas.sh --gate"
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
  executar_seq_T_038 || true
  executar_seq_T_039 || true
  executar_seq_T_040 || true
  executar_seq_T_041 || true
  executar_seq_T_042 || true
  executar_seq_T_043 || true
  executar_seq_T_044 || true
  executar_seq_T_045 || true
  executar_seq_T_046 || true
  executar_seq_T_047 || true
  encerrar tudo
}

listar() {
  echo "execução: $RUN_ID (feature $FEATURE, branch $BASE_BRANCH)"
  echo "  seq       T-038 (sequencial)"
  echo "  seq       T-039 (sequencial)"
  echo "  seq       T-040 (sequencial)"
  echo "  seq       T-041 (sequencial)"
  echo "  seq       T-042 (sequencial)"
  echo "  seq       T-043 (sequencial)"
  echo "  seq       T-044 (sequencial)"
  echo "  seq       T-045 (sequencial)"
  echo "  seq       T-046 (sequencial)"
  echo "  seq       T-047 (sequencial)"
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
      T-038) evento --tipo inicio --escopo "seq:T-038"; iniciar_resumos; executar_seq_T_038 || true; encerrar "seq:T-038" ;;
      T-039) evento --tipo inicio --escopo "seq:T-039"; iniciar_resumos; executar_seq_T_039 || true; encerrar "seq:T-039" ;;
      T-040) evento --tipo inicio --escopo "seq:T-040"; iniciar_resumos; executar_seq_T_040 || true; encerrar "seq:T-040" ;;
      T-041) evento --tipo inicio --escopo "seq:T-041"; iniciar_resumos; executar_seq_T_041 || true; encerrar "seq:T-041" ;;
      T-042) evento --tipo inicio --escopo "seq:T-042"; iniciar_resumos; executar_seq_T_042 || true; encerrar "seq:T-042" ;;
      T-043) evento --tipo inicio --escopo "seq:T-043"; iniciar_resumos; executar_seq_T_043 || true; encerrar "seq:T-043" ;;
      T-044) evento --tipo inicio --escopo "seq:T-044"; iniciar_resumos; executar_seq_T_044 || true; encerrar "seq:T-044" ;;
      T-045) evento --tipo inicio --escopo "seq:T-045"; iniciar_resumos; executar_seq_T_045 || true; encerrar "seq:T-045" ;;
      T-046) evento --tipo inicio --escopo "seq:T-046"; iniciar_resumos; executar_seq_T_046 || true; encerrar "seq:T-046" ;;
      T-047) evento --tipo inicio --escopo "seq:T-047"; iniciar_resumos; executar_seq_T_047 || true; encerrar "seq:T-047" ;;
      *) falhar "tarefa sequencial desconhecida: '$ALVO' — veja as disponíveis com --listar" ;;
    esac ;;
esac
