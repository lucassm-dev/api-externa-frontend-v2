import { Posicao } from '../carteiras/carteiras.model';

/**
 * Uma ação que pode ser vendida na carteira escolhida, com o quanto existe
 * dela. A lista sai das posições da carteira (ASM-042): ação sem posição
 * simplesmente não entra, e é isso que previne OPE-003 antes de o erro existir.
 */
export interface AcaoVendavel {
  ticker: string;
  nomeEmpresa: string;
  quantidadeDisponivel: number;
  cotacaoAtual: number;
  dataHoraCotacao: string;
}

export function acoesVendaveis(posicoes: Posicao[]): AcaoVendavel[] {
  return posicoes
    .filter((posicao) => posicao.quantidade > 0)
    .map((posicao) => ({
      ticker: posicao.ticker,
      nomeEmpresa: posicao.nomeEmpresa,
      quantidadeDisponivel: posicao.quantidade,
      cotacaoAtual: posicao.cotacaoAtual,
      dataHoraCotacao: posicao.dataHoraCotacao,
    }));
}

export function disponivelDe(vendaveis: AcaoVendavel[], ticker: string | null): number | null {
  const achada = vendaveis.find((acao) => acao.ticker === ticker);
  return achada ? achada.quantidadeDisponivel : null;
}

/**
 * O servidor continua sendo a autoridade — OPE-004 é tratado quando chega. Mas
 * deixar a tela enviar uma venda que ela já sabe impossível é transformar uma
 * regra conhecida em erro descoberto (PRD-007).
 */
export function vendaExcedePosicao(
  vendaveis: AcaoVendavel[],
  ticker: string | null,
  quantidade: number | null | undefined,
): boolean {
  const disponivel = disponivelDe(vendaveis, ticker);
  if (disponivel === null || !quantidade) {
    return false;
  }
  return quantidade > disponivel;
}
