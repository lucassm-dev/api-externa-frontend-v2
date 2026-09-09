# Motor onp-ui-ux — referência completa

Analisador estático em Python puro (stdlib, 3.8+). Sem navegador, sem
dependências, sem rede. Analisa `.html` `.htm` `.css` `.jsx` `.tsx` `.vue`
`.svelte` e `.js`/`.ts` que contenham JSX ou styled-components. Ignora
`node_modules`, `dist`, `build`, `.next`, arquivos `.min.*` e diretórios
ocultos.

## Comandos

```bash
onp-ui-ux validate <caminhos...>   # relatório legível (padrão)
  --ci          # exit 1 se houver ERROS (gate de pipeline)
  --strict      # com --ci, AVISOS também reprovam
  --json        # relatório estruturado completo
  --md ARQ      # grava relatório em markdown (tabela)
  --max N       # limita achados exibidos no modo legível (padrão 200)
  --no-color

onp-ui-ux score <caminhos...> [--json]   # placar 0–100 por categoria
onp-ui-ux explain <REGRA>                # detalhe + correção de uma regra
onp-ui-ux rules                          # catálogo completo
```

Exit codes: `0` aprovado · `1` reprovado (`--ci`) · `2` uso incorreto.

## Catálogo de regras

### Acessibilidade estrutural (HTML, JSX, Vue, Svelte)
| ID | Sev | Verifica |
|----|-----|----------|
| A01 | erro | `img` sem `alt` (atributo dinâmico `:alt`/`alt={x}` conta como presente) |
| A02 | erro | input/textarea/select sem rótulo (`label for`, wrap, aria-label); placeholder não conta |
| A03 | erro | botão/link sem nome acessível (texto, aria-label, alt de filho, title de svg) |
| A04 | erro | `<html>` sem `lang` |
| A05 | aviso | `tabindex` positivo |
| A06 | aviso | clique em div/span/etc sem role + teclado |
| A07 | aviso | iframe sem `title` |
| A08 | erro | `user-scalable=no` / `maximum-scale<2` |
| A09 | aviso | página completa sem meta viewport |
| A10 | aviso | pulo de heading (h1→h3) ou h1 duplicado |
| A11 | aviso | página completa sem `<main>` |
| A12 | dica | `autofocus` |
| A13 | aviso | `<a href="#">` usado como botão |
| A14 | erro | id duplicado |

### Contraste — calculado (CSS, style inline, styled-components)
| ID | Sev | Verifica |
|----|-----|----------|
| C01 | erro | par color/background na mesma regra < 4.5:1 (3:1 se texto grande: ≥24px, ou ≥18.66px bold) — resolve hex/rgb/hsl/nomes, compõe alpha do texto sobre o fundo |
| C04 | erro | color idêntico ao background (texto invisível) |

Limitações honestas: pares via `var()` não são resolvidos (declare os pares
críticos em regra explícita ou confie no tema pré-validado); fundo com alpha
< 1 ou gradiente não é julgado.

### Foco
| ID | Sev | Verifica |
|----|-----|----------|
| F01 | erro | `outline: none/0` sem NENHUM estilo de foco substituto no projeto |
| F02 | erro | seletor `:focus` que remove outline, sem substituto |

Se o projeto tem `:focus-visible`/`:focus` com outline ou box-shadow, o reset
de outline é aceito silenciosamente (padrão moderno).

### Alvos e legibilidade (CSS)
| ID | Sev | Verifica |
|----|-----|----------|
| T01 | aviso | width/height/min-* < 24px em seletor interativo (button, a, input, .btn, [role=button]…) |
| T02 | aviso | font-size < 12px (px/pt/rem/em) |
| T03 | aviso | line-height numérico < 1.2 |

### Motion
| ID | Sev | Verifica |
|----|-----|----------|
| M01 | aviso | projeto tem animação/transição e NENHUM `prefers-reduced-motion` |
| M02 | aviso | transition/keyframes animando propriedade de layout (width, height, top, left, margin…) |
| M03 | dica | transição > 700ms em seletor interativo |
| M04 | aviso | `animation: … infinite` sem guarda de reduced-motion |
| M05 | dica | `transition: all` |

### Consistência / design tokens (agregado do projeto)
| ID | Sev | Verifica |
|----|-----|----------|
| D01 | aviso | > 24 cores hardcoded únicas (cores em `var()`/custom properties não contam — tokens são o objetivo) |
| D02 | dica | > 40% dos espaçamentos px fora da grade de 4px (mín. 24 amostras) |
| D03 | dica | > 6 valores distintos de border-radius |
| D04 | aviso | > 3 famílias tipográficas declaradas |
| D05 | aviso | z-index ≥ 999 |
| D06 | dica | ≥ 10 `!important` |

### Responsividade
| ID | Sev | Verifica |
|----|-----|----------|
| R01 | dica | width fixa > 480px fora de media query sem max-width na regra |
| R02 | aviso | > 150 declarações CSS e nenhuma media/container query |

## Configuração por projeto — `.onp-uiux.json`

Na raiz analisada (ou no cwd):

```json
{
  "disable": ["D02", "A12"],
  "ignore": ["src/legado/**", "**/*.stories.tsx"],
  "max_colors": 32
}
```

## Score

`score` agrega achados em 4 categorias com pesos (erro 10, aviso 3, dica 1):
a11y 45% · responsivo 20% · consistência 20% · motion 15%. Use como métrica
de evolução do projeto, não como troféu — o gate real é `validate --ci`.

## Integração CI (GitHub Actions)

```yaml
- name: UI/UX gate
  run: |
    python3 caminho/para/onp_uiux.py validate src/ --ci --md relatorio-uiux.md
- uses: actions/upload-artifact@v4
  if: always()
  with: { name: relatorio-uiux, path: relatorio-uiux.md }
```

Via npm (o pacote instala o comando `onp-ui-ux` e embute o mesmo motor):

```bash
npx @onovoprogramador/onp-ui-ux validate src/ --ci
```
