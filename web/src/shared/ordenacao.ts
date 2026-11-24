/**
 * Ordenação compartilhada das tabelas (RFC-001 D2 — TanStack Table v9 entrega a
 * lógica de tabela; este utilitário concentra o estado de ordenação que todas as
 * tabelas do produto reaproveitam).
 *
 * Recebe as linhas da página já carregada e a coluna escolhida, devolve a ordem
 * e alterna o sentido a cada acionamento. Opera só sobre o array recebido: nunca
 * dispara consulta nem troca de página (AC-243, ADR-010).
 */

export type SentidoOrdenacao = 'asc' | 'desc';

/** Valores possíveis do atributo `aria-sort` de um cabeçalho de coluna. */
export type AriaSort = 'ascending' | 'descending' | 'none';

type ValorComparavel = string | number | Date | boolean;

/** Extrai de uma linha o valor comparável de uma coluna. */
export type ValorDaColuna<T> = (linha: T) => ValorComparavel | null | undefined;

export interface ColunaOrdenavel<T> {
  readonly id: string;
  readonly valor: ValorDaColuna<T>;
}

export interface EstadoOrdenacao {
  /** Coluna ativa, ou `null` enquanto a tabela está na ordem original. */
  readonly coluna: string | null;
  readonly sentido: SentidoOrdenacao;
}

const ESTADO_INICIAL: EstadoOrdenacao = { coluna: null, sentido: 'asc' };

export class OrdenacaoTabela<T> {
  private readonly colunas: ReadonlyMap<string, ValorDaColuna<T>>;
  private estadoAtual: EstadoOrdenacao = ESTADO_INICIAL;

  constructor(colunas: readonly ColunaOrdenavel<T>[]) {
    this.colunas = new Map<string, ValorDaColuna<T>>(colunas.map((c) => [c.id, c.valor] as const));
  }

  /** Estado corrente, para o cabeçalho refletir o sentido. */
  estado(): EstadoOrdenacao {
    return this.estadoAtual;
  }

  /** `true` quando a coluna aceita ordenação (AC-242; colunas de dado, ver Q-031). */
  ordenavel(coluna: string): boolean {
    return this.colunas.has(coluna);
  }

  /**
   * Aciona o cabeçalho da coluna: passa a ordenar por ela e alterna entre
   * crescente e decrescente a cada acionamento (AC-242). Colunas sem valor
   * registrado — a coluna de ações, por exemplo — são ignoradas.
   */
  alternar(coluna: string): void {
    if (!this.colunas.has(coluna)) return;

    const mesmaColuna = this.estadoAtual.coluna === coluna;
    const sentido: SentidoOrdenacao =
      mesmaColuna && this.estadoAtual.sentido === 'asc' ? 'desc' : 'asc';

    this.estadoAtual = { coluna, sentido };
  }

  /**
   * Valor de `aria-sort` do cabeçalho da coluna, para leitores de tela
   * anunciarem o sentido atual (AC-242).
   */
  ariaSort(coluna: string): AriaSort {
    if (this.estadoAtual.coluna !== coluna) return 'none';
    return this.estadoAtual.sentido === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Nova lista com as linhas da página reordenadas pelo estado atual. Não muta a
   * lista recebida e não conhece paginação nem busca (AC-243, ADR-010).
   */
  ordenar(linhas: readonly T[]): T[] {
    const { coluna, sentido } = this.estadoAtual;
    const valor = coluna ? this.colunas.get(coluna) : undefined;
    const copia = [...linhas];
    if (!valor) return copia;

    const fator = sentido === 'asc' ? 1 : -1;
    return copia.sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1; // ausentes sempre no fim, nos dois sentidos
      if (vb == null) return -1;
      return fator * comparar(va, vb);
    });
  }
}

function comparar(a: ValorComparavel, b: ValorComparavel): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? 1 : -1;
  return String(a).localeCompare(String(b), 'pt-BR', { numeric: true, sensitivity: 'base' });
}
