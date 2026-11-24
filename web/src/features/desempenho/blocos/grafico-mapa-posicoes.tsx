import { useState, type KeyboardEvent } from 'react';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Variacao } from '@/shared/variacao';
import { blocosDoMapa } from './blocos-do-mapa';

/**
 * "Onde meu dinheiro está?" — cada posição aberta é um bloco de área
 * proporcional ao seu valor de mercado de hoje. É um retrato do agora: sem
 * eixo de tempo, sem tendência, sem comparação com período anterior (ADR-010).
 *
 * A cor diz o sinal do resultado não realizado, mas nunca sozinha: o bloco
 * carrega o glifo (▲/▼), e a legenda repete ticker, valor, participação e o
 * resultado com sinal e palavra. Quem não distingue as cores lê o mapa inteiro.
 *
 * Cada bloco é focável pelo teclado e revela, em texto, o mesmo detalhe que o
 * ponteiro revelaria; Esc devolve o mapa ao repouso (AC-280).
 */
export interface PosicaoNoMapa {
  ticker: string;
  nomeEmpresa: string;
  /** Valor de mercado da posição, em real. */
  valorDeMercado: number;
  /** Resultado não realizado da posição, em real, com sinal. */
  resultado: number;
}

export interface GraficoMapaPosicoesProps {
  posicoes: PosicaoNoMapa[];
}

type Sinal = 'alta' | 'baixa' | 'estavel';

const GLIFO: Record<Sinal, string> = { alta: '▲', baixa: '▼', estavel: '–' };
const PALAVRA: Record<Sinal, string> = { alta: 'ganho', baixa: 'perda', estavel: 'sem resultado' };
const COR: Record<Sinal, string> = {
  alta: 'var(--cor-alta-bloco)',
  baixa: 'var(--cor-baixa-bloco)',
  estavel: 'var(--cor-estavel-bloco)',
};

/** Abaixo disto o rótulo no bloco não cabe legível; a legenda continua com tudo. */
const LARGURA_MINIMA_ROTULO = 16;
const ALTURA_MINIMA_ROTULO = 12;

const REPOUSO =
  'Passe o ponteiro ou use Tab num bloco para ver ticker, valor de mercado, participação e resultado.';

interface BlocoDesenhado {
  ticker: string;
  nomeEmpresa: string;
  resultado: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  sinal: Sinal;
  glifo: string;
  cor: string;
  valorFormatado: string;
  participacaoFormatada: string;
  rotuloVisivel: boolean;
  detalhe: string;
}

function desenharBlocos(posicoes: PosicaoNoMapa[]): BlocoDesenhado[] {
  const somaMercado = posicoes.reduce((soma, p) => soma + Math.max(p.valorDeMercado, 0), 0);

  return blocosDoMapa(posicoes.map((p) => p.valorDeMercado)).map((bloco) => {
    const posicao = posicoes[bloco.indice];
    const participacao = somaMercado > 0 ? (Math.max(posicao.valorDeMercado, 0) / somaMercado) * 100 : 0;
    const sinal: Sinal = posicao.resultado > 0 ? 'alta' : posicao.resultado < 0 ? 'baixa' : 'estavel';
    const valorFormatado = formatarReal(posicao.valorDeMercado);
    const participacaoFormatada = `${formatarNumero(participacao, 1)}%`;

    return {
      ticker: posicao.ticker,
      nomeEmpresa: posicao.nomeEmpresa,
      resultado: posicao.resultado,
      x: bloco.retangulo.x,
      y: bloco.retangulo.y,
      largura: bloco.retangulo.largura,
      altura: bloco.retangulo.altura,
      sinal,
      glifo: GLIFO[sinal],
      cor: COR[sinal],
      valorFormatado,
      participacaoFormatada,
      rotuloVisivel: bloco.retangulo.largura >= LARGURA_MINIMA_ROTULO && bloco.retangulo.altura >= ALTURA_MINIMA_ROTULO,
      detalhe:
        `${posicao.ticker}, ${posicao.nomeEmpresa}. ` +
        `Valor de mercado ${valorFormatado}, ${participacaoFormatada} da carteira. ` +
        `Resultado: ${PALAVRA[sinal]} de ${formatarReal(Math.abs(posicao.resultado))}.`,
    };
  });
}

const NUMERO = 'font-numero tabular-nums';

