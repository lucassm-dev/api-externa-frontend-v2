/**
 * Quanto da carteira está nos três maiores ativos. Cálculo puro, sem arco nem
 * DOM: recebe os valores de mercado das posições abertas e devolve a fatia do
 * topo e a faixa em que ela cai.
 *
 * A faixa apenas descreve como o valor está distribuído hoje — o produto não
 * recomenda investimento, então não aprova nem reprova a carteira. Retrato do
 * agora: nada aqui tem eixo de tempo nem comparação com período anterior
 * (ADR-010).
 */
export type FaixaConcentracao = 'dispersa' | 'media' | 'concentrada';

export interface Concentracao {
  /** Fatia da carteira nos três maiores ativos, de 0 a 1. */
  fracaoTopo: number;
  /** A mesma fatia em pontos percentuais, de 0 a 100. */
  percentualTopo: number;
  /** Quantos ativos entraram no topo — 3, ou menos se a carteira for menor. */
  ativosNoTopo: number;
  /** Total de posições com valor de mercado positivo. */
  totalAtivos: number;
  faixa: FaixaConcentracao;
}

/** Abaixo de 40% no topo a carteira está dispersa; de 70% para cima, concentrada. */
const LIMITE_DISPERSA = 40;
const LIMITE_CONCENTRADA = 70;

const ATIVOS_NO_TOPO = 3;

function faixaDe(percentual: number): FaixaConcentracao {
  if (percentual < LIMITE_DISPERSA) return 'dispersa';
  if (percentual < LIMITE_CONCENTRADA) return 'media';
  return 'concentrada';
}

/**
 * `null` quando não há nenhum valor positivo para medir — sem carteira não há
 * concentração, e o bloco diz isso em vez de mostrar 0% como se fosse apurado.
 */
export function concentracaoDaCarteira(valores: readonly number[]): Concentracao | null {
  const validos = valores.filter((valor) => Number.isFinite(valor) && valor > 0);
  if (validos.length === 0) {
    return null;
  }

  const total = validos.reduce((soma, valor) => soma + valor, 0);
  const ordenados = [...validos].sort((a, b) => b - a);
  const topo = ordenados.slice(0, ATIVOS_NO_TOPO);
  const somaTopo = topo.reduce((soma, valor) => soma + valor, 0);

  const fracaoTopo = somaTopo / total;
  const percentualTopo = fracaoTopo * 100;

  return {
    fracaoTopo,
    percentualTopo,
    ativosNoTopo: topo.length,
    totalAtivos: validos.length,
    faixa: faixaDe(percentualTopo),
  };
}
