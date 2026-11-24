import { useSyncExternalStore } from 'react';
import { feedback } from './feedback.service';
import { MensagemFeedback } from './mensagem-feedback';

/** Fila única de mensagens da aplicação, nos três níveis. */
export function PainelFeedback() {
  const mensagens = useSyncExternalStore(feedback.assinar, feedback.mensagens);
  if (mensagens.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-10 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {mensagens.map((mensagem) => (
        <MensagemFeedback key={mensagem.id} nivel={mensagem.nivel} mensagem={mensagem.texto} codigo={mensagem.codigo} />
      ))}
    </div>
  );
}
