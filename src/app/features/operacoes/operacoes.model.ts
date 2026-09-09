import { Moeda } from '../../core/formatacao/formatacao';

/** Os dois tipos vivem no mesmo formulário — duplicar a tela duplicaria cada correção. */
export type TipoOperacao = 'COMPRA' | 'VENDA';

export interface OpcaoDeTipo {
  valor: TipoOperacao;
  rotulo: string;
  /** O botão de confirmação diz qual operação será registrada (AC-153). */
  rotuloDoBotao: string;
}

export const TIPOS_DE_OPERACAO: OpcaoDeTipo[] = [
  { valor: 'COMPRA', rotulo: 'Compra', rotuloDoBotao: 'Registrar compra' },
  { valor: 'VENDA', rotulo: 'Venda', rotuloDoBotao: 'Registrar venda' },
];

export function opcaoDeTipo(tipo: TipoOperacao): OpcaoDeTipo {
  return TIPOS_DE_OPERACAO.find((opcao) => opcao.valor === tipo) ?? TIPOS_DE_OPERACAO[0];
}

/**
 * O que o formulário envia. `precoUnitario` ausente é o caminho normal: o preço
 * vem do mercado no ato da operação (ADR-008). Enviar `null` ou `0` seria dizer
 * ao backend que o investidor escolheu esse preço.
 */
export interface NovaOperacao {
  carteiraId: number;
  ticker: string;
  quantidade: number;
  precoUnitario?: number;
}

/**
 * A operação como o backend a devolve. `avisos` é o campo mais delicado do
 * produto: ele acompanha uma operação que **deu certo** e nunca pode ser
 * apresentado como falha (ADR-006).
 */
export interface Operacao {
  id: number;
  carteiraId: number;
  ticker: string;
  tipo: TipoOperacao;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  dataHora: string;
  moeda: Moeda;
  avisos: string[];
  precoMedioCompraNoMomento?: number;
  lucroRealizado?: number;
  taxaCambioNaOperacao?: number;
}

/**
 * O mínimo que a edição precisa conhecer de uma operação. Existe para que a
 * mesma tela de correção sirva ao extrato global e à seção de movimentações da
 * carteira, que carrega uma projeção mais enxuta da operação.
 */
export interface OperacaoEditavel {
  id: number;
  carteiraId: number;
  tipo: TipoOperacao | string;
  dataHora: string;
  ticker?: string;
  quantidade?: number;
}

/**
 * Uma linha do extrato. Resultado realizado e preço médio são opcionais
 * (ASM-038): ausente é ausente — a tela some com o campo em vez de exibir
 * traço ou zero.
 */
export interface OperacaoDoExtrato extends OperacaoEditavel {
  ticker: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
  moeda: Moeda;
  lucroRealizado?: number;
  precoMedioCompraNoMomento?: number;
}

/** Só quantidade e preço unitário são editáveis — nada mais (PRD-007). */
export interface AlteracaoDeOperacao {
  quantidade?: number;
  precoUnitario?: number;
}

export const OPERACOES_POR_PAGINA = 20;

/** O catálogo e as carteiras cabem numa leitura só nas dimensões deste produto. */
export const CATALOGO_POR_VARREDURA = 200;
