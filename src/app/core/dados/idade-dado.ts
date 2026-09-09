/**
 * Limite de defasagem visual. Acompanha o tempo de vida do cache de cotação e
 * de câmbio do backend (ADR-005, padrão 15 minutos).
 */
export const LIMITE_DEFASAGEM_MINUTOS = 15;

export function idadeEmMinutos(obtidoEm: Date | string, agora: Date = new Date()): number {
  const diferenca = agora.getTime() - new Date(obtidoEm).getTime();
  return Math.max(0, Math.floor(diferenca / 60_000));
}

/** Passados 15 minutos — 15 em ponto ainda não conta — o dado é defasado. */
export function estaDefasado(
  obtidoEm: Date | string,
  agora: Date = new Date(),
  limiteMinutos = LIMITE_DEFASAGEM_MINUTOS,
): boolean {
  return agora.getTime() - new Date(obtidoEm).getTime() > limiteMinutos * 60_000;
}
