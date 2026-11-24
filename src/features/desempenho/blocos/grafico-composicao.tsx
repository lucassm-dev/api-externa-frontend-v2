import { useState } from 'react';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Composicao, FatiaDaComposicao } from '../composicao';
import { setoresDaRosca } from './setores-da-rosca';

/**
 * "Estou concentrado demais em alguma coisa?" — barras ordenadas da maior
 * fatia à menor, cada uma com ticker, valor e participação em texto. A cor
 * identifica o ativo; nunca é a única forma de ler a fatia.
 *
 * Retrato do agora: não há eixo de tempo aqui, e não pode haver — o sistema
 * não guarda série histórica (ADR-010).
 *
 * Quando a soma das fatias não fecha com o valor de mercado do consolidado, o
 * gráfico continua visível mas confessa: uma composição que não bate com o
 * total é bonita e mentirosa se não disser nada.
 */
export interface PropsGraficoComposicao {
  composicao: Composicao;
}

interface FatiaDesenhada {
  ticker: string;
  nomeEmpresa: string;
  valor: number;
  participacao: number;
  cor: string;
  valorFormatado: string;
  participacaoFormatada: string;
  caminho: string;
}

const CORES_DE_SERIE = 8;

function agruparCauda(fatias: FatiaDaComposicao[]): FatiaDaComposicao[] {
  if (fatias.length <= CORES_DE_SERIE) {
    return fatias;
  }

  const principais = fatias.slice(0, CORES_DE_SERIE);
  const cauda = fatias.slice(CORES_DE_SERIE);
  return [
    ...principais,
    {
      ticker: 'DEMAIS',
      nomeEmpresa: `${cauda.length} ativo${cauda.length === 1 ? '' : 's'} agrupado${cauda.length === 1 ? '' : 's'}`,
      valor: cauda.reduce((soma, fatia) => soma + fatia.valor, 0),
      participacao: cauda.reduce((soma, fatia) => soma + fatia.participacao, 0),
      moedaOriginal: 'BRL',
      convertido: cauda.every((fatia) => fatia.convertido),
    },
  ];
}

function desenhar(composicao: Composicao): FatiaDesenhada[] {
  const fatias = agruparCauda(composicao.fatias);
  const setores = setoresDaRosca(fatias.map((fatia) => fatia.participacao));

  return fatias.map((fatia, indice) => ({
    ticker: fatia.ticker,
    nomeEmpresa: fatia.nomeEmpresa,
    valor: fatia.valor,
    participacao: fatia.participacao,
    cor: indice < CORES_DE_SERIE ? `var(--cor-serie-${indice + 1})` : 'var(--cor-serie-resto)',
    valorFormatado: formatarReal(fatia.valor),
    participacaoFormatada: `${formatarNumero(fatia.participacao, 1)}%`,
    caminho: setores.find((setor) => setor.indice === indice)?.caminho ?? '',
  }));
}

function ressalvaDe(composicao: Composicao): string | null {
  if (composicao.fecha) {
    return null;
  }
  const semMoeda = composicao.fatias.filter((fatia) => !fatia.convertido).map((f) => f.ticker);
  const diferenca = formatarReal(Math.abs(composicao.diferenca));
  const detalhe = semMoeda.length
    ? ` A moeda de ${semMoeda.join(', ')} não foi encontrada no catálogo de ações, então esses valores não foram convertidos.`
    : '';
  return (
    `A soma das fatias (${formatarReal(composicao.soma)}) não fecha com o valor de mercado ` +
    `da carteira (${formatarReal(composicao.valorDeMercado)}): diferença de ${diferenca}.` +
    `${detalhe} Leia a composição com essa ressalva.`
  );
}

// Setor e linha da legenda acendem juntos; o resto recua sem sumir.
const DESTAQUE = 'transition-[opacity,scale,stroke-width,background-color] duration-(--duracao-rapida) ease-saida';

