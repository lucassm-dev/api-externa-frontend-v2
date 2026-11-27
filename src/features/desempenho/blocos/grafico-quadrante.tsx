import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Variacao } from '@/shared/variacao';

/**
 * "Quem pesa e quem rende?" — cada posição aberta é uma bolha: o eixo horizontal
 * é a participação na carteira, o vertical é a rentabilidade, e o tamanho da
 * bolha é o valor de mercado. O canto de baixo à direita — participação alta,
 * rentabilidade negativa — é o peso morto, e o quadrante deixa isso visível.
 *
 * É um retrato do agora: sem eixo de tempo, sem tendência, sem comparação com
 * período anterior — o produto não guarda série histórica (ADR-010).
 *
 * Cada bolha é focável pelo teclado e revela, em texto, o mesmo detalhe que o
 * ponteiro revelaria; Esc devolve o quadrante ao repouso (AC-280).
 */
export interface PosicaoNoQuadrante {
  ticker: string;
  nomeEmpresa: string;
  /** Valor de mercado da posição, em real. Define a participação e o tamanho da bolha. */
  valorDeMercado: number;
  /** Rentabilidade da posição, em pontos percentuais, com sinal. */
  rentabilidade: number;
}

export interface GraficoQuadranteProps {
  posicoes: PosicaoNoQuadrante[];
}

type Sinal = 'alta' | 'baixa' | 'estavel';

// As cores de bloco do mapa: o par com --cor-bloco-texto tem contraste testado nos dois temas.
const COR: Record<Sinal, string> = {
  alta: 'var(--cor-alta-bloco)',
  baixa: 'var(--cor-baixa-bloco)',
  estavel: 'var(--cor-estavel-bloco)',
};

/** Largura do viewBox, para converter px de tela em unidade do desenho. */
const LARGURA_VIEWBOX = 106;

/**
 * Texto em SVG cresce com o desenho: no desktop o rótulo de eixo saía com mais de
 * 20px e no celular com menos de 9px. Medindo a largura real, cada rótulo fica com
 * o mesmo tamanho em px em qualquer tela; sem medida (teste, primeiro quadro), vale o padrão.
 */
function useTamanhoEmUnidades(ativo: boolean) {
  const ref = useRef<SVGSVGElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const svg = ref.current;
    if (!svg || typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(svg);
    return () => observador.disconnect();
  }, [ativo]);

  const emUnidades = (px: number, padrao: number) => (largura > 0 ? (px * LARGURA_VIEWBOX) / largura : padrao);
  return { ref, emUnidades };
}

/** Moldura do desenho, em unidades do viewBox 0..100. */
const MOLDURA = { x0: 16, largura: 80, yTopo: 6, altura: 82 } as const;
const Y_ZERO = MOLDURA.yTopo + MOLDURA.altura / 2;
const Y_BASE = MOLDURA.yTopo + MOLDURA.altura;
const X_FIM = MOLDURA.x0 + MOLDURA.largura;

const RAIO_MINIMO = 2.5;
const RAIO_MAXIMO = 9;

/** Acima disto a bolha comporta o ticker legível; abaixo, só a legenda o traz. */
const RAIO_ROTULO = 5;

const REPOUSO =
  'Passe o ponteiro ou use Tab numa bolha para ver participação na carteira, rentabilidade e valor de mercado.';

interface BolhaDesenhada {
  ticker: string;
  nomeEmpresa: string;
  rentabilidade: number;
  cx: number;
  cy: number;
  r: number;
  sinal: Sinal;
  cor: string;
  participacaoFormatada: string;
  rentabilidadeFormatada: string;
  valorFormatado: string;
  rotuloVisivel: boolean;
  detalhe: string;
}

/**
 * Bolhas sobrepostas ficam na posição real (mover mentiria sobre participação ou
 * rentabilidade); só a maior de cada sobreposição escreve o ticker dentro de si,
 * e as outras seguem na lista e no detalhe por ponteiro ou foco (AC-388).
 */
