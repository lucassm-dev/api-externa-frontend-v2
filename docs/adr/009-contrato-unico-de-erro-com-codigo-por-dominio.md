# ADR-009: Contrato único de erro com código por domínio

- **Data**: 2026-09-08
- **Status**: Aceito
- **Decisores**: Lucas Mendes (dono do produto)
- **Tags**: erros, contrato, frontend

## Contexto e problema

Desde a SPEC-01 toda resposta de erro do backend tem o mesmo formato, com um código estável por domínio (`COR-003`, `ACA-004`, `CAR-002`, `OPE-004`, `AUT-001`, `EXT-009`, `VAL-001`, `SYS-001`) e uma lista de erros por campo nas falhas de validação. Nenhuma resposta expõe stacktrace ou nome de classe interna, e o catálogo completo vive em `docs/erros.md`.

Isso dá ao frontend algo raro: um conjunto fechado e versionado de situações de erro, conhecido antes de escrever a primeira tela.

## Fatores de decisão

- Mensagem de servidor exibida crua ao investidor é ruim de ler e vaza detalhe interno
- Depender do texto da mensagem para decidir o que a tela faz quebra quando o texto muda
- Erro de validação precisa apontar o campo, não um balão genérico

## Opções consideradas

- Tratar erro pelo código, com textos próprios do frontend e o código exibido discretamente
- Exibir a mensagem do backend diretamente
- Tratar erro pelo status HTTP apenas

## Decisão

**Tratar pelo código.** O frontend decide o que fazer olhando o código do erro, nunca o texto. Os textos vistos pelo investidor são escritos do lado do frontend, na linguagem dele. O código aparece de forma discreta, apenas para que ele consiga relatar um problema.

Status HTTP sozinho é insuficiente: vários códigos diferentes compartilham o mesmo status (422 cobre corretora não autorizada, venda acima da posição e senha fraca, entre outros), e cada um pede uma tela diferente.

Casos que exigem tratamento nomeado, não genérico: pré-requisito não atendido (`ACA-004`) leva ao passo que falta; duplicidade (`COR-002`, `ACA-002`) leva ao registro existente em vez de virar erro; falha de verificação externa (`EXT-007`) nunca é apresentada como reprovação; erro não mapeado (`SYS-001`) vira mensagem honesta e genérica.

### Consequências positivas

- As mensagens do produto têm voz única, independente do backend
- Mudança de texto no servidor não quebra tela
- O catálogo de erros funciona como lista de casos a cobrir antes de codar

### Consequências negativas

- Cada código novo no backend exige texto novo no frontend, ou cai no genérico
- Um código não previsto degrada para "algo deu errado", que ajuda pouco
- Manter dois catálogos — o do backend e o dos textos — exige disciplina

## Prós e contras

### Tratamento por código ✅ Escolhida

- ✅ Estável e testável
- ✅ Voz própria do produto
- ❌ Exige manter o mapa de códigos sincronizado

### Mensagem do backend exibida crua

- ✅ Zero trabalho
- ❌ Linguagem técnica e detalhe interno na tela

### Só status HTTP

- ✅ Simples
- ❌ 422 cobre situações que pedem telas diferentes

## Links

- PRD-009 v1 — Confiabilidade percebida
- `docs/erros.md`, spec-01-padronizacao-erros
