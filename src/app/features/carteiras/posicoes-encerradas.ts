/**
 * O backend não devolve posição encerrada: vender tudo apaga a linha, e o
 * ativo só sobrevive em `lucro-realizado.porTicker` (PRD-005). O que está no
 * resultado realizado e não tem mais posição aberta é um ativo encerrado —
 * sem isso o investidor conclui que o sistema perdeu o registro.
 */
export interface PosicaoEncerrada {
  ticker: string;
  resultadoRealizado: number;
}

export function posicoesEncerradas(
  porTicker: Record<string, number> | undefined,
  posicoesAbertas: readonly { ticker: string }[],
): PosicaoEncerrada[] {
  const abertos = new Set(posicoesAbertas.map((posicao) => posicao.ticker));

  return Object.entries(porTicker ?? {})
    .filter(([ticker]) => !abertos.has(ticker))
    .map(([ticker, resultadoRealizado]) => ({ ticker, resultadoRealizado }));
}
