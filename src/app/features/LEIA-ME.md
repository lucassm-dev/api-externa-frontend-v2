# Features

Uma pasta por PRD. Cada uma se carrega por rota e importa apenas de `core/`
(o que existe uma vez e atravessa tudo) e de `shared/` (apresentação sem regra).
Nenhuma feature importa de outra: quando duas precisam da mesma coisa, ela sobe.

| Pasta | PRD | O que mora aqui |
|---|---|---|
| `acesso/` | PRD-002 | Cadastro, login e saída |
| `painel/` | PRD-003 | Painel inicial, inclusive vazio |
| `corretoras/` | PRD-004 | Cadastro e lista de corretoras |
| `carteiras/` | PRD-005 | Carteiras do investidor |
| `acoes/` | PRD-006 | Catálogo de ações e cotação |
| `operacoes/` | PRD-007 | Compra, venda e extrato |
| `desempenho/` | PRD-008 | Desempenho e dashboards |

As pastas estão vazias de propósito: nenhuma tela de produto foi construída
na fundação. PRD-009 (confiabilidade) não tem pasta — ele é comportamento
transversal e vive em `core/erros`, `core/feedback` e `core/dados`.
