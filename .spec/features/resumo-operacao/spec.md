# Spec: Resumo ao vivo da operação

> feature: resumo-operacao
> status: implementada

## Contexto

Em Operações, o formulário de compra e venda ocupa metade da largura e o lado direito fica
vazio até a primeira operação ser registrada ("esta muito vazio aqui", Lucas). Issue #65:
um cartão ao lado do formulário acompanha o que está sendo preenchido e, depois de
registrar, vira o comprovante. A estimativa (AC-165) passa a morar nesse cartão, com o
mesmo texto e a mesma ressalva.

## Histórias

### US-111 — Ver o que estou registrando antes de confirmar

Como investidor, quero ver ao lado do formulário a ação, a cotação, a minha posição e o
total estimado, para que eu confirme a operação sem abrir outra tela.

#### AC-402 — Sem escolha, o cartão diz o que vai aparecer

- **Dado** a tela de Operações sem carteira ou sem ação escolhida
- **Quando** ela abre
- **Então** o cartão ao lado do formulário existe e diz que ali aparecem a cotação, a posição
  na carteira e o total estimado

#### AC-403 — A ação escolhida aparece com logo, nome e cotação com horário

- **Dado** uma ação escolhida no formulário
- **Quando** o cartão se atualiza
- **Então** mostra o logo, o ticker, o nome da empresa e a última cotação conhecida, na moeda
  da ação, com o horário em que foi obtida

#### AC-404 — A posição atual na carteira escolhida

- **Dado** carteira e ação escolhidas
- **Quando** o cartão se atualiza
- **Então** mostra a quantidade e o preço médio da posição naquela carteira; na venda, a
  quantidade é rotulada como disponível para venda; sem posição, diz que a carteira ainda
  não tem essa ação

#### AC-405 — Depois de registrar, o cartão é o comprovante

- **Dado** uma operação recém-registrada
- **Quando** o comprovante aparece
- **Então** ele ocupa o lugar do resumo; ao mexer de novo no formulário, o resumo volta

## Fora de escopo

- Posição projetada depois da operação (novo preço médio): o backend calcula e não expõe
  a regra; mostrar uma conta própria criaria um segundo número para o mesmo dado.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-101 | O preço médio de `GET /carteiras/{id}/posicoes` vem na moeda da ação, como a cotação | confirmada | Corrigido na #62 (ASM-025 invalidada): as posições do backend vêm na moeda da ação |

## Perguntas em aberto

Nenhuma.
