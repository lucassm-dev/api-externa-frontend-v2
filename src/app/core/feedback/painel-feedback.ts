import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FeedbackService } from './feedback.service';
import { MensagemFeedback } from './mensagem-feedback';

/** Fila única de mensagens da aplicação, nos três níveis. */
@Component({
  selector: 'app-painel-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback],
  template: `
    @if (feedback.mensagens().length) {
      <div class="painel">
        @for (mensagem of feedback.mensagens(); track mensagem.id) {
          <app-mensagem-feedback
            [nivel]="mensagem.nivel"
            [mensagem]="mensagem.texto"
            [codigo]="mensagem.codigo"
          />
        }
      </div>
    }
  `,
  styles: `
    .painel {
      position: fixed;
      top: var(--espaco-4);
      right: var(--espaco-4);
      z-index: 10;
      display: flex;
      flex-direction: column;
      gap: var(--espaco-2);
      width: 380px;
    }
  `,
})
export class PainelFeedback {
  protected readonly feedback = inject(FeedbackService);
}
