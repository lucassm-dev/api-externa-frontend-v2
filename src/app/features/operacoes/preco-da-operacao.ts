/**
 * Não existe endpoint de "consultar preço para operação" (ASM-040). O que a
 * tela mostra antes de confirmar sai da última cotação conhecida da ação, e o
 * preço efetivamente registrado pode ser outro — o backend busca preço novo se
 * o cache tiver vencido. Por isso o resultado se chama estimativa, e é assim
 * que a tela precisa apresentá-lo.
 */
export interface EstimativaDaOperacao {
  precoUnitario: number;
  valorTotal: number;
  /** Nunca opcional: preço sem horário não existe neste produto (ADR-005). */
  obtidoEm: string;
}

export function estimarOperacao(
  cotacao: number | null | undefined,
  obtidoEm: string | null | undefined,
  quantidade: number | null | undefined,
): EstimativaDaOperacao | null {
  if (!cotacao || !obtidoEm || !quantidade || quantidade <= 0) {
    return null;
  }
  return { precoUnitario: cotacao, valorTotal: cotacao * quantidade, obtidoEm };
}

/**
 * OPE-005 só alcança preço digitado: o preço automático é arredondado pelo
 * backend e nunca chega aqui (ADR-008).
 */
export function precoManualTemCasasDemais(preco: number | null | undefined): boolean {
  if (preco === null || preco === undefined || !Number.isFinite(preco)) {
    return false;
  }
  return Math.round(preco * 100) !== Number((preco * 100).toFixed(6));
}
