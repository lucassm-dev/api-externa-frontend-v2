import { estaDefasado } from '@/core/dados/idade-dado';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarDataHora } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { IdadeDasCotacoes } from '../idade-das-cotacoes';

export interface ConfissoesDesempenhoProps {
  idade: IdadeDasCotacoes;
  avisosDoConsolidado?: string[];
  taxaCambio?: number | null;
  dataHoraTaxaCambio?: string | null;
}

/**
 * O que a tela precisa confessar, no corpo dela e não em tooltip nem rodapé:
 * a rentabilidade não inclui dividendos nem JCP — o produto não tem esse dado,
 * e uma ação que distribuiu dinheiro aparece pior do que foi —, e os preços são
 * snapshots de idades diferentes entre si, qualificados pelo mais antigo
 * (ADR-005).
 *
 * Os avisos que o backend manda no consolidado (câmbio indisponível, por
 * exemplo) entram aqui como aviso, nunca como erro: o número continua na tela
 * com a última taxa conhecida (ADR-006).
 */
export function ConfissoesDesempenho({
  idade,
  avisosDoConsolidado = [],
  taxaCambio = null,
  dataHoraTaxaCambio = null,
}: ConfissoesDesempenhoProps) {
  const { maisAntiga, tickersDefasados: defasados } = idade;
  const horarioMaisAntigo = maisAntiga === null ? null : formatarDataHora(maisAntiga);
  const maisAntigaDefasada = maisAntiga !== null && estaDefasado(maisAntiga);

  return (
    <section data-confissoes className="grid gap-2 rounded border border-borda bg-superficie-alta p-4">
      <p data-aviso-dividendos className="m-0 text-apoio">
        <strong>A rentabilidade não inclui dividendos nem JCP.</strong> O produto não guarda esse dado: um ativo que
        distribuiu dinheiro aparece aqui com resultado menor do que o real.
      </p>

      <p
        data-aviso-snapshot
        data-defasado={String(maisAntigaDefasada)}
        className={cn('m-0 text-apoio', maisAntigaDefasada && 'rounded-pequeno bg-defasado-fundo p-2 text-defasado-texto')}
      >
        <strong>Os preços são snapshots, com idades diferentes entre si.</strong>{' '}
        {horarioMaisAntigo ? (
          <>
            A cotação mais antiga desta carteira é de <span data-horario-mais-antigo>{horarioMaisAntigo}</span>, e é
            ela que qualifica a tela.
          </>
        ) : (
          'Não há cotação nesta carteira para datar.'
        )}
      </p>

      {defasados.length > 0 && (
        <div data-aviso-defasagem>
          <MensagemFeedback
            nivel="aviso"
            mensagem={`Preço defasado em ${defasados.join(', ')}. Atualize a cotação no catálogo de ações antes de decidir com estes números.`}
          />
        </div>
      )}

      {taxaCambio !== null && dataHoraTaxaCambio !== null && (
        <p data-taxa-cambio className="m-0 flex flex-wrap items-baseline gap-2 text-apoio">
          <span className="text-texto-fraco">Dólar usado na conversão</span>
          <ValorComHorario valor={taxaCambio} obtidoEm={dataHoraTaxaCambio} />
        </p>
      )}

      {avisosDoConsolidado.map((aviso) => (
        <div key={aviso} data-aviso-consolidado>
          <MensagemFeedback nivel="aviso" mensagem={aviso} />
        </div>
      ))}
    </section>
  );
}
