import { useSyncExternalStore } from 'react';
import { feedback } from './feedback.service';
import { ConteudoNotificacao } from './conteudo-notificacao';

/** Fila única de mensagens da aplicação, nos três níveis; cada uma com o botão de dispensar (AC-408). */
export function PainelFeedback() {
  const mensagens = useSyncExternalStore(feedback.assinar, feedback.mensagens);
  if (mensagens.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-10 flex w-[380px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {mensagens.map((mensagem) => (
        <ConteudoNotificacao
          key={mensagem.id}
          dados={{ nivel: mensagem.nivel, mensagem: mensagem.texto, codigo: mensagem.codigo }}
          aoDispensar={() => feedback.descartar(mensagem.id)}
        />
      ))}
    </div>
  );
}
