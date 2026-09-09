/** Só o que o selo precisa saber de uma carteira do investidor. */
export interface CarteiraVinculada {
  corretoraId: number;
}

export function contarCarteirasPorCorretora(
  carteiras: readonly CarteiraVinculada[],
): Map<number, number> {
  const contagem = new Map<number, number>();
  for (const carteira of carteiras) {
    contagem.set(carteira.corretoraId, (contagem.get(carteira.corretoraId) ?? 0) + 1);
  }
  return contagem;
}

/** Informativo e discreto: sem carteira não há selo, e nada aqui reordena a lista. */
export function rotuloDoSelo(quantidade: number | undefined): string | null {
  if (!quantidade) {
    return null;
  }
  return quantidade === 1 ? '1 carteira sua' : `${quantidade} carteiras suas`;
}