export function GraficoMapaPosicoes({ posicoes }: GraficoMapaPosicoesProps) {
  const [blocoAtivo, setBlocoAtivo] = useState<string | null>(null);

  const blocos = desenharBlocos(posicoes);
  const descricaoMapa =
    `Mapa de ${blocos.length} posição(ões) abertas. A área de cada bloco é ` +
    `proporcional ao seu valor de mercado.`;
  const detalhe = blocos.find((bloco) => bloco.ticker === blocoAtivo)?.detalhe ?? REPOUSO;

  function aoEscapar(evento: KeyboardEvent<SVGSVGElement>) {
    if (evento.key !== 'Escape') return;
    setBlocoAtivo(null);
    (evento.target as { blur?: () => void } | null)?.blur?.();
  }

  const repousar = () => setBlocoAtivo(null);

  return (
    <section
      data-grafico-mapa
      className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">
          Mapa de blocos das posições
        </h2>
        <p className="mt-1 mb-0 max-w-(--largura-leitura) text-apoio text-texto-fraco">
          Cada posição aberta é um bloco de área proporcional ao seu valor de mercado, hoje. A cor mostra o sinal do
          resultado; o glifo e a legenda dizem o mesmo.
        </p>
      </header>

      {blocos.length === 0 ? (
        <p data-sem-mapa className="m-0 text-rotulo text-texto-fraco">
          Nenhuma posição aberta para mapear.
        </p>
      ) : (
        <>
          <svg
            data-mapa
            viewBox="0 0 100 100"
            role="group"
            aria-label={descricaoMapa}
            onKeyDown={aoEscapar}
            className="block aspect-square w-full max-w-full overflow-hidden rounded"
          >
            {blocos.map((bloco) => {
              const ativo = blocoAtivo === bloco.ticker;
              const atenuado = blocoAtivo !== null && !ativo;
              return (
                <g
                  key={bloco.ticker}
                  data-bloco
                  data-bloco-ticker={bloco.ticker}
                  data-sinal={bloco.sinal}
                  tabIndex={0}
                  role="img"
                  aria-label={bloco.detalhe}
                  className={cn('group cursor-default outline-none', ativo && 'ativo', atenuado && 'atenuado')}
                  onMouseEnter={() => setBlocoAtivo(bloco.ticker)}
                  onMouseLeave={repousar}
                  onFocus={() => setBlocoAtivo(bloco.ticker)}
                  onBlur={repousar}
                >
                  <rect
                    data-bloco-area
                    x={bloco.x}
                    y={bloco.y}
                    width={bloco.largura}
                    height={bloco.altura}
                    fill={bloco.cor}
                    className={cn(
                      'stroke-superficie [stroke-width:0.6] transition-opacity duration-(--duracao-rapida) ease-saida',
                      'group-focus-visible:stroke-foco group-focus-visible:[stroke-width:1.4]',
                      ativo && 'stroke-foco [stroke-width:1.4]',
                      atenuado && 'opacity-40',
                    )}
                  />
                  {/* O texto vive sobre o preenchimento do bloco, não sobre a superfície do
                      cartão: a cor dele vem do par do bloco, senão fica ilegível. */}
                  {bloco.rotuloVisivel && (
                    <>
                      <text
                        className="pointer-events-none fill-bloco-texto font-sans font-bold"
                        fontSize={3.4}
                        x={bloco.x + 2}
                        y={bloco.y + 6}
                      >
                        {bloco.ticker}
                      </text>
                      {/* Hierarquia por tamanho e peso, não por cor: clarear este texto sobre o
                          bloco derruba o contraste de novo. */}
                      <text
                        aria-hidden="true"
                        className={cn('pointer-events-none fill-bloco-texto', NUMERO)}
                        fontSize={3}
                        fillOpacity={0.82}
                        x={bloco.x + 2}
                        y={bloco.y + 11}
                      >
                        {bloco.glifo} {bloco.participacaoFormatada}
                      </text>
                    </>
                  )}
                </g>
              );
            })}
          </svg>

          <p data-detalhe-mapa aria-live="polite" className="m-0 min-h-6 text-apoio text-texto">
            {detalhe}
          </p>

          <ol data-mapa-legenda aria-label="Legenda do mapa de blocos" className="m-0 grid list-none gap-1 p-0">
            {blocos.map((bloco) => {
              const ativo = blocoAtivo === bloco.ticker;
              const atenuado = blocoAtivo !== null && !ativo;
              return (
                <li
                  key={bloco.ticker}
                  data-mapa-item={bloco.ticker}
                  data-sinal={bloco.sinal}
                  title={bloco.nomeEmpresa}
                  className={cn(
                    'grid min-h-(--alvo-minimo) grid-cols-[12px_minmax(4.5rem,1fr)_8rem_4.5rem_auto] items-center gap-2 rounded px-2 py-1 transition-opacity duration-(--duracao-rapida) ease-saida',
                    'max-sm:grid-cols-[12px_minmax(3.5rem,1fr)_auto] max-sm:gap-y-1',
                    ativo && 'ativo bg-superficie-alta',
                    atenuado && 'atenuado opacity-40',
                  )}
                  onMouseEnter={() => setBlocoAtivo(bloco.ticker)}
                  onMouseLeave={repousar}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: bloco.cor }} />
                  <span data-mapa-ticker className="font-medium">
                    {bloco.ticker}
                  </span>
                  <span data-mapa-valor className={cn(NUMERO, 'text-right text-texto-fraco')}>
                    {bloco.valorFormatado}
                  </span>
                  <span data-mapa-participacao className={cn(NUMERO, 'text-right max-sm:col-[2/-1] max-sm:text-left')}>
                    {bloco.participacaoFormatada}
                  </span>
                  <span data-mapa-resultado className="max-sm:col-[2/-1] max-sm:text-left">
                    <Variacao valor={bloco.resultado} moeda="BRL" />
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
