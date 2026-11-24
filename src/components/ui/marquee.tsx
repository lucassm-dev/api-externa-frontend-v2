import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Adaptado do Marquee do Magic UI (registro `marquee`, conferido em
 * 2026-11-22). Mudanças: a primeira cópia é a lista de verdade e as outras são
 * decorativas (aria-hidden); pausa também com foco dentro, não só com o
 * ponteiro; e com "reduzir movimento" vira rolagem manual de uma cópia só
 * (AC-234, AC-235, AC-302). Anima apenas transform (AC-233).
 */
interface Props {
  /** A lista real. `copia` recebe a mesma lista sem marcadores, para as repetições. */
  conteudo: ReactNode;
  copia: ReactNode;
  /** Segundos de uma volta: o produto mantém a velocidade constante por item (Q-029). */
  duracao: number;
  repeticoes?: number;
  className?: string;
}

export function Marquee({ conteudo, copia, duracao, repeticoes = 4, className }: Props) {
  const grupo =
    'flex shrink-0 gap-(--gap) pr-(--gap) animate-marquee group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none';

  return (
    <div
      data-marquee
      style={{ '--duracao-marquee': `${duracao}s`, '--gap': 'var(--espaco-6)' } as CSSProperties}
      className={cn('group flex min-w-0 overflow-hidden motion-reduce:overflow-x-auto', className)}
    >
      <ul className={cn(grupo, 'm-0 list-none p-0')}>{conteudo}</ul>
      {Array.from({ length: repeticoes - 1 }, (_, indice) => (
        <ul key={indice} data-grupo-clone aria-hidden="true" className={cn(grupo, 'm-0 list-none p-0 motion-reduce:hidden')}>
          {copia}
        </ul>
      ))}
    </div>
  );
}
