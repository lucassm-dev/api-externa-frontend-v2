import { estaDefasado } from '../../core/dados/idade-dado';
import { Posicao } from '../carteiras/carteiras.model';

/**
 * Cada posição tem seu próprio `dataHoraCotacao` e as idades diferem entre si
 * (ADR-005). É o horário MAIS ANTIGO que qualifica a tela inteira: o retrato
 * vale o que vale o pedaço mais velho dele.
 */
export interface IdadeDasCotacoes {
  maisAntiga: string | null;
  tickersDefasados: string[];
}

export function idadeDasCotacoes(posicoes: Posicao[], agora: Date = new Date()): IdadeDasCotacoes {
  let maisAntiga: string | null = null;

  for (const posicao of posicoes) {
    if (maisAntiga === null || new Date(posicao.dataHoraCotacao) < new Date(maisAntiga)) {
      maisAntiga = posicao.dataHoraCotacao;
    }
  }

  return {
    maisAntiga,
    tickersDefasados: posicoes
      .filter((posicao) => estaDefasado(posicao.dataHoraCotacao, agora))
      .map((posicao) => posicao.ticker),
  };
}
