# Tasks: Visibilidade da senha

> feature: visibilidade-da-senha

## T-126 — Botão de visibilidade e sua adoção nos três campos [concluida]
- Refs: US-082, AC-295, AC-296, AC-297, AC-298
- Arquivos: src/core/dados/idade-dado.ts, src/core/sessao/sessao.model.ts, src/core/sessao/sessao.service.ts, src/features/acesso/cadastro.spec.tsx, src/features/acesso/cadastro.tsx, src/features/acesso/login.tsx, src/shared/estado-vazio.tsx, src/shared/monograma.tsx, src/shared/shared.spec.tsx, src/shared/valor-com-horario.tsx, src/shared/variacao.tsx, src/shared/visibilidade-senha.tsx
- Modelo: claude-sonnet-5
- Esforço: medio
- Notas: um componente só, usado como sufixo do `mat-form-field`, para que os três
  campos se comportem igual. O estado fica no formulário que o hospeda, via
  `model()`, e o campo liga o próprio `type` a ele — assim revelar um campo não
  toca no outro (AC-297). `type="button"` explícito: dentro de `<form>`, botão sem
  tipo envia o formulário (AC-298). Ícones `LucideEye` e `LucideEyeOff`, com o
  nome acessível mudando junto do estado (AC-296). Cor só de token (P-003) e alvo
  de toque de 44px onde o ponteiro é grosso, como o botão do produto já faz.
