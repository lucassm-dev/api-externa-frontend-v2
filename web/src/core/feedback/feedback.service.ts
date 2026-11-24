import { NivelFeedback } from './feedback.model';

export interface MensagemDeFeedback {
  id: number;
  nivel: NivelFeedback;
  texto: string;
  codigo: string | null;
  /** Só erro bloqueia. Aviso acompanha um sucesso e segue o fluxo (ADR-006). */
  bloqueia: boolean;
}

/** Mesma fila do FeedbackService do Angular; a lista é trocada, nunca mutada. */
export class FeedbackService {
  private proximoId = 1;
  private fila: MensagemDeFeedback[] = [];
  private readonly ouvintes = new Set<() => void>();

  readonly assinar = (ouvinte: () => void): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  readonly mensagens = (): MensagemDeFeedback[] => this.fila;

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
    this.trocar(this.fila.filter((mensagem) => mensagem.id !== id));
  }

  limpar(): void {
    this.trocar([]);
  }

  private empilhar(nivel: NivelFeedback, texto: string, codigo: string | null): void {
    this.trocar([...this.fila, { id: this.proximoId++, nivel, texto, codigo, bloqueia: nivel === 'erro' }]);
  }

  private trocar(fila: MensagemDeFeedback[]): void {
    this.fila = fila;
    for (const ouvinte of this.ouvintes) ouvinte();
  }
}

export const feedback = new FeedbackService();
