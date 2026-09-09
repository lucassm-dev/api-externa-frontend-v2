#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
onp-ui-ux — motor de validação UI/UX universal.

Análise ESTÁTICA de HTML, CSS, JSX/TSX, Vue e Svelte:
sem navegador, sem node_modules, sem dependências — Python stdlib puro (3.8+).

A filosofia é a mesma do onp-spec: você não declara que a UI está boa —
a máquina prova o que é provável mecanicamente, via exit code.

Uso:
  python3 onp_uiux.py validate <caminhos...> [--json] [--md ARQ] [--ci] [--strict]
  python3 onp_uiux.py score <caminhos...>
  python3 onp_uiux.py explain <REGRA>
  python3 onp_uiux.py rules
"""

import argparse
import bisect
import fnmatch
import json
import os
import re
import sys
import time
from html.parser import HTMLParser

VERSION = "0.2.0"

# ---------------------------------------------------------------------------
# Registro de regras
# ---------------------------------------------------------------------------
# id: (severidade, categoria, título, referência, correção)
ERROR, WARN, INFO = "erro", "aviso", "dica"

RULES = {
    # Acessibilidade — estrutura HTML/JSX
    "A01": (ERROR, "a11y", "<img> sem atributo alt", "WCAG 1.1.1",
            'Adicione alt descritivo, ou alt="" se a imagem for decorativa.'),
    "A02": (ERROR, "a11y", "Campo de formulário sem rótulo acessível", "WCAG 3.3.2 / 4.1.2",
            "Associe um <label for>, envolva com <label> ou use aria-label. Placeholder NÃO é rótulo."),
    "A03": (ERROR, "a11y", "Botão ou link sem nome acessível", "WCAG 4.1.2",
            "Inclua texto visível ou aria-label. Ícone sozinho não tem nome."),
    "A04": (ERROR, "a11y", "<html> sem atributo lang", "WCAG 3.1.1",
            'Declare o idioma: <html lang="pt-BR">.'),
    "A05": (WARN, "a11y", "tabindex positivo quebra a ordem natural de foco", "WCAG 2.4.3",
            "Use tabindex=\"0\" (entra na ordem do DOM) ou reordene o markup."),
    "A06": (WARN, "a11y", "Clique em elemento não interativo sem teclado", "WCAG 2.1.1",
            "Prefira <button>. Se precisar de div, adicione role, tabindex=\"0\" e handler de teclado."),
    "A07": (WARN, "a11y", "<iframe> sem title", "WCAG 4.1.2",
            "Adicione title descrevendo o conteúdo do iframe."),
    "A08": (ERROR, "responsivo", "Zoom do usuário bloqueado no viewport", "WCAG 1.4.4",
            "Remova user-scalable=no e maximum-scale<2 da meta viewport."),
    "A09": (WARN, "responsivo", "Página sem meta viewport", "Mobile",
            'Adicione <meta name="viewport" content="width=device-width, initial-scale=1">.'),
    "A10": (WARN, "a11y", "Hierarquia de headings incorreta", "WCAG 1.3.1",
            "Não pule níveis (h1→h3) e use apenas um h1 por página."),
    "A11": (WARN, "a11y", "Página sem landmark <main>", "WCAG 1.3.1",
            "Envolva o conteúdo principal em <main> — leitores de tela navegam por landmarks."),
    "A12": (INFO, "a11y", "autofocus pode desorientar usuários de leitor de tela", "WCAG 3.2.1",
            "Confirme que o foco automático é essencial (ex.: campo de busca em página de busca)."),
    "A13": (WARN, "a11y", 'Link com href="#" ou javascript: usado como botão', "WCAG 4.1.2",
            "Ação sem navegação é <button>, não <a>."),
    "A14": (ERROR, "a11y", "id duplicado no documento", "WCAG 4.1.1",
            "ids precisam ser únicos — quebram label[for], aria-labelledby e âncoras."),
    # Contraste
    "C01": (ERROR, "a11y", "Contraste de texto insuficiente", "WCAG 1.4.3 (AA)",
            "Texto normal exige 4.5:1; texto grande (24px+ ou 18.66px+ bold), 3:1."),
    "C04": (ERROR, "a11y", "color igual ao background-color", "WCAG 1.4.3",
            "Texto invisível: cor do texto e do fundo são a mesma."),
    # Foco
    "F01": (ERROR, "a11y", "outline removido sem substituto de foco visível", "WCAG 2.4.7",
            "Se remover outline, forneça indicador em :focus-visible (outline ou box-shadow)."),
    "F02": (ERROR, "a11y", "Estilo :focus remove o indicador sem substituto", "WCAG 2.4.7",
            "Estilize :focus-visible com outline ou box-shadow em vez de apenas remover."),
    # Alvos e tipografia
    "T01": (WARN, "a11y", "Alvo de toque menor que 24px", "WCAG 2.5.8 (AA)",
            "Alvos interativos: mínimo 24×24px (ideal 44×44px em mobile)."),
    "T02": (WARN, "a11y", "font-size menor que 12px", "Legibilidade",
            "Texto abaixo de 12px é ilegível para grande parte dos usuários."),
    "T03": (WARN, "a11y", "line-height menor que 1.2", "WCAG 1.4.12",
            "Corpo de texto pede line-height ≥ 1.4; abaixo de 1.2 compromete leitura."),
    # Motion
    "M01": (WARN, "motion", "Animações sem suporte a prefers-reduced-motion", "WCAG 2.3.3",
            "Adicione @media (prefers-reduced-motion: reduce) desativando/reduzindo animações."),
    "M02": (WARN, "motion", "Animação de propriedade de layout (causa reflow)", "Performance",
            "Anime transform e opacity — width/height/top/left disparam layout a cada frame."),
    "M03": (INFO, "motion", "Transição muito longa para interação", "UX",
            "Feedback de interação pede 100–300ms; acima de 700ms parece travado."),
    "M04": (WARN, "motion", "Animação infinita sem guarda de reduced-motion", "WCAG 2.3.3",
            "Loop infinito é o pior caso para sensibilidade a movimento — proteja com a media query."),
    "M05": (INFO, "motion", "transition: all é imprevisível e custoso", "Performance",
            "Liste as propriedades explicitamente (ex.: transition: transform .2s, opacity .2s)."),
    # Consistência / design tokens
    "D01": (WARN, "consistencia", "Paleta explodida: cores hardcoded demais", "Design tokens",
            "Centralize em custom properties (--cor-*). Paletas profissionais têm 8–16 cores."),
    "D02": (INFO, "consistencia", "Espaçamentos fora de grade consistente", "Design tokens",
            "Adote uma escala (4/8px ou tokens) — espaçamento arbitrário quebra o ritmo visual."),
    "D03": (INFO, "consistencia", "Muitos border-radius diferentes", "Design tokens",
            "2–3 raios bastam (ex.: 4px controles, 8-12px cards, 999px pills)."),
    "D04": (WARN, "consistencia", "Famílias tipográficas demais", "Tipografia",
            "1–2 famílias (display + texto). Mais que 3 fragmenta a identidade."),
    "D05": (WARN, "consistencia", "Guerra de z-index (999+, 9999+…)", "Manutenção",
            "Defina uma escala de camadas (ex.: 10/20/30/40) em tokens."),
    "D06": (INFO, "consistencia", "Uso excessivo de !important", "Manutenção",
            "!important em série indica guerra de especificidade — reestruture os seletores."),
    # Responsividade
    "R01": (INFO, "responsivo", "Largura fixa grande sem max-width", "Mobile",
            "width fixa acima de 480px estoura em telas pequenas — use max-width: 100%."),
    "R02": (WARN, "responsivo", "CSS extenso sem nenhuma media/container query", "Mobile",
            "Nenhum breakpoint encontrado — a página quase certamente quebra em mobile."),
}

CATEGORIES = ("a11y", "consistencia", "motion", "responsivo")
SEV_ORDER = {ERROR: 0, WARN: 1, INFO: 2}

IGNORE_DIRS = {"node_modules", ".git", "dist", "build", "out", ".next", ".nuxt",
               ".svelte-kit", "coverage", "vendor", ".cache", "__pycache__",
               ".output", "storybook-static", ".vercel", ".turbo"}
EXTS = {".html", ".htm", ".css", ".jsx", ".tsx", ".vue", ".svelte", ".js", ".ts"}
MAX_FILE_BYTES = 2_000_000


class Finding(object):
    __slots__ = ("rule", "file", "line", "detail", "snippet")

    def __init__(self, rule, file, line, detail="", snippet=""):
        self.rule = rule
        self.file = file
        self.line = line
        self.detail = detail
        self.snippet = snippet

    @property
    def severity(self):
        return RULES[self.rule][0]

    @property
    def category(self):
        return RULES[self.rule][1]


# ---------------------------------------------------------------------------
# Cores e contraste (WCAG 2.x)
# ---------------------------------------------------------------------------

NAMED_COLORS = {
    "aliceblue": "f0f8ff", "antiquewhite": "faebd7", "aqua": "00ffff", "aquamarine": "7fffd4",
    "azure": "f0ffff", "beige": "f5f5dc", "bisque": "ffe4c4", "black": "000000",
    "blanchedalmond": "ffebcd", "blue": "0000ff", "blueviolet": "8a2be2", "brown": "a52a2a",
    "burlywood": "deb887", "cadetblue": "5f9ea0", "chartreuse": "7fff00", "chocolate": "d2691e",
    "coral": "ff7f50", "cornflowerblue": "6495ed", "cornsilk": "fff8dc", "crimson": "dc143c",
    "cyan": "00ffff", "darkblue": "00008b", "darkcyan": "008b8b", "darkgoldenrod": "b8860b",
    "darkgray": "a9a9a9", "darkgreen": "006400", "darkgrey": "a9a9a9", "darkkhaki": "bdb76b",
    "darkmagenta": "8b008b", "darkolivegreen": "556b2f", "darkorange": "ff8c00",
    "darkorchid": "9932cc", "darkred": "8b0000", "darksalmon": "e9967a",
    "darkseagreen": "8fbc8f", "darkslateblue": "483d8b", "darkslategray": "2f4f4f",
    "darkslategrey": "2f4f4f", "darkturquoise": "00ced1", "darkviolet": "9400d3",
    "deeppink": "ff1493", "deepskyblue": "00bfff", "dimgray": "696969", "dimgrey": "696969",
    "dodgerblue": "1e90ff", "firebrick": "b22222", "floralwhite": "fffaf0",
    "forestgreen": "228b22", "fuchsia": "ff00ff", "gainsboro": "dcdcdc", "ghostwhite": "f8f8ff",
    "gold": "ffd700", "goldenrod": "daa520", "gray": "808080", "green": "008000",
    "greenyellow": "adff2f", "grey": "808080", "honeydew": "f0fff0", "hotpink": "ff69b4",
    "indianred": "cd5c5c", "indigo": "4b0082", "ivory": "fffff0", "khaki": "f0e68c",
    "lavender": "e6e6fa", "lavenderblush": "fff0f5", "lawngreen": "7cfc00",
    "lemonchiffon": "fffacd", "lightblue": "add8e6", "lightcoral": "f08080",
    "lightcyan": "e0ffff", "lightgoldenrodyellow": "fafad2", "lightgray": "d3d3d3",
    "lightgreen": "90ee90", "lightgrey": "d3d3d3", "lightpink": "ffb6c1",
    "lightsalmon": "ffa07a", "lightseagreen": "20b2aa", "lightskyblue": "87cefa",
    "lightslategray": "778899", "lightslategrey": "778899", "lightsteelblue": "b0c4de",
    "lightyellow": "ffffe0", "lime": "00ff00", "limegreen": "32cd32", "linen": "faf0e6",
    "magenta": "ff00ff", "maroon": "800000", "mediumaquamarine": "66cdaa",
    "mediumblue": "0000cd", "mediumorchid": "ba55d3", "mediumpurple": "9370db",
    "mediumseagreen": "3cb371", "mediumslateblue": "7b68ee", "mediumspringgreen": "00fa9a",
    "mediumturquoise": "48d1cc", "mediumvioletred": "c71585", "midnightblue": "191970",
    "mintcream": "f5fffa", "mistyrose": "ffe4e1", "moccasin": "ffe4b5", "navajowhite": "ffdead",
    "navy": "000080", "oldlace": "fdf5e6", "olive": "808000", "olivedrab": "6b8e23",
    "orange": "ffa500", "orangered": "ff4500", "orchid": "da70d6", "palegoldenrod": "eee8aa",
    "palegreen": "98fb98", "paleturquoise": "afeeee", "palevioletred": "db7093",
    "papayawhip": "ffefd5", "peachpuff": "ffdab9", "peru": "cd853f", "pink": "ffc0cb",
    "plum": "dda0dd", "powderblue": "b0e0e6", "purple": "800080", "rebeccapurple": "663399",
    "red": "ff0000", "rosybrown": "bc8f8f", "royalblue": "4169e1", "saddlebrown": "8b4513",
    "salmon": "fa8072", "sandybrown": "f4a460", "seagreen": "2e8b57", "seashell": "fff5ee",
    "sienna": "a0522d", "silver": "c0c0c0", "skyblue": "87ceeb", "slateblue": "6a5acd",
    "slategray": "708090", "slategrey": "708090", "snow": "fffafa", "springgreen": "00ff7f",
    "steelblue": "4682b4", "tan": "d2b48c", "teal": "008080", "thistle": "d8bfd8",
    "tomato": "ff6347", "turquoise": "40e0d0", "violet": "ee82ee", "wheat": "f5deb3",
    "white": "ffffff", "whitesmoke": "f5f5f5", "yellow": "ffff00", "yellowgreen": "9acd32",
}

RE_HEX = re.compile(r"#([0-9a-fA-F]{3,8})\b")
RE_FUNC = re.compile(r"(rgba?|hsla?)\(([^)]*)\)", re.I)
RE_NAMED = re.compile(r"\b(" + "|".join(NAMED_COLORS) + r")\b", re.I)


def _clamp(v, lo, hi):
    return max(lo, min(hi, v))


def _parse_num(tok, scale=255.0):
    tok = tok.strip()
    try:
        if tok.endswith("%"):
            return _clamp(float(tok[:-1]) / 100.0 * scale, 0.0, scale)
        return _clamp(float(tok), 0.0, scale)
    except ValueError:
        return None


def _hsl_to_rgb(h, s, l):
    h = (h % 360.0) / 360.0
    if s == 0:
        v = l * 255.0
        return (v, v, v)

    def hue(p, q, t):
        if t < 0:
            t += 1
        if t > 1:
            t -= 1
        if t < 1 / 6.0:
            return p + (q - p) * 6 * t
        if t < 1 / 2.0:
            return q
        if t < 2 / 3.0:
            return p + (q - p) * (2 / 3.0 - t) * 6
        return p

    q = l * (1 + s) if l < 0.5 else l + s - l * s
    p = 2 * l - q
    return (hue(p, q, h + 1 / 3.0) * 255, hue(p, q, h) * 255, hue(p, q, h - 1 / 3.0) * 255)


def parse_color(value):
    """Devolve (r, g, b, a) em 0–255 / 0–1, ou None se não for cor resolvível."""
    if value is None:
        return None
    v = value.strip().lower()
    if not v or "var(" in v or "gradient(" in v or v in ("transparent", "currentcolor",
                                                         "inherit", "initial", "unset", "none"):
        return None
    m = RE_HEX.match(v) if v.startswith("#") else None
    if m:
        h = m.group(1)
        if len(h) in (3, 4):
            h = "".join(c * 2 for c in h)
        if len(h) == 6:
            h += "ff"
        if len(h) != 8:
            return None
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(h[6:8], 16) / 255.0)
    m = RE_FUNC.match(v)
    if m:
        fn = m.group(1).lower()
        parts = re.split(r"[,\s/]+", m.group(2).strip())
        parts = [p for p in parts if p]
        if len(parts) < 3:
            return None
        if fn.startswith("rgb"):
            r = _parse_num(parts[0])
            g = _parse_num(parts[1])
            b = _parse_num(parts[2])
            if r is None or g is None or b is None:
                return None
            a = _parse_num(parts[3], 1.0) if len(parts) > 3 else 1.0
            return (r, g, b, a if a is not None else 1.0)
        try:
            h = float(re.sub(r"deg$", "", parts[0]))
        except ValueError:
            return None
        s = _parse_num(parts[1], 1.0)
        l = _parse_num(parts[2], 1.0)
        if s is None or l is None:
            return None
        r, g, b = _hsl_to_rgb(h, s, l)
        a = _parse_num(parts[3], 1.0) if len(parts) > 3 else 1.0
        return (r, g, b, a if a is not None else 1.0)
    if v in NAMED_COLORS:
        h = NAMED_COLORS[v]
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 1.0)
    return None


def _luminance(rgb):
    def chan(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def contrast_ratio(fg, bg):
    """fg/bg = (r,g,b,a). Compõe alpha do texto sobre o fundo. Fundo translúcido → None."""
    if bg[3] < 0.999:
        return None
    if fg[3] < 0.999:
        a = fg[3]
        fg = tuple(fg[i] * a + bg[i] * (1 - a) for i in range(3)) + (1.0,)
    l1 = _luminance(fg[:3])
    l2 = _luminance(bg[:3])
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def first_color(value):
    """Primeira cor resolvível num valor CSS (ex.: shorthand background)."""
    if value is None:
        return None
    v = value.strip()
    if "gradient(" in v.lower() or "var(" in v.lower():
        return None
    for regex in (RE_HEX, RE_FUNC, RE_NAMED):
        m = regex.search(v)
        if m:
            return parse_color(m.group(0))
    return None


# ---------------------------------------------------------------------------
# Parser CSS (tolerante: CSS puro + aninhamento SCSS básico)
# ---------------------------------------------------------------------------

class Rule(object):
    __slots__ = ("selector", "decls", "line", "ctx")

    def __init__(self, selector, line, ctx):
        self.selector = selector
        self.decls = []          # (prop, value, line, important)
        self.line = line
        self.ctx = ctx           # lista de preludes de at-rules envolventes


def _blank_comments(text):
    out = []
    i, n = 0, len(text)
    while i < n:
        j = text.find("/*", i)
        if j < 0:
            out.append(text[i:])
            break
        out.append(text[i:j])
        k = text.find("*/", j + 2)
        if k < 0:
            k = n
            seg = text[j:]
        else:
            seg = text[j:k + 2]
            k += 2
        out.append("".join(c if c == "\n" else " " for c in seg))
        i = k
    return "".join(out)


def parse_css(text, base_line=1):
    text = _blank_comments(text)
    newlines = [m.start() for m in re.finditer("\n", text)]

    def line_of(idx):
        return base_line + bisect.bisect_left(newlines, idx)

    rules = []
    n = len(text)

    def skip_string(i):
        q = text[i]
        i += 1
        while i < n:
            if text[i] == "\\":
                i += 2
                continue
            if text[i] == q:
                return i + 1
            i += 1
        return i

    def read_until(i, stops):
        depth = 0
        while i < n:
            c = text[i]
            if c in "'\"":
                i = skip_string(i)
                continue
            if c == "(":
                depth += 1
            elif c == ")":
                depth = max(0, depth - 1)
            elif depth == 0 and c in stops:
                return i
            i += 1
        return i

    def skip_block(i):
        depth = 1
        while i < n and depth:
            c = text[i]
            if c in "'\"":
                i = skip_string(i)
                continue
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            i += 1
        return i

    def parse_decls_or_nested(i, selector, ctx, rule):
        while i < n:
            while i < n and text[i] in " \t\r\n;":
                i += 1
            if i >= n or text[i] == "}":
                return i + 1 if i < n else i
            start = i
            j = read_until(i, "{;}")
            seg = text[start:j].strip()
            if j < n and text[j] == "{":
                nested_sel = (selector + " " + seg).strip() if not seg.startswith("@") else seg
                nested_ctx = ctx + [seg] if seg.startswith("@") else ctx
                sub = Rule(nested_sel if not seg.startswith("@") else selector,
                           line_of(start), nested_ctx)
                rules.append(sub)
                i = parse_decls_or_nested(j + 1, sub.selector, nested_ctx, sub)
                continue
            if seg and ":" in seg:
                prop, _, val = seg.partition(":")
                prop = prop.strip().lower()
                val = val.strip()
                if prop and val and re.match(r"^[-a-z_][-a-z0-9_]*$", prop):
                    important = "!important" in val.lower()
                    val = re.sub(r"\s*!\s*important\s*$", "", val, flags=re.I)
                    rule.decls.append((prop, val, line_of(start), important))
            i = j + 1 if (j < n and text[j] in ";") else j
            if j < n and text[j] == "}":
                return j + 1

        return i

    def scan_block(i, ctx):
        while i < n:
            while i < n and text[i] in " \t\r\n":
                i += 1
            if i >= n:
                return i
            if text[i] == "}":
                return i + 1
            start = i
            j = read_until(i, "{;}")
            header = text[start:j].strip()
            if j >= n:
                return j
            if text[j] == ";":
                i = j + 1
                continue
            if text[j] == "}":
                return j + 1
            if header.startswith("@"):
                at = header.split("(")[0].split()[0].lower()
                if at == "@font-face":
                    i = skip_block(j + 1)
                else:
                    i = scan_block(j + 1, ctx + [header])
                continue
            rule = Rule(header, line_of(start), ctx)
            rules.append(rule)
            i = parse_decls_or_nested(j + 1, header, ctx, rule)
        return i

    scan_block(0, [])
    return rules


# ---------------------------------------------------------------------------
# Utilidades CSS compartilhadas
# ---------------------------------------------------------------------------

LAYOUT_PROPS = {"width", "height", "top", "left", "right", "bottom", "margin",
                "margin-top", "margin-left", "margin-right", "margin-bottom",
                "padding", "padding-top", "padding-left", "padding-right",
                "padding-bottom", "inset", "flex-basis", "min-height", "min-width",
                "max-height", "max-width", "font-size"}

COLOR_PROPS = {"color", "background", "background-color", "border-color", "fill",
               "stroke", "outline-color", "caret-color", "text-decoration-color",
               "border", "border-top", "border-right", "border-bottom", "border-left",
               "box-shadow", "text-shadow", "accent-color"}

INTERACTIVE_SEL = re.compile(
    r"(?:^|[\s,>+~])(?:button|a\b|a[.:#\[]|input|select|summary|\[role=[\"']?(?:button|link|tab)"
    r"|\.(?:btn|button|icon-btn|icon-button|chip|tab|close|toggle|fab)\b)", re.I)

TIME_RE = re.compile(r"(\d*\.?\d+)(ms|s)\b", re.I)
EASING_WORDS = {"ease", "ease-in", "ease-out", "ease-in-out", "linear", "step-start",
                "step-end", "infinite", "normal", "reverse", "alternate", "both",
                "forwards", "backwards", "running", "paused"}


def px_of(value):
    """Converte comprimento simples em px (px/pt/rem/em); None se não der."""
    if value is None:
        return None
    m = re.match(r"^(-?\d*\.?\d+)(px|pt|rem|em|%)?$", value.strip().lower())
    if not m:
        return None
    num = float(m.group(1))
    unit = m.group(2) or "px"
    if unit == "px":
        return num
    if unit == "pt":
        return num * 96.0 / 72.0
    if unit in ("rem", "em"):
        return num * 16.0
    return None  # % depende do contexto


def duration_ms(value):
    total = None
    for m in TIME_RE.finditer(value):
        ms = float(m.group(1)) * (1000.0 if m.group(2).lower() == "s" else 1.0)
        total = ms if total is None else max(total, ms)
    return total


def in_reduced_motion(ctx):
    return any("prefers-reduced-motion" in c for c in ctx)


def rule_font_px(decl_map):
    fs = px_of(decl_map.get("font-size", ""))
    return fs


def is_large_text(decl_map):
    fs = rule_font_px(decl_map)
    if fs is None:
        return False
    if fs >= 24.0:
        return True
    weight = decl_map.get("font-weight", "").strip().lower()
    bold = weight in ("bold", "bolder") or (weight.isdigit() and int(weight) >= 700)
    return fs >= 18.66 and bold


# ---------------------------------------------------------------------------
# Estado agregado do projeto
# ---------------------------------------------------------------------------

class Project(object):
    def __init__(self):
        self.findings = []
        self.files = 0
        self.css_decl_count = 0
        self.has_media_query = False
        self.has_reduced_motion = False
        self.has_motion = False
        self.motion_example = None            # (file, line)
        self.has_focus_replacement = False
        self.outline_none = []                # (file, line, selector, is_focus_sel)
        self.colors = {}                      # literal -> (file, line) primeiro uso
        self.radii = set()
        self.font_families = set()
        self.spacings = []                    # valores px de margin/padding
        self.zindexes = []                    # (valor, file, line)
        self.important_count = 0
        self.infinite_anims = []              # (file, line)

    def add(self, rule, file, line, detail="", snippet=""):
        self.findings.append(Finding(rule, file, line, detail, snippet))


# ---------------------------------------------------------------------------
# Checagens CSS
# ---------------------------------------------------------------------------

def check_css_rules(rules, file, proj, lines):
    def snippet(line):
        if 1 <= line <= len(lines):
            return lines[line - 1].strip()[:100]
        return ""

    for rule in rules:
        if not rule.decls:
            continue
        in_keyframes = any("keyframes" in c for c in rule.ctx)
        reduced = in_reduced_motion(rule.ctx)
        if any(c.lstrip().lower().startswith("@media") or
               c.lstrip().lower().startswith("@container") for c in rule.ctx):
            proj.has_media_query = True
        if reduced:
            proj.has_reduced_motion = True

        decl_map = {}
        for prop, val, line, important in rule.decls:
            if not prop.startswith("--"):
                decl_map.setdefault(prop, val)
        t01_emitted = False
        if not hasattr(proj, "_m02_seen"):
            proj._m02_seen = set()

        sel = rule.selector.lower()
        is_focus_sel = ":focus" in sel and ":focus-within" not in sel
        is_focus_visible = ":focus-visible" in sel

        for prop, val, line, important in rule.decls:
            proj.css_decl_count += 1
            if important:
                proj.important_count += 1
            if prop.startswith("--"):
                continue
            vlow = val.lower()

            # cores para paleta (D01)
            if prop in COLOR_PROPS and "var(" not in vlow:
                for m in RE_HEX.finditer(val):
                    proj.colors.setdefault("#" + m.group(1).lower(), (file, line))
                for m in RE_FUNC.finditer(val):
                    proj.colors.setdefault(m.group(0).lower().replace(" ", ""), (file, line))

            # foco
            if prop == "outline" and re.match(r"^(none|0)(\s|$)", vlow):
                proj.outline_none.append((file, line, rule.selector, is_focus_sel))
            elif prop == "outline-style" and vlow.strip() == "none":
                proj.outline_none.append((file, line, rule.selector, is_focus_sel))
            if (is_focus_sel or is_focus_visible) and prop in ("outline", "box-shadow",
                                                              "outline-color", "outline-width",
                                                              "border", "border-color"):
                if not re.match(r"^(none|0)(\s|$)", vlow):
                    proj.has_focus_replacement = True

            # tipografia
            if prop == "font-size":
                fs = px_of(val)
                if fs is not None and 0 < fs < 12.0:
                    proj.add("T02", file, line, "font-size %s" % val, snippet(line))
            if prop == "line-height":
                m = re.match(r"^(\d*\.?\d+)$", vlow.strip())
                if m and float(m.group(1)) < 1.2 and float(m.group(1)) > 0:
                    proj.add("T03", file, line, "line-height %s" % val, snippet(line))
            if prop == "font-family" and "var(" not in vlow:
                fam = vlow.split(",")[0].strip().strip("'\"")
                if fam and fam not in ("inherit", "initial", "unset", "monospace",
                                       "sans-serif", "serif", "system-ui"):
                    proj.font_families.add(fam)

            # alvos de toque
            if prop in ("width", "height", "min-width", "min-height") and \
                    not t01_emitted and INTERACTIVE_SEL.search(rule.selector):
                pxv = px_of(val)
                if pxv is not None and 0 < pxv < 24.0:
                    t01_emitted = True
                    proj.add("T01", file, line,
                             "%s: %s em seletor interativo (%s)" % (prop, val,
                                                                    rule.selector[:60]),
                             snippet(line))

            # motion
            if prop in ("transition", "transition-property"):
                proj.has_motion = True
                proj.motion_example = proj.motion_example or (file, line)
                props_txt = re.split(r",", val)
                seen_layout = set()
                for part in props_txt:
                    ident = re.match(r"\s*([a-z-]+)", part.strip().lower())
                    if not ident:
                        continue
                    name = ident.group(1)
                    if name in EASING_WORDS or TIME_RE.match(part.strip()):
                        continue
                    if name == "all":
                        proj.add("M05", file, line, "transition: all", snippet(line))
                    elif name in LAYOUT_PROPS and name not in seen_layout:
                        seen_layout.add(name)
                        proj.add("M02", file, line,
                                 "transition anima '%s'" % name, snippet(line))
                dur = duration_ms(val)
                if dur is not None and dur > 700 and INTERACTIVE_SEL.search(rule.selector):
                    proj.add("M03", file, line, "duração %dms" % dur, snippet(line))
            if prop.startswith("animation"):
                proj.has_motion = True
                proj.motion_example = proj.motion_example or (file, line)
                if "infinite" in vlow and not reduced:
                    proj.infinite_anims.append((file, line))
            if in_keyframes and prop in LAYOUT_PROPS and prop not in ("max-width",
                                                                     "max-height"):
                kf = next((c for c in rule.ctx if "keyframes" in c), "@keyframes")
                key = (file, kf, prop)
                if key not in proj._m02_seen:
                    proj._m02_seen.add(key)
                    proj.add("M02", file, line,
                             "@keyframes anima '%s'" % prop, snippet(line))

            # consistência
            if prop == "border-radius" and "var(" not in vlow:
                for tok in re.findall(r"\d*\.?\d+(?:px|rem|em|%)", vlow):
                    self_px = px_of(tok)
                    if self_px is not None and self_px < 500:
                        proj.radii.add(round(self_px, 1))
            if prop.startswith(("margin", "padding")) and "var(" not in vlow and \
                    not in_keyframes:
                for tok in re.findall(r"-?\d*\.?\d+px", vlow):
                    pxv = px_of(tok)
                    if pxv is not None and pxv != 0:
                        proj.spacings.append(abs(pxv))
            if prop == "z-index":
                m = re.match(r"^-?\d+$", vlow.strip())
                if m:
                    proj.zindexes.append((int(vlow), file, line))

            # responsivo
            if prop == "width" and not rule.ctx and "max-width" not in decl_map:
                pxv = px_of(val)
                if pxv is not None and pxv > 480:
                    proj.add("R01", file, line,
                             "width: %s (%s)" % (val, rule.selector[:60]), snippet(line))

        # contraste na regra
        fg_raw = decl_map.get("color")
        bg_raw = decl_map.get("background-color") or decl_map.get("background")
        if fg_raw and bg_raw:
            fg = parse_color(fg_raw)
            bg = first_color(bg_raw) if "background-color" not in decl_map \
                else parse_color(bg_raw)
            if fg and bg:
                line = next((l for p, v, l, _ in rule.decls if p == "color"), rule.line)
                if fg[:3] == bg[:3] and bg[3] > 0.999:
                    proj.add("C04", file, line,
                             "%s sobre %s (%s)" % (fg_raw, bg_raw, rule.selector[:60]),
                             snippet(line))
                else:
                    ratio = contrast_ratio(fg, bg)
                    if ratio is not None:
                        need = 3.0 if is_large_text(decl_map) else 4.5
                        if ratio < need:
                            proj.add("C01", file, line,
                                     "%.2f:1 (mínimo %.1f:1) — %s sobre %s (%s)"
                                     % (ratio, need, fg_raw, bg_raw, rule.selector[:60]),
                                     snippet(line))


def finish_project_checks(proj, config):
    # F01/F02 — outline removido
    for file, line, selector, is_focus in proj.outline_none:
        if proj.has_focus_replacement:
            continue
        rule_id = "F02" if is_focus else "F01"
        proj.add(rule_id, file, line, "seletor: %s" % selector[:70])

    # M01/M04 — reduced motion
    if proj.has_motion and not proj.has_reduced_motion:
        f, l = proj.motion_example or ("projeto", 0)
        proj.add("M01", f, l, "animações/transições presentes, nenhuma guarda no projeto")
        for f, l in proj.infinite_anims:
            proj.add("M04", f, l)

    # D01 — paleta
    max_colors = config.get("max_colors", 24)
    if len(proj.colors) > max_colors:
        f, l = next(iter(proj.colors.values()))
        proj.add("D01", f, l, "%d cores hardcoded únicas (limite: %d)"
                 % (len(proj.colors), max_colors))

    # D02 — grade de espaçamento
    if len(proj.spacings) >= 24:
        off = [s for s in proj.spacings if s % 4 != 0]
        pct = 100.0 * len(off) / len(proj.spacings)
        if pct > 40.0:
            proj.add("D02", "projeto", 0,
                     "%.0f%% dos espaçamentos fora da grade de 4px (%d de %d)"
                     % (pct, len(off), len(proj.spacings)))

    # D03 — raios
    if len(proj.radii) > 6:
        proj.add("D03", "projeto", 0, "%d raios de borda distintos: %s"
                 % (len(proj.radii),
                    ", ".join("%gpx" % r for r in sorted(proj.radii)[:8]) + "…"))

    # D04 — famílias
    if len(proj.font_families) > 3:
        proj.add("D04", "projeto", 0, "%d famílias: %s"
                 % (len(proj.font_families), ", ".join(sorted(proj.font_families)[:6])))

    # D05 — z-index
    high = [(v, f, l) for v, f, l in proj.zindexes if v >= 999]
    if high:
        v, f, l = max(high)
        proj.add("D05", f, l, "z-index chega a %d (%d valores ≥ 999)" % (v, len(high)))

    # D06 — !important
    if proj.css_decl_count > 60 and proj.important_count >= 10:
        proj.add("D06", "projeto", 0, "%d usos de !important em %d declarações"
                 % (proj.important_count, proj.css_decl_count))

    # R02 — sem breakpoints
    if proj.css_decl_count > 150 and not proj.has_media_query:
        proj.add("R02", "projeto", 0,
                 "%d declarações CSS, nenhuma media/container query" % proj.css_decl_count)


# ---------------------------------------------------------------------------
# HTML
# ---------------------------------------------------------------------------

VOID_ELEMENTS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
                 "meta", "param", "source", "track", "wbr"}
NON_INTERACTIVE = {"div", "span", "section", "article", "li", "td", "tr", "p", "img",
                   "header", "footer", "main", "aside"}
INTERACTIVE_TAGS = {"a", "button", "input", "select", "textarea", "summary", "option"}


class Node(object):
    __slots__ = ("tag", "attrs", "line", "children", "parent", "text")

    def __init__(self, tag, attrs, line, parent):
        self.tag = tag
        self.attrs = attrs
        self.line = line
        self.children = []
        self.parent = parent
        self.text = ""


class TreeBuilder(HTMLParser):
    def __init__(self, base_line=1):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.root = Node("#root", {}, 0, None)
        self.stack = [self.root]
        self.all_nodes = []
        self.style_blocks = []   # (conteudo, linha_inicial)
        self.base_line = base_line
        self._in_style = False
        self._style_start = 0
        self._style_buf = []

    def _line(self):
        return self.base_line + self.getpos()[0] - 1

    def handle_starttag(self, tag, attrs):
        attr_map = {}
        for k, v in attrs:
            if k not in attr_map:
                attr_map[k] = v if v is not None else ""
        node = Node(tag, attr_map, self._line(), self.stack[-1])
        self.stack[-1].children.append(node)
        self.all_nodes.append(node)
        if tag == "style":
            self._in_style = True
            self._style_start = self._line()
            self._style_buf = []
        elif tag not in VOID_ELEMENTS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        attr_map = {}
        for k, v in attrs:
            if k not in attr_map:
                attr_map[k] = v if v is not None else ""
        node = Node(tag, attr_map, self._line(), self.stack[-1])
        self.stack[-1].children.append(node)
        self.all_nodes.append(node)

    def handle_endtag(self, tag):
        if tag == "style" and self._in_style:
            self._in_style = False
            self.style_blocks.append(("".join(self._style_buf), self._style_start))
        for idx in range(len(self.stack) - 1, 0, -1):
            if self.stack[idx].tag == tag:
                del self.stack[idx:]
                break

    def handle_data(self, data):
        if self._in_style:
            self._style_buf.append(data)
            return
        if data.strip():
            self.stack[-1].text += data.strip() + " "


def _has_text_content(node):
    if node.text.strip():
        return True
    return any(_has_text_content(c) for c in node.children)


def _accessible_name(node):
    a = node.attrs
    if a.get("aria-label", "").strip() or a.get("aria-labelledby", "").strip() or \
            a.get("title", "").strip() or a.get("alt", "").strip():
        return True
    if _has_text_content(node):
        return True
    for child in node.children:
        ca = child.attrs
        if child.tag == "img" and ca.get("alt", "").strip():
            return True
        if ca.get("aria-label", "").strip() or ca.get("title", "").strip():
            return True
        if child.tag == "svg":
            if any(g.tag == "title" for g in child.children):
                return True
        if _accessible_name(child):
            return True
    return False


def _is_expr(value):
    """Atributo vindo de template dinâmico ({x}, {{x}}, v-bind)."""
    v = (value or "").strip()
    return v.startswith("{") or v.startswith("${")


def check_html(text, file, proj, lines, base_line=1, is_fragment=False,
               dialect="html"):
    builder = TreeBuilder(base_line)
    try:
        builder.feed(text)
        builder.close()
    except Exception:
        return

    def snippet(line):
        rel = line - 1
        if 0 <= rel < len(lines):
            return lines[rel].strip()[:100]
        return ""

    nodes = builder.all_nodes
    is_page = any(n.tag == "html" for n in nodes) and not is_fragment

    labels_for = set()
    label_wrapped_ids = set()
    ids = {}
    for n in nodes:
        if n.tag == "label":
            target = n.attrs.get("for") or n.attrs.get("htmlfor")
            if target:
                labels_for.add(target)
        nid = n.attrs.get("id")
        if nid and not _is_expr(nid):
            ids.setdefault(nid, []).append(n)

    for nid, occurrences in ids.items():
        if len(occurrences) > 1:
            for n in occurrences[1:]:
                proj.add("A14", file, n.line, 'id="%s"' % nid, snippet(n.line))

    heading_levels = []
    h1_count = 0

    for n in nodes:
        a = n.attrs
        tag = n.tag

        onclick = "onclick" in a or "@click" in a or "v-on:click" in a or "on:click" in a

        if tag == "img":
            has_alt = "alt" in a or ":alt" in a or "v-bind:alt" in a
            if not has_alt:
                proj.add("A01", file, n.line, "", snippet(n.line))

        if tag in ("input", "textarea", "select"):
            itype = (a.get("type") or "text").lower()
            if itype not in ("hidden", "submit", "button", "reset", "image"):
                labelled = (a.get("aria-label", "").strip() or
                            a.get("aria-labelledby", "").strip() or
                            a.get("title", "").strip())
                if not labelled:
                    nid = a.get("id")
                    if nid and (nid in labels_for or _is_expr(nid)):
                        labelled = True
                    else:
                        p = n.parent
                        while p is not None:
                            if p.tag == "label":
                                labelled = True
                                break
                            p = p.parent
                if not labelled:
                    extra = "só tem placeholder" if a.get("placeholder") else ""
                    proj.add("A02", file, n.line, extra, snippet(n.line))

        if tag == "button" or (tag == "a" and ("href" in a or onclick)):
            if not _accessible_name(n) and not _is_expr(a.get("aria-label", "")):
                proj.add("A03", file, n.line, "<%s>" % tag, snippet(n.line))

        if tag == "a":
            href = (a.get("href") or "").strip().lower()
            if onclick and href in ("#", "", "javascript:void(0)", "javascript:;",
                                    "javascript:void(0);"):
                proj.add("A13", file, n.line, "", snippet(n.line))

        if tag == "html" and is_page:
            if not a.get("lang", "").strip() and ":lang" not in a:
                proj.add("A04", file, n.line, "", snippet(n.line))

        if tag == "meta" and (a.get("name") or "").lower() == "viewport":
            content = (a.get("content") or "").lower().replace(" ", "")
            if "user-scalable=no" in content or "user-scalable=0" in content:
                proj.add("A08", file, n.line, "user-scalable=no", snippet(n.line))
            else:
                m = re.search(r"maximum-scale=(\d*\.?\d+)", content)
                if m and float(m.group(1)) < 2.0:
                    proj.add("A08", file, n.line,
                             "maximum-scale=%s" % m.group(1), snippet(n.line))

        if tag == "iframe" and not a.get("title", "").strip():
            proj.add("A07", file, n.line, "", snippet(n.line))

        ti = a.get("tabindex") or a.get("tabIndex")
        if ti and not _is_expr(ti):
            try:
                if int(ti) > 0:
                    proj.add("A05", file, n.line, "tabindex=%s" % ti, snippet(n.line))
            except ValueError:
                pass

        if "autofocus" in a:
            proj.add("A12", file, n.line, "", snippet(n.line))

        if onclick and tag in NON_INTERACTIVE:
            has_role = a.get("role", "").strip() != ""
            has_ti = "tabindex" in a
            has_key = any(k in a for k in ("onkeydown", "onkeyup", "onkeypress",
                                           "@keydown", "@keyup", "on:keydown"))
            if not (has_role and (has_ti or has_key)):
                proj.add("A06", file, n.line, "<%s> com clique" % tag, snippet(n.line))

        if re.match(r"^h[1-6]$", tag):
            level = int(tag[1])
            if level == 1:
                h1_count += 1
                if h1_count == 2 and is_page:
                    proj.add("A10", file, n.line, "segundo <h1> na página",
                             snippet(n.line))
            if heading_levels and level > heading_levels[-1] + 1:
                proj.add("A10", file, n.line, "pulo de h%d para h%d"
                         % (heading_levels[-1], level), snippet(n.line))
            heading_levels.append(level)

        # style inline
        style = a.get("style")
        if style and not _is_expr(style):
            decls = {}
            for seg in style.split(";"):
                if ":" in seg:
                    p, _, v = seg.partition(":")
                    decls[p.strip().lower()] = v.strip()
            fs = px_of(decls.get("font-size", ""))
            if fs is not None and 0 < fs < 12:
                proj.add("T02", file, n.line, "font-size %s (inline)"
                         % decls["font-size"], snippet(n.line))
            fg = parse_color(decls.get("color"))
            bg = parse_color(decls.get("background-color")) or \
                first_color(decls.get("background"))
            if fg and bg:
                ratio = contrast_ratio(fg, bg)
                if ratio is not None:
                    need = 3.0 if is_large_text(decls) else 4.5
                    if ratio < need:
                        proj.add("C01", file, n.line,
                                 "%.2f:1 (mínimo %.1f:1) — inline" % (ratio, need),
                                 snippet(n.line))

    if is_page:
        html_node = next((n for n in nodes if n.tag == "html"), None)
        has_viewport = any(n.tag == "meta" and (n.attrs.get("name") or "").lower() ==
                           "viewport" for n in nodes)
        if not has_viewport:
            proj.add("A09", file, html_node.line if html_node else 1)
        if not any(n.tag == "main" or n.attrs.get("role") == "main" for n in nodes):
            body = next((n for n in nodes if n.tag == "body"), None)
            if body is not None and len(body.children) > 2:
                proj.add("A11", file, body.line)

    # blocos <style>
    for css_text, start_line in builder.style_blocks:
        rules = parse_css(css_text, start_line)
        check_css_rules(rules, file, proj, lines)


# ---------------------------------------------------------------------------
# JSX / TSX
# ---------------------------------------------------------------------------

JSX_KEYWORD_BEFORE = {"return", "yield", "default", "do", "else", "case", "await", "in",
                      "of", "typeof", "void", "delete", "new"}


def scan_jsx(text):
    """Extrai elementos DOM (tag minúscula) de código JSX/TSX, com heurística
    conservadora para não confundir com comparações e generics."""
    elements = []
    n = len(text)
    i = 0
    newlines = [m.start() for m in re.finditer("\n", text)]

    def line_of(idx):
        return 1 + bisect.bisect_left(newlines, idx)

    tag_re = re.compile(r"<([a-z][a-zA-Z0-9-]*)[\s/>]")
    while i < n:
        m = tag_re.search(text, i)
        if not m:
            break
        start = m.start()
        # contexto anterior: só aceita se vier de posição estrutural
        k = start - 1
        while k >= 0 and text[k] in " \t\r\n":
            k -= 1
        ok = k < 0
        if not ok:
            ch = text[k]
            if ch in "(,{[=?:&|;>":
                ok = True
            elif ch.isalnum() or ch == "_" or ch == "$":
                j = k
                while j >= 0 and (text[j].isalnum() or text[j] in "_$"):
                    j -= 1
                word = text[j + 1:k + 1]
                ok = word in JSX_KEYWORD_BEFORE
        if not ok:
            i = m.end()
            continue

        tag = m.group(1)
        # varre atributos até o > correspondente
        j = m.start() + 1 + len(tag)
        attrs = {}
        buf_start = j
        depth = 0
        self_closing = False
        while j < n:
            c = text[j]
            if c in "'\"":
                q = c
                j += 1
                while j < n and text[j] != q:
                    if text[j] == "\\":
                        j += 1
                    j += 1
            elif c == "`":
                j += 1
                while j < n and text[j] != "`":
                    if text[j] == "\\":
                        j += 1
                    j += 1
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
            elif depth == 0 and c == ">":
                if j > 0 and text[j - 1] == "/":
                    self_closing = True
                break
            j += 1
        attr_text = text[buf_start:j]
        for am in re.finditer(
                r"([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(\"[^\"]*\"|'[^']*'|\{))?",
                attr_text):
            name = am.group(1)
            raw = am.group(2)
            if raw is None:
                attrs[name] = True
            elif raw == "{":
                attrs[name] = "{expr}"
            else:
                attrs[name] = raw[1:-1]
        elements.append({"tag": tag, "attrs": attrs, "line": line_of(start),
                         "self_closing": self_closing})
        i = j + 1 if j < n else n
    return elements


RE_STYLE_OBJ_FS = re.compile(r"fontSize\s*:\s*['\"]?(\d*\.?\d+)(px|pt|rem|em)?['\"]?")
RE_STYLE_OBJ_COLOR = re.compile(r"(?<![a-zA-Z])color\s*:\s*['\"]([^'\"]+)['\"]")
RE_STYLE_OBJ_BG = re.compile(r"background(?:Color)?\s*:\s*['\"]([^'\"]+)['\"]")


def check_jsx(text, file, proj, lines):
    def snippet(line):
        if 1 <= line <= len(lines):
            return lines[line - 1].strip()[:100]
        return ""

    elements = scan_jsx(text)
    labels_for = set()
    for el in elements:
        if el["tag"] == "label":
            t = el["attrs"].get("htmlFor") or el["attrs"].get("for")
            if isinstance(t, str) and t != "{expr}":
                labels_for.add(t)

    for el in elements:
        tag, a, line = el["tag"], el["attrs"], el["line"]
        aria = lambda: (a.get("aria-label") or a.get("aria-labelledby") or
                        a.get("title"))

        if tag == "img" and "alt" not in a:
            proj.add("A01", file, line, "", snippet(line))

        if tag in ("input", "textarea", "select"):
            itype = a.get("type")
            if not (isinstance(itype, str) and
                    itype.lower() in ("hidden", "submit", "button", "reset")):
                nid = a.get("id")
                has_label = bool(aria()) or \
                    (isinstance(nid, str) and (nid in labels_for or nid == "{expr}"))
                if not has_label:
                    proj.add("A02", file, line,
                             "associe htmlFor/id ou aria-label", snippet(line))

        if tag == "iframe" and "title" not in a:
            proj.add("A07", file, line, "", snippet(line))

        ti = a.get("tabIndex") or a.get("tabindex")
        if isinstance(ti, str) and ti not in ("{expr}",):
            try:
                if int(ti) > 0:
                    proj.add("A05", file, line, "tabIndex=%s" % ti, snippet(line))
            except ValueError:
                pass

        if "autoFocus" in a or "autofocus" in a:
            proj.add("A12", file, line, "", snippet(line))

        if "onClick" in a and tag in NON_INTERACTIVE:
            has_role = "role" in a
            has_kb = any(k in a for k in ("onKeyDown", "onKeyUp", "onKeyPress"))
            has_ti = "tabIndex" in a
            if not (has_role and (has_kb or has_ti)):
                proj.add("A06", file, line, "<%s onClick>" % tag, snippet(line))

        if tag == "a":
            href = a.get("href")
            if "onClick" in a and (href in ("#", "javascript:void(0)") or
                                   href is None or href is True):
                proj.add("A13", file, line, "", snippet(line))

        if tag == "button" and el["self_closing"] and not aria():
            proj.add("A03", file, line, "<button /> vazio", snippet(line))

        # style={{ ... }} — heurística no texto da linha
        raw_line = lines[line - 1] if line - 1 < len(lines) else ""
        if "style={{" in raw_line.replace(" ", ""):
            mfs = RE_STYLE_OBJ_FS.search(raw_line)
            if mfs:
                unit = mfs.group(2) or "px"
                fs = px_of(mfs.group(1) + unit)
                if fs is not None and 0 < fs < 12:
                    proj.add("T02", file, line, "fontSize %s%s (inline)"
                             % (mfs.group(1), unit), snippet(line))
            mc = RE_STYLE_OBJ_COLOR.search(raw_line)
            mb = RE_STYLE_OBJ_BG.search(raw_line)
            if mc and mb:
                fg = parse_color(mc.group(1))
                bg = parse_color(mb.group(1))
                if fg and bg:
                    ratio = contrast_ratio(fg, bg)
                    if ratio is not None and ratio < 4.5:
                        proj.add("C01", file, line,
                                 "%.2f:1 (mínimo 4.5:1) — inline" % ratio,
                                 snippet(line))

    # CSS-in-JS / styled-components: template literals com CSS
    for m in re.finditer(r"(?:styled\.[a-zA-Z]+|styled\([^)]*\)|css|createGlobalStyle)"
                         r"\s*`([^`]*)`", text, re.S):
        css_text = m.group(1)
        base = 1 + text.count("\n", 0, m.start(1))
        css_text = re.sub(r"\$\{[^}]*\}", " ", css_text)
        rules = parse_css("& {" + css_text + "}", base)
        check_css_rules(rules, file, proj, lines)


# ---------------------------------------------------------------------------
# Vue / Svelte
# ---------------------------------------------------------------------------

def check_vue(text, file, proj, lines):
    m = re.search(r"<template[^>]*>(.*)</template>", text, re.S | re.I)
    if m:
        base_line = 1 + text.count("\n", 0, m.start(1))
        check_html(m.group(1), file, proj, lines, base_line, is_fragment=True,
                   dialect="vue")
    for sm in re.finditer(r"<style[^>]*>(.*?)</style>", text, re.S | re.I):
        base_line = 1 + text.count("\n", 0, sm.start(1))
        rules = parse_css(sm.group(1), base_line)
        check_css_rules(rules, file, proj, lines)


def check_svelte(text, file, proj, lines):
    stripped = re.sub(r"<script[^>]*>.*?</script>", lambda m: re.sub(r"[^\n]", " ",
                      m.group(0)), text, flags=re.S | re.I)
    for sm in re.finditer(r"<style[^>]*>(.*?)</style>", stripped, re.S | re.I):
        base_line = 1 + stripped.count("\n", 0, sm.start(1))
        rules = parse_css(sm.group(1), base_line)
        check_css_rules(rules, file, proj, lines)
    stripped = re.sub(r"<style[^>]*>.*?</style>", lambda m: re.sub(r"[^\n]", " ",
                      m.group(0)), stripped, flags=re.S | re.I)
    stripped = re.sub(r"\{[^{}]*\}", "x", stripped)
    check_html(stripped, file, proj, lines, 1, is_fragment=True, dialect="svelte")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def collect_files(paths, ignore_globs):
    files = []
    seen = set()
    for path in paths:
        if os.path.isfile(path):
            candidates = [path]
        else:
            candidates = []
            for root, dirs, names in os.walk(path):
                dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and
                           not d.startswith(".")]
                for name in names:
                    candidates.append(os.path.join(root, name))
        for f in candidates:
            ext = os.path.splitext(f)[1].lower()
            if ext not in EXTS:
                continue
            base = os.path.basename(f)
            if ".min." in base:
                continue
            rel = os.path.relpath(f)
            if any(fnmatch.fnmatch(rel, g) for g in ignore_globs):
                continue
            if rel in seen:
                continue
            seen.add(rel)
            try:
                if os.path.getsize(f) > MAX_FILE_BYTES:
                    continue
            except OSError:
                continue
            files.append(f)
    return sorted(files)


RE_HAS_JSX = re.compile(r"<[a-z][a-zA-Z0-9-]*[\s/>][^;]*?(?:/>|>)")


def analyze(paths, config):
    proj = Project()
    ignore = config.get("ignore", [])
    disabled = set(config.get("disable", []))
    files = collect_files(paths, ignore)
    t0 = time.perf_counter()
    for f in files:
        try:
            with open(f, "r", encoding="utf-8", errors="replace") as fh:
                text = fh.read()
        except OSError:
            continue
        proj.files += 1
        lines = text.split("\n")
        rel = os.path.relpath(f)
        ext = os.path.splitext(f)[1].lower()
        if ext in (".html", ".htm"):
            check_html(text, rel, proj, lines)
        elif ext == ".css":
            rules = parse_css(text)
            check_css_rules(rules, rel, proj, lines)
        elif ext in (".jsx", ".tsx"):
            check_jsx(text, rel, proj, lines)
        elif ext == ".vue":
            check_vue(text, rel, proj, lines)
        elif ext == ".svelte":
            check_svelte(text, rel, proj, lines)
        elif ext in (".js", ".ts"):
            # só analisa se parecer conter JSX ou CSS-in-JS
            if "styled" in text or "createGlobalStyle" in text or \
                    ("return" in text and RE_HAS_JSX.search(text)):
                check_jsx(text, rel, proj, lines)
    finish_project_checks(proj, config)
    if disabled:
        proj.findings = [f for f in proj.findings if f.rule not in disabled]
    proj.findings.sort(key=lambda f: (SEV_ORDER[f.severity], f.file, f.line))
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    return proj, elapsed_ms


def summarize(proj):
    counts = {ERROR: 0, WARN: 0, INFO: 0}
    for f in proj.findings:
        counts[f.severity] += 1
    return counts


def compute_score(proj):
    weights = {ERROR: 10, WARN: 3, INFO: 1}
    penalties = {c: 0 for c in CATEGORIES}
    for f in proj.findings:
        penalties[f.category] += weights[f.severity]
    scores = {c: max(0, 100 - penalties[c]) for c in CATEGORIES}
    overall = round(0.45 * scores["a11y"] + 0.20 * scores["consistencia"] +
                    0.15 * scores["motion"] + 0.20 * scores["responsivo"])
    return scores, overall


# ---------------------------------------------------------------------------
# Saída
# ---------------------------------------------------------------------------

def _ansi(enabled):
    if not enabled:
        return {k: "" for k in ("red", "yellow", "blue", "bold", "dim", "green",
                                "reset", "cyan")}
    return {"red": "\033[31m", "yellow": "\033[33m", "blue": "\033[34m",
            "bold": "\033[1m", "dim": "\033[2m", "green": "\033[32m",
            "reset": "\033[0m", "cyan": "\033[36m"}


SEV_ICON = {ERROR: "✖", WARN: "⚠", INFO: "ℹ"}
SEV_COLOR = {ERROR: "red", WARN: "yellow", INFO: "blue"}


def print_pretty(proj, elapsed_ms, color=True, max_show=200):
    c = _ansi(color)
    counts = summarize(proj)
    scores, overall = compute_score(proj)
    print("%s◆ onp-ui-ux v%s%s — %d arquivo(s) analisados em %.0f ms"
          % (c["bold"], VERSION, c["reset"], proj.files, elapsed_ms))
    print("%s✖ %d erro(s)%s  %s⚠ %d aviso(s)%s  %sℹ %d dica(s)%s   score: %s%d/100%s"
          % (c["red"], counts[ERROR], c["reset"], c["yellow"], counts[WARN],
             c["reset"], c["blue"], counts[INFO], c["reset"],
             c["bold"], overall, c["reset"]))
    print()
    by_file = {}
    for f in proj.findings[:max_show]:
        by_file.setdefault(f.file, []).append(f)
    for file in sorted(by_file):
        print("%s%s%s" % (c["bold"], file, c["reset"]))
        for f in sorted(by_file[file], key=lambda x: (x.line, x.rule)):
            sev, cat, title, ref, fix = RULES[f.rule]
            loc = "linha %d" % f.line if f.line else "projeto"
            col = c[SEV_COLOR[sev]]
            detail = " — %s" % f.detail if f.detail else ""
            print("  %s%s %s%s %s%s · %s · %s" % (col, SEV_ICON[sev], f.rule,
                                                  c["reset"], title, detail, loc, ref))
            if f.snippet:
                print("      %s%s%s" % (c["dim"], f.snippet, c["reset"]))
            print("      %s↳ %s%s" % (c["dim"], fix, c["reset"]))
        print()
    hidden = len(proj.findings) - min(len(proj.findings), max_show)
    if hidden > 0:
        print("%s… e mais %d achado(s) — use --json para a lista completa%s"
              % (c["dim"], hidden, c["reset"]))
    if not proj.findings:
        print("%s✔ Nenhum problema encontrado.%s" % (c["green"], c["reset"]))


def to_json(proj, elapsed_ms):
    counts = summarize(proj)
    scores, overall = compute_score(proj)
    return json.dumps({
        "tool": "onp-ui-ux",
        "version": VERSION,
        "files": proj.files,
        "elapsed_ms": round(elapsed_ms, 1),
        "summary": {"erros": counts[ERROR], "avisos": counts[WARN],
                    "dicas": counts[INFO]},
        "score": {"total": overall, "categorias": scores},
        "findings": [{
            "rule": f.rule, "severity": f.severity, "category": f.category,
            "title": RULES[f.rule][2], "ref": RULES[f.rule][3],
            "fix": RULES[f.rule][4], "file": f.file, "line": f.line,
            "detail": f.detail, "snippet": f.snippet,
        } for f in proj.findings],
    }, ensure_ascii=False, indent=2)


def to_markdown(proj, elapsed_ms):
    counts = summarize(proj)
    scores, overall = compute_score(proj)
    out = ["# Relatório onp-ui-ux", "",
           "- Arquivos: %d · Tempo: %.0f ms" % (proj.files, elapsed_ms),
           "- **%d erros** · %d avisos · %d dicas · **Score %d/100**"
           % (counts[ERROR], counts[WARN], counts[INFO], overall),
           "- Categorias: " + " · ".join("%s %d" % (k, v)
                                         for k, v in scores.items()), ""]
    if proj.findings:
        out.append("| Sev | Regra | Onde | Problema | Correção |")
        out.append("|-----|-------|------|----------|----------|")
        for f in proj.findings:
            sev, cat, title, ref, fix = RULES[f.rule]
            loc = "%s:%d" % (f.file, f.line) if f.line else f.file
            desc = title + (" — " + f.detail if f.detail else "")
            out.append("| %s | %s | `%s` | %s | %s |"
                       % (SEV_ICON[sev], f.rule, loc,
                          desc.replace("|", "\\|"), fix.replace("|", "\\|")))
    else:
        out.append("Nenhum problema encontrado. ✔")
    return "\n".join(out) + "\n"


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def load_config(paths):
    for base in list(paths) + ["."]:
        root = base if os.path.isdir(base) else os.path.dirname(base) or "."
        cfg = os.path.join(root, ".onp-uiux.json")
        if os.path.isfile(cfg):
            try:
                with open(cfg, "r", encoding="utf-8") as fh:
                    return json.load(fh)
            except (OSError, ValueError):
                return {}
    return {}


def main(argv=None):
    parser = argparse.ArgumentParser(prog="onp-ui-ux", add_help=True,
                                     description=__doc__)
    sub = parser.add_subparsers(dest="cmd")

    pv = sub.add_parser("validate", help="valida arquivos/diretórios")
    pv.add_argument("paths", nargs="+")
    pv.add_argument("--json", action="store_true")
    pv.add_argument("--md", metavar="ARQUIVO")
    pv.add_argument("--ci", action="store_true",
                    help="exit 1 se houver erros")
    pv.add_argument("--strict", action="store_true",
                    help="com --ci, avisos também falham")
    pv.add_argument("--no-color", action="store_true")
    pv.add_argument("--max", type=int, default=200, dest="max_show")

    ps = sub.add_parser("score", help="só o placar 0–100 por categoria")
    ps.add_argument("paths", nargs="+")
    ps.add_argument("--json", action="store_true")

    pe = sub.add_parser("explain", help="explica uma regra")
    pe.add_argument("rule")

    sub.add_parser("rules", help="lista todas as regras")

    args = parser.parse_args(argv)

    if args.cmd == "rules":
        for rid in sorted(RULES):
            sev, cat, title, ref, _ = RULES[rid]
            print("%s  [%s/%s]  %s  (%s)" % (rid, sev, cat, title, ref))
        return 0

    if args.cmd == "explain":
        rid = args.rule.upper()
        if rid not in RULES:
            print("Regra desconhecida: %s (use 'rules' para listar)" % rid)
            return 2
        sev, cat, title, ref, fix = RULES[rid]
        print("%s — %s" % (rid, title))
        print("Severidade: %s · Categoria: %s · Referência: %s" % (sev, cat, ref))
        print("Correção: %s" % fix)
        return 0

    if args.cmd in ("validate", "score"):
        config = load_config(args.paths)
        proj, elapsed = analyze(args.paths, config)
        if args.cmd == "score":
            scores, overall = compute_score(proj)
            if args.json:
                print(json.dumps({"total": overall, "categorias": scores},
                                 ensure_ascii=False))
            else:
                print("Score onp-ui-ux: %d/100" % overall)
                for k, v in scores.items():
                    print("  %-13s %d" % (k, v))
            return 0
        if args.json:
            print(to_json(proj, elapsed))
        else:
            color = sys.stdout.isatty() and not args.no_color
            print_pretty(proj, elapsed, color, args.max_show)
        if args.md:
            with open(args.md, "w", encoding="utf-8") as fh:
                fh.write(to_markdown(proj, elapsed))
        counts = summarize(proj)
        if args.ci:
            if counts[ERROR] > 0:
                return 1
            if args.strict and counts[WARN] > 0:
                return 1
        return 0

    parser.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
