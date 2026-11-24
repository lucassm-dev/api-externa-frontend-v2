import type { TableHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Botao } from './botao';

/** A tabela do produto: semântica pura, apresentação em tabela.css (AC-244, AC-245, AC-272). */
export function Tabela({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn('tabela', className)} {...props} />;
}

export type SentidoOrdenacao = 'crescente' | 'decrescente' | 'nenhum';

const ARIA_SORT: Record<SentidoOrdenacao, 'ascending' | 'descending' | 'none'> = {
  crescente: 'ascending',
  decrescente: 'descending',
  nenhum: 'none',
};

interface PropsCabecalho {
  rotulo: string;
  sentido?: SentidoOrdenacao;
  aoOrdenar: () => void;
  /** Coluna de número: o cabeçalho alinha à direita, junto dos valores. */
  numero?: boolean;
}

/**
 * Cabeçalho que ordena. O sentido é anunciado em aria-sort; o glifo é só
 * desenho, pintado com currentColor (AC-242, P-003).
 */
export function CabecalhoOrdenavel({ rotulo, sentido = 'nenhum', aoOrdenar, numero = false }: PropsCabecalho) {
  return (
    <th scope="col" aria-sort={ARIA_SORT[sentido]} data-sentido={sentido} data-numero={numero || undefined} className="p-0!">
      <Botao
        intencao="sutil"
        tamanho="compacto"
        type="button"
        onClick={aoOrdenar}
        className={cn(
          'w-full rounded-none px-3 py-2 font-medium text-inherit uppercase tracking-(--entrelinha-rotulo)',
          'hover:not-disabled:bg-transparent hover:not-disabled:text-acento',
          numero ? 'justify-end' : 'justify-start',
        )}
      >
        <span>{rotulo}</span>
        <svg data-glifo viewBox="0 0 8 12" aria-hidden="true" focusable="false" className="size-3 w-2 flex-none">
          <path className={cn('fill-current', sentido === 'crescente' ? 'opacity-100' : 'opacity-30')} d="M4 0 8 5 0 5Z" />
          <path className={cn('fill-current', sentido === 'decrescente' ? 'opacity-100' : 'opacity-30')} d="M4 12 0 7 8 7Z" />
        </svg>
      </Botao>
    </th>
  );
}
