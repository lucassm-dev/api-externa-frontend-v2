import { Eye, EyeOff } from 'lucide-react';

interface Props {
  /**
   * O estado mora no formulário que hospeda o campo, não aqui: é ele que liga o
   * `type` do input ao estado. Assim senha e confirmação têm cada uma o seu, e
   * revelar uma não revela a outra (AC-297).
   */
  visivel: boolean;
  aoAlternar: (visivel: boolean) => void;
  /** Como o campo se chama na frase do rótulo, para distinguir dois na mesma tela. */
  campo?: string;
}

export function VisibilidadeSenha({ visivel, aoAlternar, campo = 'senha' }: Props) {
  const rotulo = `${visivel ? 'Ocultar' : 'Mostrar'} ${campo}`;

  return (
    <button
      data-visibilidade-senha
      type="button"
      aria-label={rotulo}
      title={rotulo}
      aria-pressed={visivel}
      onClick={() => aoAlternar(!visivel)}
      className={[
        'inline-grid size-8 min-w-8 min-h-8 place-items-center p-0 cursor-pointer',
        'rounded-pilula border-0 bg-transparent text-texto-fraco',
        'transition-colors duration-(--duracao-rapida) ease-(--entrada)',
        'hover:bg-superficie-alta hover:text-texto',
        'focus-visible:outline-none focus-visible:shadow-(--anel-foco)',
        // Onde há toque, o alvo sobe ao mínimo do WCAG, como o botão do produto.
        'pointer-coarse:size-(--alvo-toque) pointer-coarse:min-w-(--alvo-toque) pointer-coarse:min-h-(--alvo-toque)',
      ].join(' ')}
    >
      {visivel ? (
        <EyeOff data-icone="oculta" aria-hidden="true" focusable="false" className="size-4.5" />
      ) : (
        <Eye data-icone="revela" aria-hidden="true" focusable="false" className="size-4.5" />
      )}
    </button>
  );
}
