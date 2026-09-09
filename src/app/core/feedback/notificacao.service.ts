import { ChangeDetectionStrategy, Component, inject, Injectable } from '@angular/core';
import { LucideX } from '@lucide/angular';
import {
  MAT_SNACK_BAR_DATA,
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
} from '@angular/material/snack-bar';
import { DadosMensagemFeedback } from './feedback.model';
import { MensagemFeedback } from './mensagem-feedback';

@Component({
  selector: 'app-conteudo-notificacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideX, MensagemFeedback],
  template: `
    <div class="conteudo">
      <app-mensagem-feedback
        [nivel]="dados.nivel"
        [mensagem]="dados.mensagem"
        [codigo]="dados.codigo"
      />
      <button type="button" aria-label="Dispensar mensagem" (click)="referencia.dismiss()">
        <svg lucideX aria-hidden="true" focusable="false"></svg>
      </button>
    </div>
  `,
  styles: `
    .conteudo {
      display: flex;
      align-items: flex-start;
      gap: var(--espaco-2);
    }

    button {
      display: grid;
      width: 28px;
      min-width: 28px;
      min-height: 28px;
      place-items: center;
      padding: 0;
      border: 0;
      border-radius: var(--raio);
      background: transparent;
      color: var(--cor-texto);
      cursor: pointer;
    }

    button:hover {
      background: var(--cor-superficie-alta);
    }

    button:focus-visible {
      outline: 2px solid var(--cor-acento);
      outline-offset: 2px;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  `,
})
export class ConteudoNotificacao {
  protected readonly dados = inject<DadosMensagemFeedback>(MAT_SNACK_BAR_DATA);
  protected readonly referencia = inject(MatSnackBarRef<ConteudoNotificacao>);
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly snackBar = inject(MatSnackBar);

  sucesso(mensagem: string): void {
    this.abrir({ nivel: 'sucesso', mensagem, codigo: null }, 5000);
  }

  erro(mensagem: string, codigo: string): void {
    this.abrir({ nivel: 'erro', mensagem, codigo });
  }

  private abrir(dados: DadosMensagemFeedback, duracao?: number): void {
    const configuracao: MatSnackBarConfig<DadosMensagemFeedback> = {
      data: dados,
      panelClass: ['notificacao-feedback'],
      horizontalPosition: 'right',
      verticalPosition: 'top',
      politeness: dados.nivel === 'erro' ? 'assertive' : 'polite',
      announcementMessage: `${dados.nivel === 'sucesso' ? 'Sucesso' : 'Erro'}: ${dados.mensagem}`,
    };

    if (duracao !== undefined) configuracao.duration = duracao;
    this.snackBar.openFromComponent(ConteudoNotificacao, configuracao);
  }
}
