import { Moeda, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';

type Direcao = 'alta' | 'baixa' | 'estavel';

// Os três sinais fazem parte da spec (AC-021, AC-237): o texto é o que se lê.
const SINAIS: Record<Direcao, string> = { alta: '▲', baixa: '▼', estavel: '–' };
const CORES: Record<Direcao, string> = { alta: 'text-alta', baixa: 'text-baixa', estavel: 'text-estavel' };

interface Props {
  valor: number;
  moeda?: Moeda | null;
  percentual?: boolean;
  className?: string;
}

/** Ganho e perda nunca dependem só de cor: vêm com seta e com a palavra (PRD-001). */
export function Variacao({ valor, moeda = null, percentual = false, className }: Props) {
  const direcao: Direcao = valor > 0 ? 'alta' : valor < 0 ? 'baixa' : 'estavel';
  const modulo = Math.abs(valor);
  const numero = percentual
    ? `${formatarNumero(modulo)}%`
    : moeda
      ? formatarMoeda(modulo, moeda)
      : formatarNumero(modulo);

  return (
    <span
      data-variacao
      data-direcao={direcao}
      className={cn('inline-flex items-baseline gap-1 font-numero tabular-nums', CORES[direcao], className)}
    >
      <span data-sinal aria-hidden="true" className="text-[0.8em]">
        {SINAIS[direcao]}
      </span>
      <span data-numero>{numero}</span>
      <span data-descricao className="sr-only">
        {direcao}
      </span>
    </span>
  );
}
