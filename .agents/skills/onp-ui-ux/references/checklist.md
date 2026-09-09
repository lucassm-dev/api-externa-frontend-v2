# Checklist de construção — MUST / SHOULD / NEVER

Percorra por categoria durante a construção (passo 3 do fluxo). Os itens
marcados ⚙ são verificados mecanicamente pelo motor — construa certo de
primeira e o `validate --ci` passa. Os demais são responsabilidade do processo
(REFINAR). Sem `python3` no ambiente, este arquivo É a validação — percorra
item a item e rotule o resultado como `PROVA FRACA (checklist manual)`.

## Interações e teclado

- MUST ⚙ Todo elemento clicável é `<button>`, `<a href>` ou tem
  role + tabindex + handler de teclado (A06).
- MUST ⚙ Foco visível em todo interativo — nunca remova outline sem
  substituto em `:focus-visible` (F01/F02).
- MUST ⚙ Alvos ≥ 24×24px; em mobile, mire 44×44px (T01).
- MUST ⚙ `<a href="#">` com onclick vira `<button>` (A13).
- MUST Ordem de tabulação segue a ordem visual; nada de `tabindex` > 0 (⚙ A05).
- MUST Modal: foco entra ao abrir, fica preso dentro, volta ao gatilho ao
  fechar; Esc fecha.
- SHOULD Atalhos destrutivos pedem confirmação OU oferecem desfazer (toast
  com "Desfazer" > modal "Tem certeza?").
- NEVER Ação disparada só por hover (touch não tem hover).
- NEVER `onmousedown` como substituto de `onclick`.

## Formulários

- MUST ⚙ Todo campo tem rótulo real (`<label for>`, wrap ou aria-label);
  placeholder NÃO é rótulo (A02).
- MUST Erro de validação aparece junto do campo, descreve a correção e é
  anunciado (`aria-describedby` + `aria-invalid`).
- MUST Submit não apaga o formulário em caso de erro — preserve o que o
  usuário digitou.
- MUST `type` e `autocomplete` corretos (`email`, `tel`, `cpf → inputmode`)
  para teclado móvel certo.
- SHOULD Validação no blur (não a cada tecla, não só no submit).
- SHOULD Máscaras mostram o formato esperado no rótulo/hint, não só na máscara.
- NEVER Desabilitar o botão de submit como única indicação de formulário
  inválido (usuário não descobre o porquê).
- NEVER Limpar campo ao focar.

## Conteúdo e semântica

- MUST ⚙ `img` com `alt` descritivo — ou `alt=""` explícito se decorativa (A01).
- MUST ⚙ Headings em ordem (h1 → h2 → h3, um h1 por página) (A10).
- MUST ⚙ `<html lang>`, `<main>`, ids únicos, iframes com title (A04/A11/A14/A07).
- MUST Estado comunicado por mais de um canal: cor + ícone/texto (WCAG 1.4.1).
- MUST Texto trunca com reticências E expõe o valor completo (title/tooltip)
  — teste com conteúdo 3× maior que o esperado.
- SHOULD Datas relativas ("há 2 dias") com absoluta acessível no title.
- SHOULD Números tabulares em colunas numéricas.
- NEVER Texto essencial dentro de imagem.
- NEVER Scroll horizontal na página inteira em qualquer largura ≥ 320px.

## Visual e contraste

- MUST ⚙ Texto normal ≥ 4.5:1; texto grande ≥ 3:1 (C01) — medido, não estimado.
- MUST ⚙ Fonte ≥ 12px sempre; corpo ≥ 16px em mobile (T02).
- MUST ⚙ line-height ≥ 1.4 no corpo (T03 cobra ≥ 1.2 como piso duro).
- MUST Ícones informativos ≥ 3:1 contra o fundo (WCAG 1.4.11).
- SHOULD ⚙ Paleta inteira em tokens; cores hardcoded controladas (D01).
- SHOULD ⚙ Espaçamento na grade de 4px (D02); raios de uma escala curta (D03).
- NEVER Cinza claro sobre branco "porque fica elegante" — se falhou no motor,
  escurece.
- NEVER Texto sobre foto sem véu (overlay) — contraste de foto é loteria.

## Motion

- MUST ⚙ `@media (prefers-reduced-motion: reduce)` cobre toda animação (M01/M04).
- MUST ⚙ Anime `transform`/`opacity`, não width/height/top/left (M02).
- MUST Animação de interação é interrompível — clique no meio não trava.
- SHOULD ⚙ Interações em 100–300ms (M03 alerta acima de 700ms).
- NEVER Autoplay de carrossel sem pausa; nada pisca mais de 3×/s (WCAG 2.3.1).

## Responsivo e temas

- MUST ⚙ Nunca bloquear zoom (`user-scalable=no`) (A08); meta viewport
  presente (A09).
- MUST Layout íntegro em 360 / 768 / 1280 — verifique os três.
- MUST ⚙ Sem largura fixa que estoure mobile (R01); breakpoints existem (R02).
- MUST Inputs com `font-size` ≥ 16px em iOS (evita zoom forçado no foco).
- SHOULD Imagens com `srcset`/`sizes` ou largura máxima 100%.
- SHOULD Dark mode: se existir, contraste revalidado no tema escuro; sombras
  viram bordas/superfícies.
- NEVER Esconder conteúdo essencial "porque é mobile" — reorganize, não ampute.

## Percepção de performance

- MUST Loading além de 400ms tem indicador; além de 3s tem mensagem de contexto.
- MUST Imagens com `width`/`height` (ou aspect-ratio) — zero layout shift.
- SHOULD Skeleton para conteúdo previsível; spinner só para ação pontual.
- SHOULD Ação otimista quando reversível (marca feito, desfaz se falhar).
- NEVER Botão que não reage ao clique imediatamente (mín.: estado pressed).
