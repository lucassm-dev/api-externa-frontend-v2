# Tasks: Carteiras

> feature: carteiras

## T-038 — Contratos e serviço das carteiras [concluida]
- Refs: AC-093, AC-094, AC-097, AC-100, AC-112, AC-113
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/movimentacoes-da-carteira.spec.ts, src/features/carteiras/movimentacoes-da-carteira.ts, src/features/carteiras/posicoes-carteira.tsx, src/features/corretoras/corretoras.model.ts
- Notas: os sete endpoints — criar (`{ corretoraId, mercado, nome }`), listar paginado com `sort=id,desc`, posições, consolidado, lucro realizado, renomear (`PATCH { nome }`) e excluir — mais a leitura larga do extrato global (`size=200`, Q-012) que devolve os itens e o `totalElements` para a tela decidir se o recorte é parcial. Os números da lista (consolidado e lucro realizado por carteira) nunca propagam erro: falha vira ausência de número (Q-013, AC-100). Nenhum mercado padrão mora aqui — o serviço envia o que recebe (AC-093). Não existe `GET /carteiras/{id}`: o detalhe acha a carteira percorrendo a própria listagem, e não achar equivale a CAR-001 (Q-015).

## T-039 — Posições encerradas: derivação pura [concluida]
- Refs: AC-109, AC-110, AC-111
- Arquivos: src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/posicoes-encerradas.spec.ts, src/features/carteiras/posicoes-encerradas.ts
- Notas: o backend não devolve encerradas. A função cruza `lucro-realizado.porTicker` com os tickers que ainda têm posição aberta e devolve o que sobra, com ticker e resultado realizado — nada de quantidade ou preço médio, que não existem mais (AC-111). Lista vazia é resultado legítimo e faz a seção desaparecer (AC-110).

## T-040 — Recorte do extrato por carteira: derivação pura [concluida]
- Refs: AC-112, AC-113, AC-114
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/movimentacoes-da-carteira.spec.ts, src/features/carteiras/movimentacoes-da-carteira.ts, src/features/carteiras/posicoes-carteira.tsx
- Notas: filtra por `carteiraId` no cliente (o servidor não filtra, ADR-010) e devolve, junto das movimentações, se o recorte é parcial — comparando `totalElements` do investidor com quantos itens foram buscados. Parcial não é detalhe de implementação: é o que a tela precisa declarar (AC-113).

## T-041 — Rentabilidade percentual da posição [concluida]
- Refs: AC-107
- Arquivos: src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/rentabilidade.spec.ts, src/features/carteiras/rentabilidade.ts
- Notas: o backend manda a rentabilidade não realizada em valor; o percentual sai sobre o custo da posição (preço médio × quantidade). Custo zero não gera percentual — devolve nulo em vez de infinito.

## T-042 — Tela de criação de carteira [concluida]
- Refs: AC-091, AC-092, AC-093, AC-094, AC-095
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/corretoras/cadastro-corretora.tsx, src/features/corretoras/corretoras.model.ts, src/features/corretoras/corretoras.service.ts, src/features/corretoras/corretoras.spec.tsx, src/features/corretoras/detalhe-corretora.tsx, src/features/corretoras/lista-corretoras.tsx
- Notas: três campos, nenhum a mais (AC-091). O mercado continua no formulário porque o backend o exige, apresentado como moeda de referência com o texto de que a carteira aceita ações dos dois mercados (AC-095, ADR-004) — e sem valor padrão escondido: sem escolha, nada é enviado (AC-093). Catálogo vazio não vira seletor vazio: a tela conduz ao cadastro de corretora e volta para cá (AC-092) — a volta é um `voltarPara` na rota, honrado pelo cadastro de corretora, que segue indo ao detalhe quando ninguém o mandou voltar.

## T-043 — Lista de carteiras com números e ações rápidas [concluida]
- Refs: AC-096, AC-097, AC-098, AC-099, AC-100, AC-119
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/corretoras/corretoras.model.ts
- Notas: paginada e ordenada do mais recente para o mais antigo (AC-097). Os números vêm por carteira, cada leitura independente, e o que falhar apenas some da linha (Q-013, AC-100). Ações rápidas na própria linha (AC-098). Nenhum texto sugere carteiras de terceiros, e a exclusão feita aqui só faz a carteira sumir — sem lixeira, sem desfazer (AC-099, AC-119, ADR-007).

## T-044 — Seção de posições abertas e encerradas [concluida]
- Refs: AC-106, AC-107, AC-108, AC-109, AC-110, AC-111
- Arquivos: src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/carteiras/posicoes-encerradas.spec.ts, src/features/carteiras/posicoes-encerradas.ts, src/features/carteiras/rentabilidade.spec.ts, src/features/carteiras/rentabilidade.ts
- Notas: cotação sempre com horário, usando o componente da fundação que marca o dado defasado acima de 15 minutos (AC-108). Rentabilidade em valor e percentual com seta e palavra, nunca só cor (AC-107). Logo abaixo, a seção de encerradas derivada na T-039, que só existe quando há pelo menos um ativo (AC-110).

## T-045 — Seção de movimentações da carteira [concluida]
- Refs: AC-112, AC-113, AC-114
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/movimentacoes-da-carteira.spec.ts, src/features/carteiras/movimentacoes-da-carteira.ts, src/features/carteiras/posicoes-carteira.tsx
- Notas: consome o recorte da T-040. Quando o extrato do investidor é maior do que o que foi buscado, a seção declara que mostra as N mais recentes e aponta o extrato completo (AC-113); quando coube tudo, nenhum aviso aparece (AC-114). Um recorte parcial nunca é apresentado como completo.

## T-046 — Detalhe da carteira: cabeçalho, renomear e excluir [concluida]
- Refs: AC-101, AC-102, AC-103, AC-104, AC-105, AC-115, AC-116, AC-117, AC-118, AC-119, AC-120
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/corretoras/corretoras.model.ts
- Notas: a tela mais densa do produto. O cabeçalho traz identificação e os quatro totais em real, com taxa de câmbio e horário (AC-101, AC-102); realizado e não realizado ficam em números separados e nenhum total os soma (AC-103). Avisos do consolidado entram como aviso e não bloqueiam (AC-104, ADR-006). Atalhos de compra e venda apontam para a área de operações com a carteira identificada (AC-105, Q-014). Renomear edita só o nome e não recarrega o resto da tela (AC-115, AC-116). Excluir usa o diálogo compartilhado; CAR-002 cancela com o texto acionável do catálogo, CAR-001 devolve à lista com "Carteira não encontrada." e nenhum texto cita outro investidor (AC-117, AC-118, AC-119, AC-120).

## T-047 — Rotas da área de carteiras [concluida]
- Refs: AC-094, AC-098, AC-120
- Arquivos: src/core/api/pagina.ts, src/core/feedback/feedback.service.ts, src/features/carteiras/carteiras.model.ts, src/features/carteiras/carteiras.service.spec.ts, src/features/carteiras/carteiras.service.ts, src/features/carteiras/criar-carteira.tsx, src/features/carteiras/detalhe-carteira.tsx, src/features/carteiras/detalhe.spec.tsx, src/features/carteiras/lista-carteiras.tsx, src/features/carteiras/lista-e-criacao.spec.tsx, src/features/carteiras/movimentacoes-carteira.tsx, src/features/carteiras/posicoes-carteira.tsx, src/features/corretoras/corretoras.model.ts
- Notas: substitui a área em construção pelas três telas — lista, `nova` e `:id` — sob a casca e a guarda de sessão, com `nova` antes de `:id` como em corretoras.
