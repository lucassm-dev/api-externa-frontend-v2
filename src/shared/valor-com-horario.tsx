import { Clock } from 'lucide-react';
import { estaDefasado, idadeEmMinutos } from '@/core/dados/idade-dado';
import { Moeda, formatarHora, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';

interface Props {
  valor: number;
  /** `null`: moeda desconhecida, o valor sai sem símbolo em vez de afirmar real. */
  moeda?: Moeda | null;
  obtidoEm: Date | string;
}

/**
 * Preço ou taxa de câmbio: nunca aparece sem o momento em que foi obtido
 * (ADR-005), e ganha marcação própria quando passa do limite de defasagem.
 */
export function ValorComHorario({ valor, moeda = 'BRL', obtidoEm }: Props) {
  const defasado = estaDefasado(obtidoEm);

  return (
    <span data-valor-com-horario data-defasado={String(defasado)} className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span data-numero className="font-numero tabular-nums">
        {moeda ? formatarMoeda(valor, moeda) : formatarNumero(valor, 2)}
      </span>
      <span data-horario className="text-rotulo text-texto-fraco">
        obtido às {formatarHora(obtidoEm)}
      </span>
      {defasado && (
        <span
          data-marcacao-defasado
          className="inline-flex items-center gap-1 self-center rounded-pilula border border-aviso-borda bg-defasado-fundo px-2 text-rotulo font-semibold text-defasado-texto"
        >
          <Clock aria-hidden="true" focusable="false" className="size-3" />
          de {idadeEmMinutos(obtidoEm)} min atrás
        </span>
      )}
    </span>
  );
}