function semRotulosSobrepostos(bolhas: BolhaDesenhada[]): BolhaDesenhada[] {
  const rotuladas: BolhaDesenhada[] = [];
  for (const bolha of [...bolhas].sort((uma, outra) => outra.r - uma.r)) {
    if (!bolha.rotuloVisivel) continue;
    if (rotuladas.some((outra) => Math.hypot(outra.cx - bolha.cx, outra.cy - bolha.cy) < outra.r + bolha.r)) bolha.rotuloVisivel = false;
    else rotuladas.push(bolha);
  }
  return bolhas;
}

function desenharBolhas(posicoes: PosicaoNoQuadrante[]): BolhaDesenhada[] {
  const somaMercado = posicoes.reduce((soma, p) => soma + Math.max(p.valorDeMercado, 0), 0);
  const maxParticipacao =
    somaMercado > 0 ? Math.max(...posicoes.map((p) => Math.max(p.valorDeMercado, 0) / somaMercado)) * 100 : 0;
  const maxRentabilidade = Math.max(...posicoes.map((p) => Math.abs(p.rentabilidade)), 0);
  const maxValor = Math.max(...posicoes.map((p) => Math.max(p.valorDeMercado, 0)), 0);

  return semRotulosSobrepostos(posicoes.map((posicao) => {
    const participacao = somaMercado > 0 ? (Math.max(posicao.valorDeMercado, 0) / somaMercado) * 100 : 0;
    const sinal: Sinal = posicao.rentabilidade > 0 ? 'alta' : posicao.rentabilidade < 0 ? 'baixa' : 'estavel';
    const prefixo = posicao.rentabilidade > 0 ? '+' : posicao.rentabilidade < 0 ? '−' : '';

    const cx = MOLDURA.x0 + (maxParticipacao === 0 ? 0 : (participacao / maxParticipacao) * MOLDURA.largura);
    const cy = Y_ZERO - (maxRentabilidade === 0 ? 0 : (posicao.rentabilidade / maxRentabilidade) * (MOLDURA.altura / 2));
    const r =
      RAIO_MINIMO +
      (maxValor === 0 ? 0 : Math.sqrt(Math.max(posicao.valorDeMercado, 0) / maxValor) * (RAIO_MAXIMO - RAIO_MINIMO));

    const participacaoFormatada = `${formatarNumero(participacao, 1)}%`;
    const rentabilidadeFormatada = `${prefixo}${formatarNumero(Math.abs(posicao.rentabilidade), 2)}%`;
    const valorFormatado = formatarReal(posicao.valorDeMercado);

    return {
      ticker: posicao.ticker,
      nomeEmpresa: posicao.nomeEmpresa,
      rentabilidade: posicao.rentabilidade,
      cx,
      cy,
      r,
      sinal,
      cor: COR[sinal],
      participacaoFormatada,
      rentabilidadeFormatada,
      valorFormatado,
      rotuloVisivel: r >= RAIO_ROTULO,
      detalhe:
        `${posicao.ticker}, ${posicao.nomeEmpresa}. ` +
        `Participação ${participacaoFormatada} da carteira. ` +
        `Rentabilidade ${rentabilidadeFormatada}. ` +
        `Valor de mercado ${valorFormatado}.`,
    };
  }));
}

const TICK = 'fill-texto-fraco font-numero tabular-nums';
const ROTULO_EIXO = 'fill-texto-fraco font-sans tracking-(--entrelinha-rotulo)';
const ROTULO_LINHA = 'mr-1 text-rotulo tracking-(--entrelinha-rotulo) text-texto-fraco';
const NUMERO = 'font-numero tabular-nums';

