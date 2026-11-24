import { Variacao } from '@/shared/variacao';
import { BarraDeContribuicao } from '../contribuicao';

/**
 * "Quem está puxando o resultado?" — barras que saem de uma linha zero, ganho
 * para a direita e perda para a esquerda, da maior alta à maior baixa.
 *
 * O lado da barra, o sinal e a palavra dizem a direção. A cor só reforça: em
 * tema claro ou escuro, quem não distingue verde de vermelho continua lendo o
 * gráfico inteiro.
 *
 * Nenhum eixo de tempo: é o resultado de agora, não a trajetória dele.
 */
export interface PropsGraficoContribuicao {
  barras: BarraDeContribuicao[];
}

const CENTRO = 50;

// No celular a barra desce para a linha de baixo, inteira: todas as linhas mantêm o mesmo trilho e a mesma escala.
const COLUNAS = 'grid-cols-[1fr_auto] sm:grid-cols-[5.5rem_1fr_10rem]';

export function GraficoContribuicao({ barras }: PropsGraficoContribuicao) {
  const escala = Math.max(...barras.map((barra) => Math.abs(barra.valor)), 0);
  const desenhadas = barras.map((barra) => {
    const largura = escala === 0 ? 0 : (Math.abs(barra.valor) / escala) * CENTRO;
    const ganho = barra.valor >= 0;
    return { ...barra, ganho, largura, inicio: ganho ? CENTRO : CENTRO - largura };
  });

  return (
    <section data-grafico-contribuicao className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Contribuição por ativo</h2>
        <p className="mt-1 mb-0 max-w-[65ch] text-apoio text-texto-fraco">
          Quanto cada posição está puxando o resultado não realizado, agora. Ganho à direita da linha, perda à esquerda.
        </p>
      </header>

      {desenhadas.length === 0 ? (
        <p data-sem-contribuicao className="m-0 text-apoio text-texto-fraco">
          Nenhuma posição aberta para contribuir.
        </p>
      ) : (
        <>
          <div aria-hidden="true" className={`grid gap-x-3 text-rotulo text-texto-fraco ${COLUNAS}`}>
            <div className="col-span-2 grid grid-cols-3 sm:col-span-1 sm:col-start-2">
              <span>Perda</span>
              <span className="text-center">0</span>
              <span className="text-right">Ganho</span>
            </div>
          </div>
          <ol aria-label="Contribuição não realizada por ativo" className="m-0 grid list-none gap-2 p-0">
            {desenhadas.map((barra) => (
              <li
                key={barra.ticker}
                data-contribuicao={barra.ticker}
                data-direcao={barra.ganho ? 'alta' : 'baixa'}
                title={barra.nomeEmpresa}
                className={`grid min-h-8 items-center gap-x-3 gap-y-1 ${COLUNAS}`}
              >
                <span data-contribuicao-ticker className="font-semibold">
                  {barra.ticker}
                </span>
                <svg className="w-full overflow-visible rounded bg-superficie-alta max-sm:col-span-2 max-sm:row-start-2" height="18" aria-hidden="true">
                  <rect
                    data-contribuicao-barra
                    y="4"
                    height="10"
                    rx="4"
                    x={`${barra.inicio}%`}
                    width={`${barra.largura}%`}
                    className={barra.ganho ? 'fill-alta' : 'fill-baixa'}
                  />
                  <line data-linha-zero x1="50%" x2="50%" y1="0" y2="18" strokeWidth="2" className="stroke-grafico-eixo" />
                </svg>
                <span data-contribuicao-valor className="text-right font-numero tabular-nums max-sm:col-start-2 max-sm:row-start-1">
                  <Variacao valor={barra.valor} moeda="BRL" />
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
