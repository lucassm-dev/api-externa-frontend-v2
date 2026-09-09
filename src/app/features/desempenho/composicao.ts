import { ConsolidadoDaCarteira, Posicao } from '../carteiras/carteiras.model';
import { MapaDeMoedas, MoedaDaPosicao, moedaDe, paraReal } from './moeda-das-posicoes';

/**
 * A distribuição do valor de mercado entre os ativos — "estou concentrado
 * demais em alguma coisa?". Cada posição é convertida para real ANTES de
 * compor: plotar uma posição em dólar ao lado de uma em real produz uma
 * composição errada, e o erro é silencioso.
 *
 * A conferência com `valorDeMercado` do consolidado é parte do resultado, não
 * um detalhe: é ela que pega a conversão esquecida.
 */
export interface FatiaDaComposicao {
  ticker: string;
  nomeEmpresa: string;
  valor: number;
  participacao: number;
  moedaOriginal: MoedaDaPosicao;
  convertido: boolean;
}

export interface Composicao {
  fatias: FatiaDaComposicao[];
  soma: number;
  valorDeMercado: number;
  diferenca: number;
  fecha: boolean;
}

/** Meio ponto percentual absorve arredondamento do backend, nada além disso. */
export const TOLERANCIA_COMPOSICAO = 0.005;

export function composicaoDaCarteira(
  posicoes: Posicao[],
  mapa: MapaDeMoedas,
  consolidado: ConsolidadoDaCarteira,
): Composicao {
  const convertidas = posicoes
    .map((posicao) => {
      const moedaOriginal = moedaDe(posicao.ticker, mapa);
      const emReal = paraReal(
        posicao.quantidade * posicao.cotacaoAtual,
        moedaOriginal,
        consolidado.taxaCambioAtual,
      );
      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        valor: emReal.valor,
        moedaOriginal,
        convertido: emReal.convertido,
      };
    })
    .filter((fatia) => fatia.valor > 0)
    .sort((uma, outra) => outra.valor - uma.valor);

  const soma = convertidas.reduce((total, fatia) => total + fatia.valor, 0);
  const valorDeMercado = consolidado.valorDeMercado;
  const diferenca = soma - valorDeMercado;
  const referencia = Math.abs(valorDeMercado);

  return {
    fatias: convertidas.map((fatia) => ({
      ...fatia,
      participacao: soma === 0 ? 0 : (fatia.valor / soma) * 100,
    })),
    soma,
    valorDeMercado,
    diferenca,
    fecha: referencia === 0 ? soma === 0 : Math.abs(diferenca) / referencia <= TOLERANCIA_COMPOSICAO,
  };
}
