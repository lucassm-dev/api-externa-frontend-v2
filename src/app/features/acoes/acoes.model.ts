import { Moeda } from '../../core/formatacao/formatacao';
import { Mercado } from '../carteiras/carteiras.model';

/**
 * A ação como o backend devolve. Nome da empresa, moeda e cotação vêm da fonte
 * do mercado escolhido — nenhum é editável pelo investidor. `dataHoraCotacao`
 * acompanha o preço em toda tela, sem exceção (ADR-005).
 */
export interface Acao {
  id: number;
  ticker: string;
  nomeEmpresa: string;
  mercado: string;
  moeda: Moeda;
  cotacaoAtual: number;
  dataHoraCotacao: string;
}

export interface NovaAcao {
  ticker: string;
  mercado: Mercado;
}

export const ACOES_POR_PAGINA = 20;

/** O ticker é a chave natural: caixa alta e sem espaços em qualquer rota. */
export function normalizarTicker(ticker: string): string {
  return ticker.replace(/\s+/g, '').toUpperCase();
}
