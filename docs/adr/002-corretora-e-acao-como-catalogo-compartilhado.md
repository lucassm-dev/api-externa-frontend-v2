# ADR-002: Corretora e ação como catálogo compartilhado entre investidores

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: domínio, modelagem, frontend

## Contexto e problema

O enunciado do trabalho exige CNPJ único para corretora e ticker único para ação — no sistema inteiro, não por investidor. Isso força uma consequência que não é óbvia na interface: existe **uma única PETR4** e **uma única XP Investimentos** para todos os investidores da plataforma.

Carteira e operação, ao contrário, pertencem ao investidor logado e são filtradas por ele em toda consulta.

## Fatores de decisão

- Unicidade global de ticker e CNPJ é requisito herdado, não escolha
- Cotação é cara (cota de API gratuita); catálogo compartilhado permite reaproveitar preço entre investidores
- O risco maior é de leitura: se o investidor achar que a ação é "dele", vai esperar comportamento que o sistema não tem

## Opções consideradas

- Catálogo global de corretoras e ações, carteiras e operações por investidor
- Catálogo por investidor, com duplicação de ticker e CNPJ
- Catálogo global, mas apresentado na interface como se fosse do investidor

## Decisão

**Catálogo global, apresentado como global.** As telas de corretoras e ações se chamam "Corretoras" e "Ações", nunca "Minhas corretoras" ou "Minhas ações". As telas de carteiras e o extrato de operações são explicitamente do investidor.

A terceira opção — global por baixo, pessoal na apresentação — foi recusada por produzir surpresas caras: o investidor veria uma ação que "não cadastrou", ou seria impedido de excluir uma corretora por causa de uma carteira que não é dele. Mentir na apresentação transfere o custo para o suporte.

Onde catálogo e dado pessoal se encontram é nos formulários: ao criar carteira o investidor escolhe uma corretora do catálogo; ao registrar compra escolhe uma ação do catálogo. Cada formulário oferece atalho para cadastrar no catálogo sem sair do fluxo.

### Consequências positivas

- Alinhado com a unicidade exigida pelo enunciado, sem contorno artificial
- Cotação buscada por um investidor serve a todos, economizando cota da API
- Menos cadastro repetido para quem chega depois

### Consequências negativas

- O investidor vê corretoras e ações que não cadastrou, e precisa entender por quê
- Um investidor pode excluir do catálogo algo que outro cadastrou
- Exclusão bloqueada por posição de terceiro é difícil de explicar sem expor dado alheio

## Prós e contras

### Catálogo global, apresentado como global ✅ Escolhida

- ✅ Coerente com o backend
- ✅ Economiza chamadas externas
- ❌ Exige explicação na interface

### Catálogo por investidor

- ✅ Modelo mental mais simples
- ❌ Viola a unicidade exigida
- ❌ Multiplica chamadas às fontes externas

## Links

- PRD-004 v1 — Corretoras · PRD-005 v1 — Carteiras · PRD-006 v1 — Catálogo de ações
- ADR-003 (ordem de cadastro), ADR-007 (exclusão lógica)
