# ADR-005: Cotação como snapshot datado, com cache, nunca como preço ao vivo

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: dados-externos, cache, frontend

## Contexto e problema

As fontes de cotação usadas são gratuitas e têm cota limitada (mensal na fonte brasileira, diária na americana). Desde a SPEC-07 o preço de cada ação funciona como cache com tempo de vida configurável — dentro desse prazo, comprar, vender ou atualizar a cotação reaproveitam o valor salvo sem chamar a fonte. O mesmo vale para câmbio e para a barra de mercado.

Toda cotação é gravada com o momento em que foi obtida.

## Fatores de decisão

- Cota gratuita não suporta atualização contínua para vários investidores
- Preço financeiro sem data é informação enganosa, não informação incompleta
- O investidor-alvo entende o conceito de defasagem, desde que ela seja dita

## Opções consideradas

- Snapshot datado, sempre exibido com o horário de obtenção
- Buscar preço a cada carregamento de tela
- Atualização automática em intervalo curto (polling)

## Decisão

**Snapshot datado.** Toda cotação e toda taxa de câmbio exibidas no produto vêm acompanhadas do horário em que foram obtidas — em todas as telas, sem exceção. Quando a idade do dado ultrapassa um limite, a interface o marca visualmente, e não apenas em texto.

Atualizar cotação é ação explícita do investidor. O frontend **não** faz polling: isso queimaria a cota compartilhada por todos os investidores em poucos minutos e transformaria a demonstração do trabalho em uma sequência de erros 429.

Uma consequência que confunde e precisa ser tratada na interface: pedir atualização pode devolver o mesmo preço, porque o cache ainda é válido. A tela precisa dizer que o valor continua atual, e não fingir que buscou algo novo.

### Consequências positivas

- Cota das fontes gratuitas sobrevive à demonstração e ao uso real
- O investidor consegue julgar se pode decidir com o número que vê
- O comportamento é o mesmo em cotação, câmbio e barra de mercado

### Consequências negativas

- Nenhuma tela do produto mostra preço em tempo real, e alguém vai comparar com o home broker
- Cada valor monetário carrega um horário junto, ocupando espaço na tela
- Atualizar e não ver o número mudar parece um bug, se a tela não explicar

## Prós e contras

### Snapshot datado ✅ Escolhida

- ✅ Compatível com cota gratuita
- ✅ Honesto sobre a idade do dado
- ❌ Não é tempo real

### Buscar a cada carregamento

- ✅ Dado mais novo
- ❌ Estoura a cota rapidamente

### Polling automático

- ✅ Sensação de tempo real
- ❌ Inviável na cota gratuita

## Links

- PRD-006 v1 — Catálogo de ações · PRD-009 v1 — Confiabilidade percebida
- spec-07-cache-cotacao, spec-09-barra-cotacoes
