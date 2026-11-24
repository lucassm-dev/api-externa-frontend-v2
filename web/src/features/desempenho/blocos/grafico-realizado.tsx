import { Selo, VarianteSelo } from '@/components/ui/selo';
import { formatarReal } from '@/core/formatacao/formatacao';
import { Variacao } from '@/shared/variacao';
import { BarraDeRealizado } from '../realizado-por-ticker';

/**
 * O que já foi apurado em vendas, por ticker. É um dos poucos números fechados
 * do produto: não muda com a cotação, e por isso não carrega horário de
 * snapshot como os demais.
 *
 * Inclui ticker que não tem mais posição aberta — quem zerou um ativo continua
 * vendo o que ele rendeu. O total é o do backend, não a soma refeita aqui.
 */
export interface PropsGraficoRealizado {
  barras: BarraDeRealizado[];
  total: number;
}

const CENTRO = 50;

// No celular a barra desce para a linha de baixo, inteira: todas as linhas mantêm o mesmo trilho e a mesma escala.
const COLUNAS = 'grid-cols-[1fr_auto_auto] sm:grid-cols-[5.5rem_1fr_8rem_5.5rem]';

function seloDe(valor: number): { variante: VarianteSelo; texto: string } {
  if (valor > 0) return { variante: 'alta', texto: 'Ganho' };
  if (valor < 0) return { variante: 'baixa', texto: 'Perda' };
  return { variante: 'estavel', texto: 'Estável' };
}

export function GraficoRealizado({ barras, total }: PropsGraficoRealizado) {
  const ordenadas = [...barras].sort((uma, outra) => outra.valor - uma.valor);
  const escala = Math.max(...ordenadas.map((barra) => Math.abs(barra.valor)), 0);
  const desenhadas = ordenadas.map((barra) => {
    const largura = escala === 0 ? 0 : (Math.abs(barra.valor) / escala) * CENTRO;
    const ganho = barra.valor >= 0;
    return { ...barra, ganho, largura, inicio: ganho ? CENTRO : CENTRO - largura, selo: seloDe(barra.valor) };
  });

  return (
    <section data-grafico-realizado className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Resultado realizado por ativo</h2>
        <p className="mt-1 mb-0 max-w-[65ch] text-apoio text-texto-fraco">
          O que cada ativo já rendeu em vendas apuradas. Número fechado: não muda com a cotação.
        </p>
      </header>

      {desenhadas.length === 0 ? (
        <p data-sem-realizado className="m-0 text-apoio text-texto-fraco">
          Você ainda não vendeu nada nesta carteira. O resultado realizado aparece aqui depois da primeira venda.
        </p>
      ) : (
        <>
          <div aria-hidden="true" className={`grid gap-x-3 text-rotulo text-texto-fraco ${COLUNAS}`}>
            <div className="col-span-3 grid grid-cols-3 sm:col-span-1 sm:col-start-2">
              <span>Perda</span>
              <span className="text-center">0</span>
              <span className="text-right">Ganho</span>
            </div>
          </div>
          <ol aria-label="Resultado realizado por ativo" className="m-0 grid list-none gap-2 p-0">
            {desenhadas.map((barra) => (
              <li
                key={barra.ticker}
                data-realizado={barra.ticker}
                data-direcao={barra.ganho ? 'alta' : 'baixa'}
                className={`grid min-h-8 items-center gap-x-3 gap-y-1 ${COLUNAS}`}
              >
                <span data-realizado-ticker className="font-semibold">
                  {barra.ticker}
                </span>
                <svg className="w-full overflow-visible rounded bg-superficie-alta max-sm:col-span-3 max-sm:row-start-2" height="18" aria-hidden="true">
                  <rect
                    data-realizado-barra
                    y="4"
                    height="10"
                    rx="4"
                    x={`${barra.inicio}%`}
                    width={`${barra.largura}%`}
                    className={barra.ganho ? 'fill-alta' : 'fill-baixa'}
                  />
                  <line data-linha-zero x1="50%" x2="50%" y1="0" y2="18" strokeWidth="2" className="stroke-grafico-eixo" />
                </svg>
                <span data-realizado-valor className="text-right font-numero tabular-nums max-sm:col-start-2 max-sm:row-start-1">
                  <Variacao valor={barra.valor} moeda="BRL" />
                </span>
                <span data-selo-realizado className="justify-self-end max-sm:col-start-3 max-sm:row-start-1">
                  <Selo variante={barra.selo.variante} texto={barra.selo.texto} />
                </span>
              </li>
            ))}
          </ol>

          <p data-total-realizado className="m-0 text-apoio text-texto-fraco">
            Total apurado pelo servidor: {formatarReal(total)}
          </p>
        </>
      )}
    </section>
  );
}
