import { ContagemNumero } from '@/components/ui/contagem-numero';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Variacao } from '@/shared/variacao';
import { ResultadosDaCarteira } from '../resultados';

/**
 * Os quatro números do PRD-008, sempre nesta ordem. Realizado e não realizado
 * ficam em cartões separados e rotulados: são naturezas diferentes, o
 * investidor experiente sabe disso, e somá-los destruiria a confiança na tela
 * inteira.
 *
 * Nada de rentabilidade anualizada: anualizar exige saber há quanto tempo cada
 * posição existe e ponderar aportes, o que depende do extrato inteiro —
 * paginado e sem filtro (ADR-010).
 */
export interface PropsNumerosDesempenho {
  resultados: ResultadosDaCarteira;
}

function seloDoPercentual(percentual: number | null): { variante: VarianteSelo; texto: string } | null {
  if (percentual === null) {
    return null;
  }
  if (percentual > 0) {
    return { variante: 'alta', texto: `Alta ${formatarNumero(percentual)}%` };
  }
  if (percentual < 0) {
    return { variante: 'baixa', texto: `Baixa ${formatarNumero(Math.abs(percentual))}%` };
  }
  return { variante: 'estavel', texto: 'Estável 0,00%' };
}

const NUMERO = 'grid min-h-33 content-start gap-2 rounded-grande border border-borda p-4 shadow-cartao';
const ROTULO = 'text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';
const VALOR =
  'm-0 flex flex-wrap items-baseline gap-2 font-numero text-titulo font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo) tabular-nums';
const NOTA = 'mt-auto mb-0 self-end text-apoio text-texto-fraco';

export function NumerosDesempenho({ resultados }: PropsNumerosDesempenho) {
  const seloNaoRealizado = seloDoPercentual(resultados.naoRealizadoPercentual);
  const seloRealizado = seloDoPercentual(resultados.realizadoPercentual);

  return (
    <dl
      data-numeros-desempenho
      className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2 min-[60rem]:grid-cols-4"
    >
      <div data-indicador className={cn(NUMERO, 'bg-superficie')}>
        <dt data-indicador-rotulo className={ROTULO}>
          Valor investido
        </dt>
        <dd data-indicador-valor data-valor-investido className={VALOR}>
          <ContagemNumero valor={resultados.valorInvestido} formatar={formatarReal} />
        </dd>
      </div>

      <div data-indicador className={cn(NUMERO, 'bg-superficie')}>
        <dt data-indicador-rotulo className={ROTULO}>
          Valor de mercado
        </dt>
        <dd data-indicador-valor data-valor-de-mercado className={VALOR}>
          <ContagemNumero valor={resultados.valorDeMercado} formatar={formatarReal} />
        </dd>
      </div>

      <div data-indicador className={cn(NUMERO, 'bg-superficie-alta')}>
        <dt data-indicador-rotulo className={ROTULO}>
          Resultado não realizado
        </dt>
        <dd data-indicador-valor data-nao-realizado className={VALOR}>
          <Variacao valor={resultados.naoRealizado} moeda="BRL" />
        </dd>
        {seloNaoRealizado && (
          <dd data-nao-realizado-percentual className="m-0 justify-self-start">
            <Selo variante={seloNaoRealizado.variante} texto={seloNaoRealizado.texto} />
          </dd>
        )}
        <dd className={NOTA}>Ainda em aberto nas posições. Muda a cada cotação.</dd>
      </div>

      <div data-indicador className={cn(NUMERO, 'bg-superficie-alta')}>
        <dt data-indicador-rotulo className={ROTULO}>
          Resultado realizado
        </dt>
        {resultados.realizado === null ? (
          <dd
            data-indicador-valor
            data-realizado-indisponivel
            className="m-0 leading-(--altura-base) text-texto-fraco"
          >
            Não foi possível ler o resultado apurado.
          </dd>
        ) : (
          <>
            <dd data-indicador-valor data-realizado className={VALOR}>
              <Variacao valor={resultados.realizado} moeda="BRL" />
            </dd>
            {seloRealizado && (
              <dd data-realizado-percentual className="m-0 justify-self-start">
                <Selo variante={seloRealizado.variante} texto={seloRealizado.texto} />
              </dd>
            )}
            <dd className={NOTA}>Já apurado nas vendas. Não muda com a cotação.</dd>
          </>
        )}
      </div>
    </dl>
  );
}
