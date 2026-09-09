import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideInfo,
  LucideTriangleAlert,
} from '@lucide/angular';
import { NivelFeedback } from './feedback.model';

const APRESENTACAO: Record<NivelFeedback, { rotulo: string; papel: string }> = {
  informacao: { rotulo: 'Informação', papel: 'note' },
  aviso: { rotulo: 'Aviso', papel: 'status' },
  erro: { rotulo: 'Erro', papel: 'alert' },
  sucesso: { rotulo: 'Sucesso', papel: 'status' },
};

@Component({
  selector: 'app-mensagem-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideCircleCheck, LucideCircleX, LucideInfo, LucideTriangleAlert],
  templateUrl: './mensagem-feedback.html',
  styleUrl: './mensagem-feedback.scss',
})
export class MensagemFeedback {
  readonly nivel = input.required<NivelFeedback>();
  readonly mensagem = input.required<string>();
  readonly codigo = input<string | null>(null);

  protected readonly apresentacao = computed(() => APRESENTACAO[this.nivel()]);
}
