import { ContagemNumero } from '@/components/ui/contagem-numero';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selecao } from '@/components/ui/selecao';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarReal } from '@/core/formatacao/formatacao';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { Variacao } from '@/shared/variacao';
import { CarteiraResumida, ConsolidadoDaCarteira } from '../painel.model';

interface Props {
  carteiras: CarteiraResumida[];
  carteiraSelecionada: number | null;
  consolidado: ConsolidadoDaCarteira | null;
  carregando?: boolean;
  aoSelecionar: (carteiraId: number) => void;
}

function seloDoResultado(resultado: number): { variante: VarianteSelo; texto: string } {
  if (resultado > 0) return { variante: 'alta', texto: 'Alta' };
  if (resultado < 0) return { variante: 'baixa', texto: 'Baixa' };
  return { variante: 'estavel', texto: 'Estável' };
}

// Indicadores planos, separados por divisória: cartão dentro de cartão só soma moldura.
const INDICADOR = 'grid content-start gap-1.5 border-borda py-3 not-first:border-t sm:py-0 sm:not-first:border-t-0 sm:not-first:border-l sm:not-first:pl-5';
const ROTULO = 'm-0 text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';
const VALOR = 'm-0 font-numero text-titulo font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo) text-texto';

/**
 * O consolidado de UMA carteira, sempre em real e com a taxa de câmbio à vista
 * (ADR-004). Nada aqui soma carteiras: o número somado no cliente não bate com
 * nenhuma outra tela do sistema.
 */
export function Consolidado({ carteiras, carteiraSelecionada, consolidado, carregando = false, aoSelecionar }: Props) {
  const selo = seloDoResultado(consolidado?.lucroNaoRealizado ?? 0);

  return (
    <section data-consolidado className="rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Consolidado da carteira</h2>
        <Selecao
          rotulo="Carteira"
          data-seletor-carteira
          value={carteiraSelecionada ?? ''}
          onChange={(evento) => aoSelecionar(Number(evento.target.value))}
        >
          {carteiras.map((carteira) => (
            <option key={carteira.id} value={carteira.id}>
              {carteira.nome}
            </option>
          ))}
        </Selecao>
      </header>

      {carregando ? (
        <div data-esqueleto-consolidado aria-hidden="true" className="grid gap-3 sm:grid-cols-3">
          <Esqueleto formato="bloco" />
          <Esqueleto formato="bloco" />
          <Esqueleto formato="bloco" />
        </div>
      ) : (
        consolidado && (
          <>
            <ul className="m-0 grid list-none gap-x-5 p-0 sm:grid-cols-3">
              <li data-indicador className={INDICADOR}>
                <p data-indicador-rotulo className={ROTULO}>
                  Valor investido
                </p>
                <p data-indicador-valor className={VALOR}>
                  <span data-valor-investido>
                    <ContagemNumero valor={consolidado.valorInvestido} formatar={formatarReal} />
                  </span>
                </p>
              </li>
              <li data-indicador className={INDICADOR}>
                <p data-indicador-rotulo className={ROTULO}>
                  Valor de mercado
                </p>
                <p data-indicador-valor className={VALOR}>
                  <span data-valor-de-mercado>
                    <ContagemNumero valor={consolidado.valorDeMercado} formatar={formatarReal} />
                  </span>
                </p>
              </li>
              <li data-indicador className={INDICADOR}>
                <p data-indicador-rotulo className={ROTULO}>
                  Resultado não realizado
                </p>
                <p data-indicador-valor data-lucro-nao-realizado className={VALOR}>
                  <Variacao valor={consolidado.lucroNaoRealizado} moeda="BRL" />
                </p>
                <span data-selo-resultado>
                  <Selo variante={selo.variante} texto={selo.texto} />
                </span>
              </li>
            </ul>

            <p data-taxa-cambio className="mt-4 mb-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-apoio">
              <span className="text-texto-fraco">Dólar usado na conversão</span>
              <ValorComHorario valor={consolidado.taxaCambioAtual} obtidoEm={consolidado.dataHoraTaxaCambio} />
            </p>

            {consolidado.avisos.map((aviso) => (
              <div key={aviso} data-aviso-consolidado className="mt-3">
                <MensagemFeedback nivel="aviso" mensagem={aviso} />
              </div>
            ))}
          </>
        )
      )}
    </section>
  );
}
