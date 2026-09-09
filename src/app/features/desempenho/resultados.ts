import { ConsolidadoDaCarteira, LucroRealizado } from '../carteiras/carteiras.model';

/**
 * Os quatro números do topo, na ordem do PRD-008. Realizado e não realizado
 * são campos separados de propósito: são naturezas diferentes, e não existe
 * neste módulo nenhuma função que os some — misturar destrói a confiança na
 * tela inteira.
 *
 * `realizado` nulo é leitura que falhou, e não zero apurado: quem nunca vendeu
 * tem total zero vindo do backend, o que é outra coisa.
 */
export interface ResultadosDaCarteira {
  valorInvestido: number;
  valorDeMercado: number;
  naoRealizado: number;
  naoRealizadoPercentual: number | null;
  realizado: number | null;
  realizadoPercentual: number | null;
}

/** Investido zero não vira infinito nem NaN: sem custo não há percentual. */
function percentualSobre(valor: number, investido: number): number | null {
  return investido === 0 ? null : (valor / investido) * 100;
}

export function resultadosDaCarteira(
  consolidado: ConsolidadoDaCarteira,
  lucroRealizado: LucroRealizado | null,
): ResultadosDaCarteira {
  const investido = consolidado.valorInvestido;
  const realizado = lucroRealizado?.total ?? null;

  return {
    valorInvestido: investido,
    valorDeMercado: consolidado.valorDeMercado,
    naoRealizado: consolidado.lucroNaoRealizado,
    naoRealizadoPercentual: percentualSobre(consolidado.lucroNaoRealizado, investido),
    realizado,
    realizadoPercentual: realizado === null ? null : percentualSobre(realizado, investido),
  };
}
