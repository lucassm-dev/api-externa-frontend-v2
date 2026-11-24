/**
 * Os quatro níveis de comunicação do produto (PRD-009, ADR-006). Nunca se
 * misturam: aviso acompanha uma ação que deu certo e não pode parecer erro.
 */
export type NivelFeedback = 'informacao' | 'aviso' | 'erro' | 'sucesso';

export interface DadosMensagemFeedback {
  nivel: NivelFeedback;
  mensagem: string;
  codigo: string | null;
}
