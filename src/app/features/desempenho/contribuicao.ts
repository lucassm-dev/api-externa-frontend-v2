import { Posicao } from '../carteiras/carteiras.model';
import { MapaDeMoedas, MoedaDaPosicao, moedaDe, paraReal } from './moeda-das-posicoes';

/**
 * "Quem está puxando o resultado?" — o não realizado de cada posição, do maior
 * ganho à maior perda. Mesma atenção à moeda da composição: um resultado em
 * dólar plotado ao lado de um em real inverte a ordem das barras.
 */
export interface BarraDeContribuicao {
  ticker: string;
  nomeEmpresa: string;
  valor: number;
  moedaOriginal: MoedaDaPosicao;
  convertido: boolean;
}

export function contribuicaoPorAtivo(
  posicoes: Posicao[],
  mapa: MapaDeMoedas,
  taxaCambio: number,
): BarraDeContribuicao[] {
  return posicoes
    .map((posicao) => {
      const moedaOriginal = moedaDe(posicao.ticker, mapa);
      const emReal = paraReal(posicao.rentabilidadeNaoRealizada, moedaOriginal, taxaCambio);
      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        valor: emReal.valor,
        moedaOriginal,
        convertido: emReal.convertido,
      };
    })
    .sort((uma, outra) => outra.valor - uma.valor);
}
