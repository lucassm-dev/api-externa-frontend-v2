import { useState } from 'react';
import { formatarReal } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Variacao } from '@/shared/variacao';

/**
 * "Quanto entrou × quanto vale hoje" — duas barras por ticker no mesmo eixo:
 * custo e valor de mercado. A diferença entre elas é o ganho ou a perda ainda
 * não realizado, e aparece em texto, com sinal.
 *
 * As duas barras de todos os tickers compartilham uma escala só, senão a de um
 * ativo maior encolheria a leitura de outro. Retrato do agora: não há eixo de
 * tempo nem tendência — o produto não guarda série histórica (ADR-010).
 *
 * Cada linha é focável e, no foco ou no ponteiro, revela o mesmo detalhe em
 * texto; Esc devolve o gráfico ao repouso (AC-280).
 */
export interface PosicaoInvestidoMercado {
  ticker: string;
  nomeEmpresa: string;
  investido: number;
  valorMercado: number;
}

export interface PropsGraficoInvestidoMercado {
  posicoes: PosicaoInvestidoMercado[];
}

type Direcao = 'alta' | 'baixa' | 'estavel';

// Colunas fixas: com `auto`, o trilho de cada linha teria largura própria e a escala comum deixaria de ser comum.
const MEDIDA = 'grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 sm:grid-cols-[6rem_1fr_9rem]';
const ROTULO = 'text-rotulo text-texto-fraco';
// Trilho em grafico-grade: superficie-alta sumiria sob o fundo da linha ativa.
const TRILHO = 'w-full overflow-visible rounded-pequeno bg-grafico-grade max-sm:col-span-2 max-sm:row-start-2';
const VALOR = 'text-right font-numero tabular-nums max-sm:col-start-2 max-sm:row-start-1';

export function GraficoInvestidoMercado({ posicoes }: PropsGraficoInvestidoMercado) {
  const [ativo, setAtivo] = useState<string | null>(null);

  const escala = Math.max(...posicoes.flatMap((posicao) => [Math.abs(posicao.investido), Math.abs(posicao.valorMercado)]), 0);
  const largura = (valor: number) => (escala === 0 ? 0 : (Math.abs(valor) / escala) * 100);

  const desenhadas = posicoes.map((posicao) => {
    const diferenca = posicao.valorMercado - posicao.investido;
    const direcao: Direcao = diferenca > 0 ? 'alta' : diferenca < 0 ? 'baixa' : 'estavel';
    const sinal = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';
    return {
      ticker: posicao.ticker,
      nomeEmpresa: posicao.nomeEmpresa,
      direcao,
      diferenca,
      larguraInvestido: largura(posicao.investido),
      larguraMercado: largura(posicao.valorMercado),
      investidoFormatado: formatarReal(posicao.investido),
      mercadoFormatado: formatarReal(posicao.valorMercado),
      diferencaFormatada: `${sinal}${formatarReal(Math.abs(diferenca))}`,
    };
  });

  const limpar = (ticker: string) => setAtivo((atual) => (atual === ticker ? null : atual));

  return (
    <section
      data-grafico-investido-mercado
      className="grid content-start gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Investido × valor de mercado</h2>
        <p className="mt-1 mb-0 max-w-[65ch] text-apoio text-texto-fraco">
          Quanto você colocou em cada ativo e quanto ele vale hoje, lado a lado no mesmo eixo. A diferença é o ganho ou
          a perda ainda não realizado.
        </p>
      </header>

      {desenhadas.length === 0 ? (
        <p data-sem-investido-mercado className="m-0 text-apoio text-texto-fraco">
          Nenhuma posição aberta para comparar.
        </p>
      ) : (
        <>
          <div aria-hidden="true" className="px-3 font-numero text-rotulo tabular-nums text-texto-fraco sm:grid sm:grid-cols-[6rem_1fr_9rem] sm:gap-x-3">
            <div className="flex justify-between sm:col-start-2">
              <span>0</span>
              <span>{formatarReal(escala)}</span>
            </div>
          </div>
          <ol aria-label="Investido e valor de mercado por ativo" className="m-0 grid list-none divide-y divide-borda p-0">
            {desenhadas.map((barra) => (
              <li
                key={barra.ticker}
                tabIndex={0}
                data-investido-mercado={barra.ticker}
                data-direcao={barra.direcao}
                title={barra.nomeEmpresa}
                className={cn(
                  'grid gap-2 p-3 focus-visible:shadow-(--anel-foco) focus-visible:outline-none',
                  ativo === barra.ticker && 'bg-superficie-alta',
                )}
                onFocus={() => setAtivo(barra.ticker)}
                onBlur={() => limpar(barra.ticker)}
                onMouseEnter={() => setAtivo(barra.ticker)}
                onMouseLeave={() => limpar(barra.ticker)}
                onKeyDown={(evento) => evento.key === 'Escape' && setAtivo(null)}
              >
                <span data-investido-mercado-ticker className="font-semibold">
                  {barra.ticker}
                </span>

                <div className={MEDIDA}>
                  <span aria-hidden="true" className={ROTULO}>
                    Investido
                  </span>
                  <svg className={TRILHO} height="14" aria-hidden="true">
                    <rect data-barra-investido x="0" y="3" height="8" rx="4" width={`${barra.larguraInvestido}%`} className="fill-serie-1" />
                  </svg>
                  <span data-investido-valor className={VALOR}>
                    {barra.investidoFormatado}
                  </span>
                </div>

                <div className={MEDIDA}>
                  <span aria-hidden="true" className={ROTULO}>
                    Valor de hoje
                  </span>
                  <svg className={TRILHO} height="14" aria-hidden="true">
                    <rect data-barra-mercado x="0" y="3" height="8" rx="4" width={`${barra.larguraMercado}%`} className="fill-serie-3" />
                  </svg>
                  <span data-mercado-valor className={VALOR}>
                    {barra.mercadoFormatado}
                  </span>
                </div>

                <p data-investido-mercado-diferenca className="m-0 flex items-baseline gap-2 text-apoio text-texto-fraco">
                  <span>Diferença</span>
                  <Variacao valor={barra.diferenca} moeda="BRL" />
                </p>

                <p data-investido-mercado-detalhe hidden={ativo !== barra.ticker} className="m-0 text-apoio text-texto">
                  {barra.ticker}: investido {barra.investidoFormatado}, valor de hoje {barra.mercadoFormatado}, diferença{' '}
                  {barra.diferencaFormatada}.
                </p>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
