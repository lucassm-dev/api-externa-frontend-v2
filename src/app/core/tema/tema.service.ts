import { Injectable, signal } from '@angular/core';

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

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly estado = signal<Tema>(guardado());

  readonly tema = this.estado.asReadonly();

  constructor() {
    this.aplicar(this.estado());
  }

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
    this.estado.set(tema);
    this.aplicar(tema);
  }

  alternar(): void {
    this.definir(this.estado() === 'claro' ? 'escuro' : 'claro');
  }
}
