import { Moeda } from '../../core/formatacao/formatacao';

/** Item da barra de mercado. Contexto de todo mundo, não do investidor. */
export interface ItemDeMercado {
  simbolo: string;
  nome: string;
  preco: number;
  variacaoPercentual: number;
  logoUrl: string | null;
}

export interface BarraDeMercado {
  itens: ItemDeMercado[];
  atualizadoEm: string;
  avisos: string[];
}

/** O que `GET /carteiras` devolve. Não traz valor de mercado nem resultado. */
export interface CarteiraResumida {
  id: number;
  investidorId: number;
  corretoraId: number;
  nomeCorretora: string;
  mercado: string;
  moeda: Moeda;
  nome: string;
  ativa: boolean;
}

/** Consolidado de UMA carteira, sempre em real, com a taxa usada (ADR-004). */
export interface ConsolidadoDaCarteira {
  valorInvestido: number;
  valorDeMercado: number;
  lucroNaoRealizado: number;
  taxaCambioAtual: number;
  dataHoraTaxaCambio: string;
  avisos: string[];
}

/**
 * Movimentação do extrato. Os campos seguem o PRD-007 (ASM-013) e os que o
 * painel só exibe são opcionais: o bloco omite o que não vier em vez de quebrar.
 */
export interface Movimentacao {
  id: number;
  dataHora: string;
  tipo: 'COMPRA' | 'VENDA' | string;
  ticker?: string;
  nomeCarteira?: string;
  quantidade?: number;
  precoUnitario?: number;
  valorTotal?: number;
  moeda?: Moeda;
}

export const CARTEIRAS_NO_PAINEL = 50;
export const MOVIMENTACOES_NO_PAINEL = 5;
