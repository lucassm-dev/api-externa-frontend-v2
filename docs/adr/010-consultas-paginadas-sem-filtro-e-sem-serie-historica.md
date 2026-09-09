# ADR-010: Consultas paginadas, sem filtro no servidor e sem série histórica

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: dados, limitações, frontend

## Contexto e problema

Duas limitações do backend afetam diretamente o que o frontend pode prometer:

1. **As listagens são paginadas e não aceitam filtro.** O extrato de operações devolve todas as operações do investidor, em todas as carteiras, sem parâmetro de carteira, ticker, tipo ou período. O mesmo vale para as listas de ações, corretoras e carteiras.
2. **Não existe série histórica.** O sistema guarda a cotação atual de cada ação, e não o histórico dela. Não há registro do valor da carteira ao longo do tempo.

Ambas são fáceis de esquecer ao desenhar telas, e caras de descobrir depois.

## Fatores de decisão

- Filtrar no cliente apenas a página carregada produz resultado errado com cara de certo
- Gráfico de evolução é a primeira coisa que se espera de uma tela de desempenho
- Aumentar o escopo do backend agora atrasa o frontend

## Opções consideradas

- Assumir as limitações e desenhar o v1 sem filtros e sem evolução temporal
- Filtrar no cliente sobre a página atual
- Ampliar o backend antes de começar o frontend

## Decisão

**Assumir as limitações no v1.** O extrato entrega ordenação e paginação, sem filtros. O recorte por carteira é atendido pela visão de movimentações dentro da própria carteira, que já existe. Os gráficos de desempenho são retratos do agora — composição, contribuição por ativo, lucro realizado por ticker, comparação entre carteiras — e nenhum deles apresenta evolução no tempo.

Filtrar sobre a página carregada foi recusado explicitamente: o investidor filtra por um ticker, não encontra a operação que sabe existir, e conclui que o sistema perdeu o lançamento. Um filtro que mente é pior que a ausência de filtro.

Ampliar o backend antes é a saída correta a médio prazo, e deve virar um ADR que supersede este quando acontecer.

### Consequências positivas

- Nenhuma tela do v1 promete o que os dados não sustentam
- Escopo de frontend fechado e executável
- As duas lacunas ficam registradas como trabalho futuro conhecido

### Consequências negativas

- Extrato longo só navegável por paginação
- A tela de desempenho não responde "como minha carteira evoluiu no último mês", que é uma pergunta natural
- Quando o backend ganhar filtro e histórico, as telas afetadas serão refeitas, não estendidas

## Prós e contras

### Assumir as limitações ✅ Escolhida

- ✅ Honesto com o que o backend entrega
- ✅ Escopo do v1 fechado
- ❌ Deixa perguntas do investidor sem resposta

### Filtrar no cliente

- ✅ Parece resolver
- ❌ Resultado incorreto com aparência de correto

### Ampliar o backend antes

- ✅ Resolve de verdade
- ❌ Atrasa o frontend

## Links

- PRD-007 v1 — Operações e movimentações · PRD-008 v1 — Desempenho e dashboards
- `GET /operacoes`, `GET /carteiras/{id}/posicoes`, `GET /carteiras/{id}/consolidado`
