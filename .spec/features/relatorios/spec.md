# Spec: Relatórios do investidor

> feature: relatorios
> status: implementada

## Contexto

O relatório do investidor do backend (extrato com filtros de período, ação, carteira, tipo
e resultado, ADR-018) entrou no front dentro de Operações, abaixo do formulário de registro
(filtros-extrato, #28 e #29). Na revisão com o backend real, o Lucas não o encontrou: "falta
ainda o relatorio no ROLE_INVESTIDOR". Decisão dele em 27/11/2026 (Q-055): uma área própria
no menu, com os totais do recorte inteiro; Operações fica para registrar e para o extrato
recente. Issue #64.

Esta spec substitui: filtros-extrato AC-340, AC-342, AC-343, AC-344, AC-346 e AC-347 (os
filtros saem de Operações e vêm para cá; AC-341 e AC-345 continuam valendo em Operações);
painel AC-047 e identidade-papel AC-316 (o menu do investidor ganha Relatórios), por decisão
do Lucas em 27/11/2026 (Q-056).

## Histórias

### US-110 — Achar e recortar as minhas movimentações

Como investidor, quero uma área de relatórios no menu, para que eu recorte as minhas
movimentações sem passar pelo formulário de registro.

#### AC-394 — A área Relatórios é do investidor

- **Dado** um investidor ou um administrador conectado
- **Quando** a área interna abre, ou o administrador abre `/relatorios` pelo endereço
- **Então** o menu do investidor oferece "Relatórios"; o do administrador não, e o endereço
  o leva aos usuários sem requisitar `/operacoes`

#### AC-395 — Os filtros vão ao servidor, se combinam e moram no endereço

- **Dado** a área Relatórios
- **Quando** o investidor aplica data inicial e final, ação, carteira, tipo e resultado
- **Então** `GET /operacoes` sai com `dataInicio`, `dataFim`, `ticker`, `carteiraId`, `tipo` e
  `resultado`, o recorte vai para o endereço e sobrevive ao recarregar, e a dica do resultado
  diz que é o lucro realizado, então só vendas entram

#### AC-396 — Data final antes da inicial não sai

- **Dado** uma data final anterior à inicial
- **Quando** o investidor aplica os filtros
- **Então** o campo "Data final" diz que ela não pode ser anterior à inicial e nenhuma
  requisição sai; `OPE-006` do servidor mostra o mesmo texto

#### AC-397 — Os totais somam o recorte inteiro, em real

- **Dado** um recorte com mais operações do que cabem numa página
- **Quando** a área mostra os totais
- **Então** eles somam todas as páginas do recorte: quantas compras e vendas, o volume
  comprado e vendido e o lucro e o prejuízo realizados, em real

#### AC-398 — Operação em dólar entra convertida pela taxa dela

- **Dado** uma operação em dólar no recorte
- **Quando** os totais são somados
- **Então** o volume e o resultado dela entram multiplicados pela taxa de câmbio daquela
  operação (`taxaCambioNaOperacao`), nunca somados como se fossem real

#### AC-399 — A tabela do recorte é só leitura e diz quando não há nada

- **Dado** o recorte aplicado
- **Quando** a tabela aparece
- **Então** ela é paginada, não oferece editar nem excluir, e um recorte sem operações mostra
  um estado vazio com "Limpar filtros"

#### AC-400 — Operações deixa os filtros para os Relatórios

- **Dado** a tela de Operações
- **Quando** ela abre
- **Então** o extrato recente não tem barra de filtros, e um link leva aos Relatórios

#### AC-401 — O menu do investidor leva às sete áreas, em ordem

- **Dado** um investidor conectado, em qualquer tela da área interna
- **Quando** ele olha a barra superior
- **Então** encontra Painel, Corretoras, Carteiras, Ações, Operações, Relatórios e Desempenho,
  nessa ordem, e a área em que está aparece marcada

## Fora de escopo

- Exportar o relatório para arquivo (o backend não oferece).
- Totais convertidos pela cotação de hoje: o resultado realizado é da data da venda.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-099 | `lucroRealizado` e `valorTotal` de cada operação vêm na moeda da ação, e `taxaCambioNaOperacao` é a taxa daquela operação (1 para real) | confirmada | `OperacaoMapper` e `Operacao` do backend: `lucroRealizado` é o valor na moeda da ação, e o backend usa a taxa da operação para o `lucroRealizadoBrl` (lido em 27/11/2026) |
| ASM-100 | Ler o recorte inteiro em páginas de 200 cabe no uso real; até 25 páginas (5.000 operações) por recorte | confirmada | Carteiras hipotéticas de um investidor; o limite fica num comentário `shortcut:` no código |

## Perguntas em aberto

| ID | Pergunta | Status | Resposta |
|---|---|---|---|
| Q-055 | Como entra o relatório do investidor? | respondida | Área "Relatórios" no menu, com filtros, totais do recorte inteiro e tabela; Operações fica para registrar e para o extrato recente (Lucas, 27/11/2026) |
| Q-056 | AC-047 (painel) e AC-316 (identidade-papel) listam o menu exato do investidor, sem Relatórios. O que fazer com eles? | respondida | Superados pelo AC-401, com as sete áreas do investidor em ordem (Lucas, 27/11/2026) |
