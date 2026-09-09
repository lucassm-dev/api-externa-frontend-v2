import { Moeda } from '../../core/formatacao/formatacao';

/**
 * Moeda de referência da carteira, não restrição: ela aceita ações dos dois
 * mercados (ADR-004). O campo continua obrigatório no backend, e por isso
 * continua no formulário — sem valor padrão escondido (PRD-005).
 */
export type Mercado = 'BR' | 'US';

export interface OpcaoDeMercado {
  valor: Mercado;
  rotulo: string;
}

export const MERCADOS: OpcaoDeMercado[] = [
  { valor: 'BR', rotulo: 'Brasil' },
  { valor: 'US', rotulo: 'Estados Unidos' },
];

export function rotuloDoMercado(mercado: string): string {
  return MERCADOS.find((opcao) => opcao.valor === mercado)?.rotulo ?? mercado;
}

/** A carteira como `GET /carteiras` devolve. Não traz valor nem resultado. */
export interface Carteira {
  id: number;
  investidorId: number;
  corretoraId: number;
  nomeCorretora: string;
  mercado: string;
  moeda: Moeda;
  nome: string;
  ativa: boolean;
}

export interface NovaCarteira {
  corretoraId: number;
  mercado: Mercado;
  nome: string;
}

/** Uma linha de `GET /carteiras/{id}/posicoes`. Valores em real (ASM-025). */
export interface Posicao {
  id: number;
  ticker: string;
  nomeEmpresa: string;
  quantidade: number;
  precoMedio: number;
  cotacaoAtual: number;
  dataHoraCotacao: string;
  rentabilidadeNaoRealizada: number;
}

export interface ConsolidadoDaCarteira {
  valorInvestido: number;
  valorDeMercado: number;
  lucroNaoRealizado: number;
  taxaCambioAtual: number;
  dataHoraTaxaCambio: string;
  avisos: string[];
}

/** `porTicker` acumula o realizado por ticker, aberto ou não (ASM-026). */
export interface LucroRealizado {
  total: number;
  porTicker: Record<string, number>;
}

export interface MovimentacaoDoExtrato {
  id: number;
  carteiraId: number;
  dataHora: string;
  tipo: 'COMPRA' | 'VENDA' | string;
  ticker?: string;
  quantidade?: number;
  precoUnitario?: number;
  valorTotal?: number;
  moeda?: Moeda;
}

/** O extrato como a tela o recebeu: os itens e quantos existem no servidor. */
export interface ExtratoBuscado {
  itens: MovimentacaoDoExtrato[];
  totalNoServidor: number;
  buscadas: number;
}

export const CARTEIRAS_POR_PAGINA = 20;

/**
 * O extrato é global e não aceita filtro por carteira (ADR-010): o recorte é
 * do cliente. Uma página larga cobre o histórico inteiro do investidor típico
 * deste produto numa requisição só; passando disso, a tela declara o recorte
 * em vez de fingir que mostrou tudo (Q-012).
 */
export const MOVIMENTACOES_BUSCADAS = 200;

/** Página larga também aqui: o detalhe procura a carteira na listagem (Q-015). */
export const CARTEIRAS_POR_VARREDURA = 200;
