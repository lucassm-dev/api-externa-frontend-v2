import { Injectable } from '@angular/core';
import { CarteiraResumida } from './painel.model';

export const CHAVE_CARTEIRA_PREFERIDA = 'carteira.painel.carteira';

/**
 * A carteira escolhida no consolidado sobrevive à visita, como o tema e a
 * sessão. Navegador sem armazenamento continua funcionando: a escolha só vale
 * enquanto a aba estiver aberta.
 */
@Injectable({ providedIn: 'root' })
export class CarteiraPreferida {
  private emMemoria: number | null = null;

  lembrada(): number | null {
    if (this.emMemoria !== null) {
      return this.emMemoria;
    }
    try {
      const guardado = localStorage.getItem(CHAVE_CARTEIRA_PREFERIDA);
      const id = guardado === null ? Number.NaN : Number(guardado);
      return Number.isInteger(id) ? id : null;
    } catch {
      return null;
    }
  }

  lembrar(carteiraId: number): void {
    this.emMemoria = carteiraId;
    try {
      localStorage.setItem(CHAVE_CARTEIRA_PREFERIDA, String(carteiraId));
    } catch {
      // sem armazenamento a escolha vale só para esta visita
    }
  }

  /** Carteira lembrada que não existe mais cai na mais recente da lista. */
  escolherEntre(carteiras: CarteiraResumida[]): CarteiraResumida | null {
    if (carteiras.length === 0) {
      return null;
    }
    const lembrada = this.lembrada();
    return carteiras.find((carteira) => carteira.id === lembrada) ?? carteiras[0];
  }
}
