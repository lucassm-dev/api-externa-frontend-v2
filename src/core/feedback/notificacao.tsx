import { toast, type ExternalToast } from 'sonner';
import { DadosMensagemFeedback } from './feedback.model';
import { ConteudoNotificacao } from './conteudo-notificacao';

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
