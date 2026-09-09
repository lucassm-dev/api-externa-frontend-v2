import { LucroRealizado } from '../carteiras/carteiras.model';

/**
 * Um dos poucos números fechados do produto: já foi apurado na venda e não
 * muda com a cotação. Inclui tickers que não têm mais posição aberta — quem
 * zerou um ativo continua vendo o que ele rendeu (ASM-026).
 *
 * O total exibido é o `total` do backend, nunca a soma refeita aqui.
 */
export interface BarraDeRealizado {
  ticker: string;
  valor: number;
}

export function realizadoPorTicker(lucro: LucroRealizado): BarraDeRealizado[] {
  return Object.entries(lucro.porTicker)
    .map(([ticker, valor]) => ({ ticker, valor }))
    .sort((uma, outra) => outra.valor - uma.valor);
}

/** Mapa vazio é "ainda não vendi nada", que é diferente de leitura que falhou. */
export function houveVenda(lucro: LucroRealizado): boolean {
  return Object.keys(lucro.porTicker).length > 0;
}