export function GraficoComposicao({ composicao }: PropsGraficoComposicao) {
  const [fatiaAtiva, setFatiaAtiva] = useState<string | null>(null);

  const fatias = desenhar(composicao);
  const valorDeMercado = formatarReal(composicao.valorDeMercado);
  const descricaoRosca = `Composição da carteira em ${fatias.length} setores. Valor de mercado ${valorDeMercado}.`;
  const ressalva = ressalvaDe(composicao);

  const destacar = (ticker: string) => setFatiaAtiva(ticker);
  const limparDestaque = (ticker: string) => setFatiaAtiva((atual) => (atual === ticker ? null : atual));
  const ativa = (ticker: string) => fatiaAtiva === ticker;
  const atenuada = (ticker: string) => fatiaAtiva !== null && fatiaAtiva !== ticker;

  return (
    <section
      data-grafico-composicao
      className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Composição da carteira</h2>
        <p className="mt-1 mb-0 max-w-(--largura-leitura) text-apoio text-texto-fraco">
          Como o valor de mercado de hoje está distribuído entre os ativos. Retrato do agora, não uma linha do
          tempo.
        </p>
      </header>

      {ressalva && (
        <div data-ressalva-composicao>
          <MensagemFeedback nivel="aviso" mensagem={ressalva} />
        </div>
      )}

      {fatias.length === 0 ? (
        <p data-sem-composicao className="m-0 text-apoio text-texto-fraco">
          Nenhuma posição aberta para compor.
        </p>
      ) : (
        <>
          <div className="grid items-center gap-4 md:grid-cols-[minmax(220px,0.7fr)_minmax(320px,1.3fr)] lg:grid-cols-[minmax(240px,0.8fr)_minmax(340px,1.2fr)] lg:gap-8">
            <div className="mx-auto aspect-square w-[min(100%,320px)]">
              <svg
                data-rosca-composicao
                viewBox="0 0 120 120"
                role="img"
                aria-label={descricaoRosca}
                className="block size-full overflow-visible"
              >
                <title>{descricaoRosca}</title>
                {fatias.map((fatia) => (
                  <path
                    key={fatia.ticker}
                    data-fatia-setor
                    data-setor={fatia.ticker}
                    d={fatia.caminho}
                    aria-hidden="true"
                    style={{ fill: fatia.cor }}
                    className={cn(
                      'origin-[60px_60px] stroke-superficie stroke-[1.5]',
                      DESTAQUE,
                      ativa(fatia.ticker) && 'ativa scale-[1.025] stroke-[2.5]',
                      atenuada(fatia.ticker) && 'atenuada opacity-[0.38]',
                    )}
                    onMouseEnter={() => destacar(fatia.ticker)}
                    onMouseLeave={() => limparDestaque(fatia.ticker)}
                  />
                ))}
                <g aria-hidden="true" fontSize={5} className="fill-texto-fraco font-sans">
                  <text x="60" y="56" textAnchor="middle">
                    Valor de mercado
                  </text>
                  <text
                    x="60"
                    y="68"
                    textAnchor="middle"
                    fontSize={6}
                    className="fill-texto font-numero font-bold tabular-nums"
                  >
                    {valorDeMercado}
                  </text>
                </g>
              </svg>
            </div>

            <ol aria-label="Legenda da composição" className="m-0 grid list-none gap-1 p-0">
              {fatias.map((fatia) => (
                <li
                  key={fatia.ticker}
                  data-fatia={fatia.ticker}
                  title={fatia.nomeEmpresa}
                  className={cn(
                    'grid min-h-8 grid-cols-[12px_minmax(4rem,1fr)_4.5rem_minmax(6.5rem,8rem)] items-center gap-2 rounded px-2 py-1',
                    DESTAQUE,
                    ativa(fatia.ticker) && 'ativa bg-superficie-alta',
                    atenuada(fatia.ticker) && 'atenuada opacity-[0.38]',
                  )}
                  onMouseEnter={() => destacar(fatia.ticker)}
                  onMouseLeave={() => limparDestaque(fatia.ticker)}
                >
                  <span aria-hidden="true" style={{ background: fatia.cor }} className="size-2.5 rounded-pilula" />
                  <span data-fatia-ticker className="truncate font-semibold">
                    {fatia.ticker}
                  </span>
                  <span data-fatia-participacao className="text-right tabular-nums">
                    {fatia.participacaoFormatada}
                  </span>
                  <span data-fatia-valor className="text-right text-texto-fraco tabular-nums">
                    {fatia.valorFormatado}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <p data-soma-composicao className="m-0 text-apoio text-texto-fraco">
            Soma das fatias: {formatarReal(composicao.soma)}
          </p>
        </>
      )}
    </section>
  );
}
