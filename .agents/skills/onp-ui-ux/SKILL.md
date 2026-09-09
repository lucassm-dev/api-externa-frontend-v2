---
name: onp-ui-ux
description: UI/UX universal com prova mecânica — direção de design intencional (anti-genérico), regras concretas de UX/acessibilidade e um motor de validação EMBARCADO (Python stdlib, zero instalação, sem navegador) que analisa HTML, CSS, JSX/TSX, Vue e Svelte e falha via exit code. Use ao criar ou revisar qualquer interface: página, tela, componente, landing page, dashboard, e-mail HTML. Gatilhos "criar interface", "criar tela/página/landing", "melhorar UI", "revisar UX", "acessibilidade", "validar UI", "design system", "dark mode", "responsivo". NÃO use para artes/ilustrações (não é geração de imagem) nem para diagramas.
license: MIT
metadata:
  author: Vitor Manoel — O Novo Programador
  version: 0.2.0
---

# onp-ui-ux — a interface que se prova

Skills de UI/UX do mercado dão conselhos; nenhuma **verifica o que você
produziu**. Esta skill fecha o ciclo: direção de design intencional na entrada,
regras concretas durante a construção, e um **motor mecânico na saída** que
analisa o código e reprova via exit code. Você não declara que a interface
ficou boa — **a parte provável, a máquina prova; a parte estética, o processo
disciplina**.

```
┌──────────┐   ┌──────────┐   ┌───────────┐   ┌─────────┐   ┌──────────┐
│ ENTENDER │ → │ DIRIGIR  │ → │ CONSTRUIR │ → │ PROVAR  │ → │ REFINAR  │
└──────────┘   └──────────┘   └───────────┘   └─────────┘   └──────────┘
  o produto     tokens antes    regras do       motor,        estados +
  e o público   de codar        checklist       SEMPRE        responsivo
```

## O motor embarcado (zero instalação)

O motor mora DENTRO desta skill, em `scripts/onp_uiux.py` — resolvido
**relativo ao diretório desta SKILL.md**. Não instala nada: sem pip, sem npm,
sem navegador. Roda com o Python 3 do ambiente (3.8+):

```bash
python3 <dir-desta-skill>/scripts/onp_uiux.py validate <caminhos> [--ci] [--json]
python3 <dir-desta-skill>/scripts/onp_uiux.py score <caminhos>
python3 <dir-desta-skill>/scripts/onp_uiux.py explain <REGRA>
python3 <dir-desta-skill>/scripts/onp_uiux.py rules
```

Abaixo, `onp-ui-ux <comando>` é abreviação dessa invocação. O motor analisa
**estaticamente** HTML, CSS, JSX/TSX, Vue, Svelte e CSS-in-JS
(styled-components): contraste WCAG calculado de verdade, rótulos de
formulário, nomes acessíveis, foco visível, alvos de toque, hierarquia de
headings, reduced-motion, animação de layout, explosão de paleta, z-index,
breakpoints. Referência completa das regras: `references/motor.md`.

**Degradação graciosa** — se `python3` não existir no ambiente: percorra o
`references/checklist.md` manualmente item a item e rotule o resultado como
**`PROVA FRACA (checklist manual)`**. Nunca apresente checklist manual como se
fosse o gate mecânico.

## Contrato de execução — inegociável

1. **Tokens antes de pixels.** Nenhum CSS de componente antes de definir:
   paleta (com pares texto/fundo já aprovados em contraste), tipografia
   (máx. 2 famílias), escala de espaçamento (grade de 4px), escala de raios e
   camadas de z-index. Use `references/paletas-e-tipografia.md` como ponto de
   partida — todas as paletas de lá já passam no motor.
2. **Todo par cor-de-texto/fundo novo passa pelo motor antes de entrar no
   código.** Não "parece legível" — é ≥ 4.5:1 ou não entra (3:1 para texto
   grande).
3. **A entrega só fecha quando `onp-ui-ux validate --ci` sai com código 0.**
   Rodar o motor e **colar a saída** é o último passo, sempre. Erros: corrija
   todos. Avisos: corrija ou justifique um a um — "aviso ignorado sem
   justificativa" não existe.
