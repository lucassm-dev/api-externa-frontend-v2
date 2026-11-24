import { X } from 'lucide-react';
import { toast, type ExternalToast } from 'sonner';
import { DadosMensagemFeedback } from './feedback.model';
import { MensagemFeedback } from './mensagem-feedback';

interface PropsConteudo {
  dados: DadosMensagemFeedback;
  aoDispensar: () => void;
}

/** O conteúdo do aviso flutuante: a mensagem comum do produto e o botão de dispensar. */
export function ConteudoNotificacao({ dados, aoDispensar }: PropsConteudo) {
  return (
    <div className="relative w-[356px] max-w-[calc(100vw-2rem)]">
      <MensagemFeedback nivel={dados.nivel} mensagem={dados.mensagem} codigo={dados.codigo} className="pr-10 shadow-media" />
      <button
        type="button"
        aria-label="Dispensar mensagem"
        onClick={aoDispensar}
        className="absolute top-2 right-2 grid size-7 cursor-pointer place-items-center rounded bg-transparent text-current transition-colors hover:bg-superficie-alta"
      >
        <X aria-hidden="true" focusable="false" className="size-4" />
      </button>
    </div>
  );
}

/**
 * Mesmo contrato do NotificacaoService do Angular, sobre o sonner no lugar do
 * MatSnackBar: sucesso some sozinho em cerca de cinco segundos; erro fica até
 * ser dispensado e conserva o código (AC-213, AC-214).
 */
export const notificacao = {
  sucesso(mensagem: string): void {
    abrir({ nivel: 'sucesso', mensagem, codigo: null }, 5000);
  },

  erro(mensagem: string, codigo: string): void {
    abrir({ nivel: 'erro', mensagem, codigo });
  },
};

function abrir(dados: DadosMensagemFeedback, duracao?: number): void {
  const configuracao: ExternalToast = { duration: duracao ?? Number.POSITIVE_INFINITY };
  toast.custom((id) => <ConteudoNotificacao dados={dados} aoDispensar={() => toast.dismiss(id)} />, configuracao);
}
