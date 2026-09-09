import { Moeda } from '../../core/formatacao/formatacao';
import { Acao } from '../acoes/acoes.model';

/**
 * `GET /carteiras/{id}/posicoes` não devolve a moeda da linha, e os valores
 * chegam na moeda da ação: uma posição americana vem em dólar (ASM-044). Somar
 * ou plotar isso ao lado de uma posição em real produz um número errado com
 * cara de certo — o gráfico fica bonito e mente.
 *
 * A moeda vem do catálogo de ações, casada por ticker (ASM-045). Ticker que o
 * catálogo não conhece é `desconhecida`: o valor sai sem conversão e marcado,
 * para a tela confessar a divergência em vez de converter no escuro (ASM-048).
 */
export type MoedaDaPosicao = Moeda | 'desconhecida';

export type MapaDeMoedas = Record<string, MoedaDaPosicao>;

export function mapaDeMoedas(acoes: Acao[]): MapaDeMoedas {
  const mapa: MapaDeMoedas = {};
  for (const acao of acoes) {
    mapa[acao.ticker] = acao.moeda;
  }
  return mapa;
}

export function moedaDe(ticker: string, mapa: MapaDeMoedas): MoedaDaPosicao {
  return mapa[ticker] ?? 'desconhecida';
}

export interface ValorEmReal {
  valor: number;
  moedaOriginal: MoedaDaPosicao;
  convertido: boolean;
}

/**
 * Real passa direto. Dólar multiplica pela taxa do consolidado — a mesma que a
 * tela exibe com o horário (ADR-004, ADR-005). Sem taxa utilizável não há
 * conversão possível: o valor sai como veio e `convertido` diz que não fecha.
 */
export function paraReal(
  valor: number,
  moedaOriginal: MoedaDaPosicao,
  taxaCambio: number,
): ValorEmReal {
  if (moedaOriginal === 'BRL') {
    return { valor, moedaOriginal, convertido: true };
  }
  if (moedaOriginal === 'USD' && taxaCambio > 0) {
    return { valor: valor * taxaCambio, moedaOriginal, convertido: true };
  }
  return { valor, moedaOriginal, convertido: false };
}
