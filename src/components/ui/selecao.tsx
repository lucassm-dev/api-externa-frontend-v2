import { ChevronDown } from 'lucide-react';
import { useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo: string;
  /** Rótulo visível ao lado ou só para leitor de tela. */
  rotuloVisivel?: boolean;
  /** Em formulário: rótulo em cima, lista na largura toda, dica e erro embaixo. */
  empilhado?: boolean;
  dica?: ReactNode;
  erro?: ReactNode;
  [dado: `data-${string}`]: unknown;
}

/**
 * Lista de escolha do produto: o <select> nativo (o melhor no celular e no
 * leitor de tela) com a aparência do kit e o rótulo sempre ligado.
 */
export function Selecao({ rotulo, rotuloVisivel = true, empilhado = false, dica, erro, className, children, ...select }: Props) {
  const idApoio = useId();
  const apoio = erro ?? dica;

  return (
    <div className={cn(empilhado ? 'grid gap-1.5' : 'inline-flex min-w-0', className)}>
      <label className={cn('min-w-0 gap-2', empilhado ? 'grid gap-1.5' : 'inline-flex items-center')}>
        <span className={rotuloVisivel ? (empilhado ? 'text-apoio font-medium text-texto' : 'text-rotulo font-medium text-texto-fraco') : 'sr-only'}>
          {rotulo}
        </span>
        <span className="relative flex min-w-0">
          <select
            aria-invalid={erro ? true : undefined}
            aria-describedby={apoio ? idApoio : undefined}
            className={cn(
              'min-w-0 cursor-pointer appearance-none truncate rounded border border-borda bg-superficie py-0 pr-8 pl-3 text-base text-texto',
              'transition-[border-color,box-shadow] duration-(--duracao-rapida) ease-(--entrada)',
              'hover:border-texto-fraco focus-visible:border-acento focus-visible:shadow-(--anel-foco) focus-visible:outline-none',
              'aria-invalid:border-perigo',
              empilhado ? 'h-11 w-full' : 'h-9 pointer-coarse:h-(--alvo-toque)',
            )}
            {...select}
          >
            {children}
          </select>
          <ChevronDown aria-hidden="true" focusable="false" className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-texto-fraco" />
        </span>
      </label>
      {apoio && (
        <p id={idApoio} data-erro={erro ? '' : undefined} data-dica={erro ? undefined : ''} className={cn('m-0 text-rotulo', erro ? 'font-medium text-erro-texto' : 'text-texto-fraco')}>
          {apoio}
        </p>
      )}
    </div>
  );
}