4. **Estados não são opcionais.** Hover, focus-visible, disabled, loading,
   vazio e erro — todo componente interativo tem os seis pensados. Página com
   lista tem estado vazio desenhado.
5. **Responsivo é 360px primeiro.** Se só cabe em desktop, está quebrado.
   Verifique 360 / 768 / 1280 antes de entregar.
6. **Nada de genérico.** Antes de codar, declare em uma frase a assinatura
   visual da interface (o que a torna DESTA marca/produto). Se a resposta
   servir para qualquer projeto, volte ao passo DIRIGIR
   (`references/direcao-design.md`).

## Fluxo

### 1. ENTENDER (sempre — 30 segundos)

Responda por escrito, mesmo que curto: **qual produto**, **para quem**
(dispositivo dominante, contexto de uso, maturidade digital) e **qual o job
desta tela** (uma frase, um verbo). Se o usuário não disse, pergunte ou
declare a suposição explicitamente.

### 2. DIRIGIR (sempre que houver liberdade visual)

Leia `references/direcao-design.md` e produza o bloco de tokens (CSS custom
properties ou tema do framework) ANTES de qualquer componente. Paletas e
pares tipográficos prontos e pré-validados: `references/paletas-e-tipografia.md`.
Em projeto com design system existente: extraia os tokens do que já existe e
NÃO invente cores novas.

### 3. CONSTRUIR

Siga `references/checklist.md` (MUST / SHOULD / NEVER por categoria). Regras
que o motor vai cobrar depois — construa certo de primeira: todo `img` com
`alt`, todo campo com rótulo real, todo interativo com foco visível e alvo
≥ 24px (44px em mobile), `prefers-reduced-motion` para qualquer animação,
anime só `transform`/`opacity`.

### 4. PROVAR (sempre — o gate)

```bash
onp-ui-ux validate src/ --ci
```

Exit 0 → cole a saída e siga para REFINAR. Exit 1 → corrija e rode de novo.
Para relatório versionável: `--md relatorio-uiux.md`. Para pipeline:
`--json`. Modo rígido (avisos também reprovam): `--strict`. Regras podem ser
desabilitadas por projeto em `.onp-uiux.json` (`references/motor.md`).

### 5. REFINAR (o que o motor não vê)

- **Screenshot** em 360/768/1280 quando o harness permitir; critique a
  hierarquia: o olho vai primeiro para onde deveria?
- Percorra os 6 estados de cada componente interativo (contrato, item 4).
- Dark mode: se o projeto tem tema, verifique os dois; contraste vale nos dois.
- Microcopy: botões com verbo específico ("Salvar inscrição", não "Enviar"),
  erros dizem como corrigir, vazios dizem o próximo passo.

## Mapa de regras do motor

| Faixa | Categoria | Exemplos |
|-------|-----------|----------|
| A01–A14 | Acessibilidade estrutural | alt, rótulos, nomes acessíveis, lang, headings, ids, viewport |
| C01–C04 | Contraste (WCAG AA calculado) | pares texto/fundo em CSS, inline e CSS-in-JS |
| F01–F02 | Foco visível | outline removido sem substituto |
| T01–T03 | Alvos e legibilidade | alvo < 24px, fonte < 12px, line-height < 1.2 |
| M01–M05 | Motion | reduced-motion ausente, animação de layout, loop infinito |
| D01–D06 | Consistência (tokens) | paleta explodida, grade de espaçamento, raios, z-index, !important |
| R01–R02 | Responsividade | largura fixa, ausência de breakpoints |

`onp-ui-ux explain <ID>` explica qualquer regra com correção sugerida.

## Limites honestos

O motor prova o que é **estaticamente provável** — ele elimina a vergonha
mecânica (contraste ruim, campo sem rótulo, foco invisível, paleta caótica).
Ele **não mede beleza, clareza de hierarquia nem adequação ao público**: isso
é o processo (DIRIGIR + REFINAR), e continua sendo trabalho seu. Cores via
`var()` dinâmico e layout computado em runtime ficam fora do alcance estático —
declare pares críticos de contraste em tokens para o motor enxergá-los.
