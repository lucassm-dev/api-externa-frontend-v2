import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  rotulo: string;
  /** Rótulo só para leitor de tela, quando o contexto já diz o que é o campo. */
  rotuloVisivel?: boolean;
  /** A regra do campo, visível antes de qualquer erro (AC-034). */
  dica?: ReactNode;
  erro?: ReactNode;
  /** Controle ao lado do texto, como o botão de mostrar senha. */
  sufixo?: ReactNode;
}

/**
 * O campo de texto do produto, no lugar do mat-form-field: rótulo de verdade
 * ligado ao input (nome acessível, AC-231), dica que cede lugar ao erro, e o
 * erro anunciado junto do campo.
 */
export function Campo({ rotulo, rotuloVisivel = true, dica, erro, sufixo, id, className, ...input }: Props) {
  const gerado = useId();
  const idCampo = id ?? gerado;
  const idApoio = `${idCampo}-apoio`;
  const apoio = erro ?? dica;

  return (
    <div data-campo={input.name} className={cn('grid gap-1.5', className)}>
      <label htmlFor={idCampo} className={rotuloVisivel ? 'text-apoio font-medium text-texto' : 'sr-only'}>
        {rotulo}
      </label>
      <div className="relative flex items-center">
        <input
          id={idCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={apoio ? idApoio : undefined}
          className={cn(
            'h-11 w-full min-w-0 rounded border border-borda bg-superficie px-3 text-base text-texto',
            'placeholder:text-texto-fraco',
            'transition-[border-color,box-shadow] duration-(--duracao-rapida) ease-(--entrada)',
            'hover:border-texto-fraco',
            'focus-visible:border-acento focus-visible:shadow-(--anel-foco) focus-visible:outline-none',
            'aria-invalid:border-perigo',
            sufixo && 'pr-12',
          )}
          {...input}
        />
        {sufixo && <span className="absolute right-1.5 flex">{sufixo}</span>}
      </div>
      {erro ? (
        <p id={idApoio} data-erro className="m-0 text-rotulo font-medium text-erro-texto">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={idApoio} data-dica className="m-0 text-rotulo text-texto-fraco">
            {dica}
          </p>
        )
      )}
    </div>
  );
}
