import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { Concentracao, FaixaConcentracao, concentracaoDaCarteira } from './concentracao-da-carteira';

/**
 * "Quão espalhada está a carteira?" — um arco mostra que fatia do valor está nos
 * três maiores ativos, com o percentual grande no centro e a faixa explicada em
 * texto logo abaixo.
 *
 * A faixa descreve a distribuição de hoje; não é recomendação de compra ou
 * venda. Retrato do agora: sem eixo de tempo, sem tendência, sem comparação com
 * período anterior (ADR-010).
 */
export interface PosicaoConcentracao {
  ticker: string;
  valorDeMercado: number;
}

export interface PropsGraficoConcentracao {
  posicoes: PosicaoConcentracao[];
}

interface TextoDaFaixa {
  nome: string;
  explicacao: string;
}

const FAIXAS: Record<FaixaConcentracao, TextoDaFaixa> = {
  dispersa: {
    nome: 'dispersa',
    explicacao:
      'Os três maiores ativos somam menos de 40% da carteira: o valor está espalhado por muitas posições.',
  },
  media: {
    nome: 'média',
    explicacao:
      'Os três maiores ativos somam entre 40% e 70% da carteira: parte relevante do valor está em poucas posições.',
  },
  concentrada: {
    nome: 'concentrada',
    explicacao:
      'Os três maiores ativos somam 70% ou mais da carteira: a maior parte do valor está em poucas posições.',
  },
};

const RAIO = 40;
const CENTRO_X = 50;
const BASE_Y = 52;

interface PontoDoArco {
  x: number;
  y: number;
}

function ponto(fracao: number, raio: number): PontoDoArco {
  const angulo = Math.PI * (1 - fracao);
  return {
    x: CENTRO_X + raio * Math.cos(angulo),
    y: BASE_Y - raio * Math.sin(angulo),
  };
}

function arco(fracao: number, raio = RAIO): string {
  const inicio = ponto(0, raio);
  const fim = ponto(Math.max(0, Math.min(1, fracao)), raio);
  return `M ${inicio.x} ${inicio.y} A ${raio} ${raio} 0 0 1 ${fim.x} ${fim.y}`;
}

const TRILHA = arco(1);

export function GraficoConcentracao({ posicoes }: PropsGraficoConcentracao) {
  const c = concentracaoDaCarteira(posicoes.map((posicao) => posicao.valorDeMercado));

  return (
    <section
      data-grafico-concentracao
      className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <header>
        <h2 className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">Concentração da carteira</h2>
        <p className="mt-1 mb-0 max-w-(--largura-leitura) text-apoio text-texto-fraco">
          Que fatia do valor está nos seus três maiores ativos, hoje. Descreve como a carteira está distribuída —
          não é recomendação de compra ou venda.
        </p>
      </header>

      {c ? (
        <Medicao c={c} posicoes={posicoes} />
      ) : (
        <p data-sem-concentracao className="m-0 text-apoio text-texto-fraco">
          Nenhuma posição aberta para medir.
        </p>
      )}
    </section>
  );
}

function Medicao({ c, posicoes }: { c: Concentracao; posicoes: PosicaoConcentracao[] }) {
  const percentualFormatado = `${formatarNumero(c.percentualTopo, 1)}%`;
  const faixa = FAIXAS[c.faixa];
  const resumo =
    `${percentualFormatado} da carteira está nos seus ${c.ativosNoTopo} maiores ` +
    `${c.ativosNoTopo === 1 ? 'ativo' : 'ativos'}.`;

  const total = posicoes.reduce((soma, posicao) => soma + Math.max(posicao.valorDeMercado, 0), 0);
  const maiores = [...posicoes]
    .filter((posicao) => posicao.valorDeMercado > 0)
    .sort((a, b) => b.valorDeMercado - a.valorDeMercado)
    .slice(0, c.ativosNoTopo)
    .map((posicao) => ({
      ticker: posicao.ticker,
      valorFormatado: formatarReal(posicao.valorDeMercado),
      participacaoFormatada:
        total > 0 ? `${formatarNumero((posicao.valorDeMercado / total) * 100, 1)}%` : '0,0%',
    }));

  return (
    <>
      <div className="flex justify-center">
        <svg viewBox="0 0 100 58" role="img" aria-label={resumo} className="block h-auto w-full max-w-72">
          <path d={TRILHA} fill="none" strokeWidth={8} strokeLinecap="round" className="stroke-superficie-alta" />
          {/* Acento, e não destaque: no tema claro o amarelo puro some sobre a superfície. */}
          <path
            data-arco-preenchido
            d={arco(c.fracaoTopo)}
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            className="stroke-acento"
          />
          <text
            data-concentracao-percentual
            x="50"
            y="46"
            textAnchor="middle"
            fontSize={16}
            className="fill-texto font-numero font-bold tabular-nums"
          >
            {percentualFormatado}
          </text>
        </svg>
      </div>

      <p data-concentracao-resumo className="m-0 text-center text-medio">
        {resumo}
      </p>

      <p data-concentracao-faixa className="m-0 text-apoio text-texto-fraco">
        <span className="font-medium text-texto">Carteira {faixa.nome}.</span> {faixa.explicacao}
      </p>

      <ol
        data-concentracao-maiores
        aria-label="Os três maiores ativos da carteira"
        className="m-0 grid list-none gap-1 p-0"
      >
        {maiores.map((ativo) => (
          <li
            key={ativo.ticker}
            data-concentracao-item={ativo.ticker}
            className="grid grid-cols-[minmax(4rem,1fr)_8rem_4.5rem] items-center gap-2 rounded bg-superficie-alta px-2 py-1 max-sm:grid-cols-[1fr_auto] max-sm:gap-y-1"
          >
            <span className="font-medium">{ativo.ticker}</span>
            <span className="text-right font-numero text-texto-fraco tabular-nums">{ativo.valorFormatado}</span>
            <span className="text-right font-numero text-texto-fraco tabular-nums max-sm:col-start-2">
              {ativo.participacaoFormatada}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
