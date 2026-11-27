# Spec: Situação cadastral legível

> feature: situacao-cadastral
> status: implementada

## Contexto

Na revisão contra o backend real (#42), o detalhe da XP mostrou "Situação cadastral: 2". O
backend repassa o código da Receita Federal para a situação do CNPJ, e o front mostrava o
código cru. Issue #56; correção pedida pelo Lucas em 26/11/2026.

## Histórias

### US-108 — Ler a situação cadastral da corretora

Como usuário, quero ler a situação cadastral da corretora pelo nome, para que eu saiba se
ela está ativa sem conhecer os códigos da Receita.

#### AC-389 — O código da Receita aparece pelo nome

- **Dado** uma corretora cuja situação cadastral chega como código da Receita (1, 2, 3, 4 ou 8)
- **Quando** o detalhe abre
- **Então** aparece o nome: Nula, Ativa, Suspensa, Inapta ou Baixada

#### AC-390 — Situação por extenso ou desconhecida aparece como veio

- **Dado** uma situação que já chega por extenso (ex.: "ATIVA") ou um código fora da lista
- **Quando** o detalhe abre
- **Então** ela aparece como veio, sem inventar significado

## Fora de escopo

- Corrigir o backend para mandar o nome: o front trata os dois formatos.

## Suposições

| ID | Suposição | Status | Resolução |
|---|---|---|---|
| ASM-097 | Os códigos de situação cadastral da Receita são 1 Nula, 2 Ativa, 3 Suspensa, 4 Inapta e 8 Baixada | confirmada | Tabela de situação cadastral do CNPJ da Receita Federal; o backend repassa o valor da consulta sem traduzir |

## Perguntas em aberto

Nenhuma.
