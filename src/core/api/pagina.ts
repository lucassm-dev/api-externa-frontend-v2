/** Resposta paginada do Spring Data, como o backend devolve. */
export interface Pagina<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export function itensDe<T>(pagina: Pagina<T>): T[] {
  return pagina.content;
}

export function temProximaPagina(pagina: Pagina<unknown>): boolean {
  return pagina.number + 1 < pagina.totalPages;
}

export function paginaVazia<T>(size = 20): Pagina<T> {
  return { content: [], totalElements: 0, totalPages: 0, number: 0, size };
}
