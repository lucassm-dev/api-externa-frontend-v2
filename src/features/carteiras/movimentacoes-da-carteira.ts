import { ExtratoBuscado, MovimentacaoDoExtrato } from './carteiras.model';

/**
 * `GET /operacoes` é global e não aceita filtro por carteira (ADR-010), então
 * o recorte é do cliente. `parcial` é a parte que não pode faltar: filtrar só
 * o que foi carregado e apresentar como completo faz o investidor procurar em
 * vão por um lançamento que existe.
 */
export interface RecorteDeMovimentacoes {
  movimentacoes: MovimentacaoDoExtrato[];
  parcial: boolean;
  buscadas: number;
}

export function recortarPorCarteira(
  extrato: ExtratoBuscado,
  carteiraId: number,
): RecorteDeMovimentacoes {
  return {
    movimentacoes: extrato.itens.filter(
      (movimentacao) => movimentacao.carteiraId === carteiraId,
    ),
    parcial: extrato.totalNoServidor > extrato.buscadas,
    buscadas: extrato.buscadas,
  };
}
