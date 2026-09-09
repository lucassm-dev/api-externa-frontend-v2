# ADR-004: Carteira multimercado com consolidação em moeda única

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: domínio, câmbio, frontend

## Contexto e problema

A carteira nasceu com um mercado (BR ou US) e a intenção de que ativos brasileiros e americanos nunca se misturassem. Durante a SPEC-08 essa trava foi removida: a carteira passou a aceitar ações dos dois mercados, e o total consolidado passa a converter valores em dólar para real usando uma taxa de câmbio de fonte externa, com cache e fallback.

O campo de mercado da carteira continua existindo, mas agora é referência de moeda, não uma restrição.

## Fatores de decisão

- Obrigar uma carteira por mercado multiplicava carteiras para quem investe nos dois
- Somar moedas diferentes sem taxa visível produz um número que ninguém consegue conferir
- A fonte de câmbio é externa e falha; o total não pode depender dela estar no ar

## Opções consideradas

- Carteira multimercado, consolidando em moeda única com taxa e horário visíveis
- Carteira restrita a um mercado, com totais nunca somados
- Carteira multimercado, exibindo dois totais lado a lado sem conversão

## Decisão

**Carteira multimercado com consolidação em moeda única.** Todo total que envolva mais de uma moeda exibe, junto do número, a taxa de câmbio usada e o horário em que ela foi obtida. Quando a fonte de câmbio falha, o total é calculado com a última taxa conhecida e recebe um aviso explícito. Só quando nunca houve taxa alguma a operação é recusada.

Dois totais lado a lado foram recusados porque não respondem à pergunta que o investidor faz: "quanto eu tenho?". A conversão responde — desde que a taxa esteja à vista.

Consequência para as telas: **nenhuma interface pode afirmar que a carteira aceita apenas um mercado.** O campo de mercado é apresentado como moeda de referência.

### Consequências positivas

- Uma carteira só para quem investe nos dois mercados
- O total consolidado responde a pergunta real do investidor
- Taxa visível torna o número conferível

### Consequências negativas

- O resultado passa a variar por câmbio, e não só por preço de ativo — e isso confunde
- Toda tela que exibe total precisa carregar taxa e horário junto
- Um número pode mudar entre duas visitas sem nenhuma operação ter ocorrido

## Prós e contras

### Multimercado com conversão ✅ Escolhida

- ✅ Responde "quanto eu tenho"
- ✅ Menos carteiras para gerenciar
- ❌ Mistura risco cambial com risco do ativo

### Um mercado por carteira

- ✅ Cálculo sem câmbio
- ❌ Já foi removido do backend

### Dois totais sem conversão

- ✅ Sem risco cambial no número
- ❌ Não responde à pergunta do investidor

## Links

- PRD-005 v1 — Carteiras · PRD-008 v1 — Desempenho e dashboards
- spec-08-conversao-cambio, `docs/erros.md` (EXT-011, OPE-002 removido)
