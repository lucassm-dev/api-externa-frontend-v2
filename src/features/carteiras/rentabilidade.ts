/**
 * O backend manda a rentabilidade não realizada em valor; o percentual é sobre
 * o custo da posição. Custo zero não vira infinito: sem custo não há
 * percentual que signifique algo.
 */
export function percentualNaoRealizado(posicao: {
  precoMedio: number;
  quantidade: number;
  rentabilidadeNaoRealizada: number;
}): number | null {
  const custo = posicao.precoMedio * posicao.quantidade;
  return custo === 0 ? null : (posicao.rentabilidadeNaoRealizada / custo) * 100;
}
