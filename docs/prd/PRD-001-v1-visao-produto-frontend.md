# PRD-001 v1 — Visão do produto: aplicação do investidor

**Status:** proposto · **Data:** 08/09/2026 · **Substitui:** — · **Referência:** `docs/prd/PRD-sistema-investimentos-acoes.md` (PRD do produto/backend)

## O QUÊ

Uma aplicação web onde o investidor monta carteiras hipotéticas de ações, registra compras e vendas a preço de mercado e acompanha como essas carteiras se comportam ao longo do tempo. Nada de dinheiro real: não há saldo, depósito, ordem enviada a corretora nem custódia espelhada.

O produto responde a uma pergunta só: **"o que aconteceria se eu montasse esta carteira?"**

## Para QUEM

Há um único perfil de usuário: **o investidor**. Não existe perfil administrador, nem back-office, nem cliente indireto. Quem cadastra é quem opera é quem analisa.

O investidor-alvo já investe. Já tem conta em corretora, já comprou ação, entende preço médio, rentabilidade e a diferença entre lucro realizado e não realizado. Ele tolera — e prefere — tela densa de números a onboarding guiado com ilustração.

Perfil secundário, atendido por consequência e não por decisão: o iniciante curioso. Ele não dirige nenhuma escolha de interface.

## Por QUÊ

Testar uma tese de investimento hoje custa dinheiro real ou dá trabalho manual. Planilha não atualiza preço sozinha. As ferramentas de mercado analisam ativos individuais, não uma carteira montada agora. Existe espaço para uma ferramenta gratuita que junte carteira, preço de mercado real e histórico de movimentações num lugar só.

## O que a aplicação precisa deixar claro o tempo todo

Três verdades do produto que atravessam todas as telas:

1. **O preço na tela não é ao vivo.** Toda cotação exibida vem com o momento em que foi obtida. Uma tela que mostra número sem hora está incompleta.
2. **A rentabilidade ignora dividendos e JCP.** O produto não tem esse dado. Uma ação parada no preço que distribuiu dinheiro aparece como rentabilidade zero, e isso precisa estar dito na tela de desempenho, não escondido no rodapé.
3. **Fonte externa cai, e a tela continua funcionando.** Quando um dado externo falha, o produto mostra o último valor conhecido com um aviso — não uma tela de erro.

## Fora do escopo desta aplicação

Ordem real, custódia, backtest em data passada, proventos, apuração de IR, venda a descoberto, recomendação de investimento, qualquer ativo que não seja ação, e qualquer tela de administração de outros investidores.

## Mapa de features (cada uma tem seu PRD)

| PRD | Feature | Depende de |
|---|---|---|
| PRD-002 v1 | Acesso e identidade | — |
| PRD-003 v1 | Painel inicial | PRD-002 |
| PRD-004 v1 | Corretoras | PRD-002 |
| PRD-005 v1 | Carteiras | PRD-004 |
| PRD-006 v1 | Catálogo de ações | PRD-005 |
| PRD-007 v1 | Operações e movimentações | PRD-005, PRD-006 |
| PRD-008 v1 | Desempenho e dashboards | PRD-007 |
| PRD-009 v1 | Confiabilidade percebida | todas |

## Fluxo do primeiro uso

O produto tem uma ordem de entrada obrigatória, herdada das regras do domínio (ver ADR-003):

```
cadastro → login → painel inicial (vazio)
   → cadastrar corretora
   → criar carteira (escolhendo a corretora)
   → cadastrar ação no catálogo
   → registrar compra
   → acompanhar desempenho
```

O painel inicial de um investidor novo é uma tela vazia. **A tela vazia é uma feature**, não um estado degradado: ela conduz ao próximo passo do fluxo acima. Ver PRD-003.

## Métricas de sucesso propostas

- Percentual de investidores que chegam da primeira tela até a primeira compra registrada sem abandonar
- Percentual de investidores que criam uma segunda carteira
- Percentual de carteiras ainda consultadas 30 dias depois da criação

## Decisões de apresentação `[D]` 08/09/2026

- **Tema claro e escuro**, ambos. Nenhuma informação pode depender só de cor para ser lida — ganho e perda precisam de sinal ou seta além da cor.
- **Desktop apenas no v1.** Sem responsividade para celular. A persona trabalha em tela grande e densa, e a decisão libera espaço para tabelas largas e gráficos lado a lado. Celular fica para o v2.
- **Idioma único: pt-BR.** Sem infraestrutura de tradução. Valores em real e dólar seguem a formatação brasileira, com o símbolo da moeda distinguindo os dois.

## Perguntas em aberto

Nenhuma.
