import { Injectable, signal } from '@angular/core';
import { NivelFeedback } from './feedback.model';

export interface MensagemDeFeedback {
  id: number;
  nivel: NivelFeedback;
  texto: string;
  codigo: string | null;
  /** Só erro bloqueia. Aviso acompanha um sucesso e segue o fluxo (ADR-006). */
  bloqueia: boolean;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private proximoId = 1;
  private readonly fila = signal<MensagemDeFeedback[]>([]);

  readonly mensagens = this.fila.asReadonly();

  informar(texto: string): void {
    this.empilhar('informacao', texto, null);
  }

  avisar(texto: string, codigo: string | null = null): void {
    this.empilhar('aviso', texto, codigo);
  }

  errar(texto: string, codigo: string | null = null): void {
    this.empilhar('erro', texto, codigo);
  }

  /**
   * Ação que deu certo trazendo ressalvas. O resultado é informação e cada
   * ressalva é aviso — nunca erro, senão o investidor repete a operação e
   * duplica o lançamento (ADR-006).
   */
  sucessoComAvisos(resultado: string, avisos: string[]): void {
    this.informar(resultado);
    for (const aviso of avisos) {
      this.avisar(aviso);
    }
  }

  descartar(id: number): void {
    this.fila.update((atual) => atual.filter((mensagem) => mensagem.id !== id));
  }

  limpar(): void {
    this.fila.set([]);
  }

  private empilhar(nivel: NivelFeedback, texto: string, codigo: string | null): void {
    this.fila.update((atual) => [
      ...atual,
      { id: this.proximoId++, nivel, texto, codigo, bloqueia: nivel === 'erro' },
    ]);
  }
}
