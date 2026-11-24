# TDD: migracao react — revisão v2 (orçamento do bundle)

> feature: migracao-react
> revisa: [design.md §16](design.md#16-performance-e-capacidade), que fica preservado
> status: aprovado — Lucas, 2026-11-24

Esta revisão troca só o orçamento de bundle do §16. O resto do TDD continua valendo
como está em [design.md](design.md).

## Diferença

| | design.md §16 (original) | esta revisão |
|---|---|---|
| Teto do bundle inicial | não passar o do Angular: 378,08 kB brutos / 89,16 kB de transferência | 470 kB brutos / 141 kB gzip |
| Como se confere | medição manual no corte | `npm run build` falha acima do teto ([scripts/orcamento-bundle.mjs](../../../scripts/orcamento-bundle.mjs)) |

## Motivo

Medido no corte (T-138, 2026-11-24, `vite build`, soma do JS e do CSS que o
`index.html` carrega, gzip nível 9):

| Arquivo | Bruto | gzip |
|---|---|---|
| `index-*.js` (react-dom, sonner, casca) | 262,10 kB | 80,1 kB |
| `botao-*.js` (react-router, tailwind-merge, kit) | 148,91 kB | 48,5 kB |
| `index-*.css` (Tailwind, @font-face) | 57,42 kB | 11,5 kB |
| **Total** | **468,43 kB** | **140,24 kB** |

A primeira medida deu 529 kB / 167 kB. O CSS levava 57 `@font-face` (62 kB) de
alfabetos que o produto não usa. Com só o subconjunto latino das fontes, o total
caiu para o número acima.

Só `react-dom` e `react-router` somam cerca de 260 kB brutos / 80 kB gzip antes de
qualquer código do produto. O teto do Angular não cabe na stack decidida no
[ADR](adr.md). O Angular também não carregava fonte nenhuma: usava a do sistema.

## Decisão

Pergunta pela ferramenta nativa (Claude Code, AskUserQuestion, 2026-11-24,
sessão 7800ca77). Opções: aceitar e fixar novo teto; otimizar antes de fechar
(~410 kB / ~122 kB estimados, ainda acima do Angular); manter o teto do Angular.
Resposta literal: "Aceitar e fixar novo teto (Recomendado)". Registrada como Q-042
na [spec](spec.md).

O teto aprovado foi descrito como "470 kB brutos / 140 kB gzip, o número medido
agora". A medida de gzip ficou em 140,24 kB, então o teto de gzip ficou em 141 kB,
arredondado para cima como o bruto, para não reprovar o próprio número aprovado.