export function GraficoQuadrante({ posicoes }: GraficoQuadranteProps) {
  const [bolhaAtiva, setBolhaAtiva] = useState<string | null>(null);

  const bolhas = desenharBolhas(posicoes);
  const { ref, emUnidades } = useTamanhoEmUnidades(bolhas.length > 0);
  const tick = emUnidades(11, 3);
  const tituloEixo = emUnidades(13, 3.4);

  // Rótulos de ponta dos eixos, para dar leitura de grandeza ao desenho.
  const soma = posicoes.reduce((s, p) => s + Math.max(p.valorDeMercado, 0), 0);
  const escalaParticipacao = `${formatarNumero(
    soma > 0 ? Math.max(...posicoes.map((p) => Math.max(p.valorDeMercado, 0) / soma)) * 100 : 0,
    1,
  )}%`;
  const escalaRentabilidade = `${formatarNumero(Math.max(...posicoes.map((p) => Math.abs(p.rentabilidade)), 0), 2)}%`;

  const descricao =
    `Quadrante de ${bolhas.length} posição(ões) abertas. O eixo horizontal é a ` +
    `participação na carteira; o vertical, a rentabilidade. O tamanho da bolha é o valor de mercado.`;

  const detalhe = bolhas.find((bolha) => bolha.ticker === bolhaAtiva)?.detalhe ?? REPOUSO;

  function aoEscapar(evento: KeyboardEvent<SVGSVGElement>) {
    if (evento.key !== 'Escape') return;
    setBolhaAtiva(null);
    (evento.target as { blur?: () => void } | null)?.blur?.();
  }

  const repousar = () => setBolhaAtiva(null);

  return (
    <section
      data-grafico-quadrante
      className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">
          Quadrante participação × rentabilidade
        </h2>
        <p className="mt-1 mb-0 max-w-(--largura-leitura) text-apoio text-texto-fraco">
          Onde cada ativo pesa na carteira e como está rendendo. Bolha grande e à direita da linha zero, mas abaixo
          dela, é peso que não está pagando.
        </p>
      </header>

      {bolhas.length === 0 ? (
        <p data-sem-quadrante className="m-0 text-rotulo text-texto-fraco">
          Nenhuma posição aberta para posicionar.
        </p>
      ) : (
        <>
          <svg
            ref={ref}
            data-quadrante
            // Folga de RAIO_MAXIMO além da moldura: a maior bolha, no canto da escala, sai inteira.
            viewBox="0 -4 106 106"
            role="group"
            aria-label={descricao}
            onKeyDown={aoEscapar}
            className="block aspect-square w-full max-w-full overflow-visible"
          >
            <line
              aria-hidden="true"
              className="stroke-grafico-eixo"
              strokeWidth={0.4}
              x1={MOLDURA.x0}
              y1={Y_BASE}
              x2={X_FIM}
              y2={Y_BASE}
            />
            <line
              aria-hidden="true"
              className="stroke-grafico-eixo"
              strokeWidth={0.4}
              x1={MOLDURA.x0}
              y1={MOLDURA.yTopo}
              x2={MOLDURA.x0}
              y2={Y_BASE}
            />

            <line
              data-linha-zero
              aria-hidden="true"
              className="stroke-texto-fraco"
              strokeWidth={0.6}
              strokeDasharray="2 1.5"
              x1={MOLDURA.x0}
              y1={Y_ZERO}
              x2={X_FIM}
              y2={Y_ZERO}
            />
            <text aria-hidden="true" className={TICK} fontSize={tick} textAnchor="end" x={MOLDURA.x0 - 2} y={Y_ZERO + 1.5}>
              0%
            </text>

            <text aria-hidden="true" className={TICK} fontSize={tick} textAnchor="end" x={MOLDURA.x0 - 2} y={MOLDURA.yTopo + 2}>
              +{escalaRentabilidade}
            </text>
            <text aria-hidden="true" className={TICK} fontSize={tick} textAnchor="end" x={MOLDURA.x0 - 2} y={Y_BASE}>
              −{escalaRentabilidade}
            </text>
            <text aria-hidden="true" className={TICK} fontSize={tick} textAnchor="end" x={X_FIM} y={Y_BASE + 5}>
              {escalaParticipacao}
            </text>

            <text
              data-eixo-x
              className={ROTULO_EIXO}
              fontSize={tituloEixo}
              textAnchor="middle"
              x={MOLDURA.x0 + MOLDURA.largura / 2}
              y={98}
            >
              Participação na carteira
            </text>
            {/* Acima do eixo, e não girado na margem: a margem esquerda é das marcas de escala. */}
            <text data-eixo-y className={ROTULO_EIXO} fontSize={tituloEixo} x={MOLDURA.x0} y={MOLDURA.yTopo - 3}>
              Rentabilidade
            </text>

            {/* Da menor para a maior: no SVG quem vem depois cobre, e o rótulo fica na maior (AC-388). */}
            {[...bolhas].sort((uma, outra) => uma.r - outra.r).map((bolha) => {
              const ativa = bolhaAtiva === bolha.ticker;
              const atenuada = bolhaAtiva !== null && !ativa;
              return (
                <g
                  key={bolha.ticker}
                  data-bolha
                  data-bolha-ticker={bolha.ticker}
                  data-sinal={bolha.sinal}
                  tabIndex={0}
                  role="img"
                  aria-label={bolha.detalhe}
                  className={cn('group cursor-default outline-none', ativa && 'ativo', atenuada && 'atenuado')}
                  onMouseEnter={() => setBolhaAtiva(bolha.ticker)}
                  onMouseLeave={repousar}
                  onFocus={() => setBolhaAtiva(bolha.ticker)}
                  onBlur={repousar}
                >
                  <circle
                    data-bolha-area
                    cx={bolha.cx}
                    cy={bolha.cy}
                    r={bolha.r}
                    fill={bolha.cor}
                    className={cn(
                      'stroke-superficie [stroke-width:0.6] [fill-opacity:0.85] transition-opacity duration-(--duracao-rapida) ease-saida',
                      'group-focus-visible:stroke-foco group-focus-visible:[stroke-width:1.4] group-focus-visible:[fill-opacity:1]',
                      ativa && 'stroke-foco [stroke-width:1.4] [fill-opacity:1]',
                      atenuada && 'opacity-35',
                    )}
                  />
                  {bolha.rotuloVisivel && (
                    <text
                      aria-hidden="true"
                      className="pointer-events-none fill-bloco-texto font-sans font-bold"
                      fontSize={3}
                      textAnchor="middle"
                      x={bolha.cx}
                      y={bolha.cy + 1}
                    >
                      {bolha.ticker}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <p data-detalhe-quadrante aria-live="polite" className="m-0 min-h-6 text-apoio text-texto">
            {detalhe}
          </p>

          <ol data-quadrante-texto aria-label="Participação e rentabilidade por ativo" className="m-0 grid list-none gap-1 p-0">
            {bolhas.map((bolha) => {
              const ativa = bolhaAtiva === bolha.ticker;
              const atenuada = bolhaAtiva !== null && !ativa;
              return (
                <li
                  key={bolha.ticker}
                  data-quadrante-item={bolha.ticker}
                  data-sinal={bolha.sinal}
                  title={bolha.nomeEmpresa}
                  className={cn(
                    'grid min-h-(--alvo-minimo) grid-cols-[12px_minmax(4.5rem,1fr)_6rem_auto_8rem] items-center gap-2 rounded px-2 py-1 transition-opacity duration-(--duracao-rapida) ease-saida',
                    'max-sm:grid-cols-[12px_minmax(3.5rem,1fr)_auto] max-sm:gap-y-1',
                    ativa && 'ativo bg-superficie-alta',
                    atenuada && 'atenuado opacity-40',
                  )}
                  onMouseEnter={() => setBolhaAtiva(bolha.ticker)}
                  onMouseLeave={repousar}
                >
                  <span aria-hidden="true" className="size-2.5 rounded-[3px]" style={{ background: bolha.cor }} />
                  <span data-quadrante-ticker className="font-medium">
                    {bolha.ticker}
                  </span>
                  <span data-quadrante-participacao className={NUMERO}>
                    <span aria-hidden="true" className={ROTULO_LINHA}>
                      peso
                    </span>
                    {bolha.participacaoFormatada}
                  </span>
                  <span data-quadrante-rentabilidade className={cn(NUMERO, 'max-sm:col-start-2')}>
                    <span aria-hidden="true" className={ROTULO_LINHA}>
                      rende
                    </span>
                    <Variacao valor={bolha.rentabilidade} percentual />
                  </span>
                  <span
                    data-quadrante-valor
                    className={cn(NUMERO, 'text-right text-texto-fraco')}
                  >
                    {bolha.valorFormatado}
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
