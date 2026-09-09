# Paletas e tipografia — pré-validadas pelo motor

Cada paleta abaixo passou no motor (`C01`): **todo par texto/fundo listado tem
contraste ≥ 4.5:1 medido**, não estimado. Os ratios estão anotados. Use como
ponto de partida e ajuste o acento à marca — se trocar qualquer cor, rode o
par novo no motor antes de commitar (contrato, item 2).

Estrutura de tokens padrão (adapte a sintaxe ao stack):

```css
:root {
  --fundo: ...;        /* página */
  --superficie: ...;   /* cards, inputs */
  --texto: ...;        /* corpo */
  --texto-suave: ...;  /* apoio, metadados (ainda ≥ 4.5:1!) */
  --acento: ...;       /* ação primária, links */
  --sobre-acento: ...; /* texto em cima do acento */
  --borda: ...;        /* divisores (decorativo, sem exigência de 4.5) */
}
```

## 1. SaaS / Painel admin — "Aço"
Neutra, densa em dados, azul de confiança.
- fundo `#FFFFFF` · superficie `#F8FAFC` · borda `#E2E8F0`
- texto `#0F172A` (17.9:1) · texto-suave `#475569` (7.6:1)
- acento `#1D4ED8` (6.7:1 sobre fundo) · sobre-acento `#FFFFFF` (6.7:1)

## 2. Editorial / Conteúdo — "Papel"
Quente e literária; boa para blog, docs, landing de produto calmo.
- fundo `#FAF9F7` · superficie `#FFFFFF` · borda `#E7E5E4`
- texto `#1C1917` (16.6:1) · texto-suave `#57534E` (7.3:1)
- acento `#9A3412` (6.9:1) · sobre-acento `#FFFFFF` (7.3:1)

## 3. Educação / Comunidade — "Campus"
Roxo enérgico sem perder seriedade; cursos, plataformas de alunos.
- fundo `#FDFDF8` · superficie `#FFFFFF` · borda `#E4E4D8`
- texto `#1E1B4B` (15.7:1) · texto-suave `#4C4885` (8.0:1)
- acento `#6D28D9` (7.0:1) · sobre-acento `#FFFFFF` (7.1:1)

## 4. Saúde / Sustentabilidade — "Horta"
Verdes profundos, base levemente verde.
- fundo `#F7F9F4` · superficie `#FFFFFF` · borda `#DDE5D6`
- texto `#14261C` (15.0:1) · texto-suave `#3F5C4B` (7.0:1)
- acento `#166534` (6.7:1) · sobre-acento `#FFFFFF` (7.1:1)

## 5. Fintech / Dados — "Cofre"
Cinza-azulado sóbrio com ciano contido.
- fundo `#F5F6F8` · superficie `#FFFFFF` · borda `#DFE3E8`
- texto `#101418` (17.1:1) · texto-suave `#4B5563` (7.0:1)
- acento `#0E7490` (5.0:1) · sobre-acento `#FFFFFF` (5.4:1)

## 6. Food / Lifestyle — "Brasa"
Base creme, laranja queimado; apetite sem infantilizar.
- fundo `#FFF9F2` · superficie `#FFFFFF` · borda `#F3E3D3`
- texto `#27150A` (16.8:1) · texto-suave `#6E4A2A` (7.5:1)
- acento `#B45309` (4.8:1) · sobre-acento `#FFFFFF` (5.0:1)

## 7. Dark mode neutro — "Grafite"
Dark que não é preto puro; para apps de uso prolongado.
- fundo `#131316` · superficie `#1C1C21` · borda `#2E2E35`
- texto `#E7E5E4` (14.8:1) · texto-suave `#A8A29E` (7.4:1)
- acento `#7DD3FC` (11.1:1) · sobre-acento `#0C1116` (11.4:1)

## 8. Dark editorial — "Noturno"
Azul-noite com âmbar; landing pages com personalidade.
- fundo `#0B1220` · superficie `#111A2C` · borda `#1E293B`
- texto `#F1F5F9` (17.1:1) · texto-suave `#94A3B8` (7.3:1)
- acento `#FBBF24` (11.2:1) · sobre-acento `#111827` (10.6:1)

**Regras de uso** (valem para todas):
- Texto-suave é para METADADOS, não para parágrafos inteiros.
- Acento em no máximo ~10% da tela — um acento que está em tudo não acentua nada.
- Estados: derive hover/active escurecendo ou clareando o acento ~8–12%;
  valide o par resultante se houver texto em cima.
- Bordas e divisores não precisam de 4.5:1 (são decorativos), mas ícones
  informativos precisam de 3:1 (WCAG 1.4.11).

## Pares tipográficos (stacks completos, com fallback)

Máximo 2 famílias por projeto: display (títulos) + texto. Todos os stacks
abaixo degradam para fontes de sistema — a página nunca fica sem fonte.

1. **Sistema puro** (padrão, performance máxima — sem download de fonte):
   `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` para tudo;
   diferencie títulos por peso (700/800) e tracking (-0.02em).
2. **SaaS moderno**: display `"Inter", system-ui, sans-serif` (700) ·
   texto `"Inter", system-ui, sans-serif` (400/500). Uma família, dois papéis.
3. **Editorial**: display `"Fraunces", Georgia, serif` ·
   texto `"Source Serif 4", Georgia, serif`.
4. **Educação/friendly**: display `"Sora", system-ui, sans-serif` ·
   texto `"Inter", system-ui, sans-serif`.
5. **Dados/técnico**: display `"IBM Plex Sans", system-ui, sans-serif` ·
   texto `"IBM Plex Sans", system-ui, sans-serif` · números/código
   `"IBM Plex Mono", ui-monospace, monospace` (mono não conta como 3ª família
   se usado só em dados).
6. **Premium/moda**: display `"Cormorant Garamond", Georgia, serif` (600) ·
   texto `"Jost", "Futura", system-ui, sans-serif`.

**Escala tipográfica** (1.25 — terça maior; base 16px):
`12.8 / 16 / 20 / 25 / 31.25 / 39 / 48.8` → arredonde:
`13 / 16 / 20 / 25 / 31 / 39 / 49`. Corpo nunca abaixo de 16px em mobile;
`line-height` 1.5–1.7 no corpo, 1.1–1.25 em display. Largura de linha
45–75 caracteres (`max-width: 65ch`).

**Escalas complementares**:
- Espaçamento (grade 4px): `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96`.
- Raios: 3 valores no projeto — ex.: `6px` (controles), `12px` (cards),
  `999px` (pills). Nada além disso.
- Z-index: `10` (dropdown) / `20` (sticky) / `30` (overlay) / `40` (modal) /
  `50` (toast). Nunca 999+.
- Sombras: 2 níveis bastam — `0 1px 3px rgb(0 0 0 / 0.08)` (repouso) e
  `0 8px 24px rgb(0 0 0 / 0.12)` (elevado). No dark mode, troque sombra por
  borda + superfície mais clara.
