export type Tema = 'claro' | 'escuro';

export const CHAVE_TEMA = 'carteira.tema';
const ATRIBUTO = 'data-tema';

function guardado(): Tema {
  try {
    return localStorage.getItem(CHAVE_TEMA) === 'escuro' ? 'escuro' : 'claro';
  } catch {
    return 'claro';
  }
}

/** Mesma regra do TemaService do Angular: aplicar no documento e lembrar a escolha. */
export class TemaService {
  private estado: Tema = guardado();
  private readonly ouvintes = new Set<() => void>();

  constructor() {
    this.aplicar(this.estado);
  }

  readonly assinar = (ouvinte: () => void): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  readonly tema = (): Tema => this.estado;

  private aplicar(tema: Tema): void {
    document.documentElement.setAttribute(ATRIBUTO, tema);
    document.documentElement.style.colorScheme = tema === 'escuro' ? 'dark' : 'light';
    try {
      localStorage.setItem(CHAVE_TEMA, tema);
    } catch {
      // navegador sem armazenamento: o tema vale só para esta visita
    }
  }

  definir(tema: Tema): void {
    this.estado = tema;
    this.aplicar(tema);
    for (const ouvinte of this.ouvintes) ouvinte();
  }

  alternar(): void {
    this.definir(this.estado === 'claro' ? 'escuro' : 'claro');
  }
}

/** A instância do produto: criada ao subir a aplicação, aplica o tema guardado. */
export const temaService = new TemaService();
