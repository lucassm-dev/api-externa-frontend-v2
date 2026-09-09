import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarHora, formatarMoeda } from '../../../core/formatacao/formatacao';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { Variacao } from '../../../shared/variacao/variacao';
import { BarraDeMercado } from '../painel.model';

/**
 * Contexto de mercado, igual para todo investidor. Item que a fonte não
 * devolveu simplesmente não aparece, e o que faltou vira aviso discreto — nunca
 * erro, e nunca derruba a tela (ADR-006).
 */
@Component({
  selector: 'app-barra-mercado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback, Variacao],
  templateUrl: './barra-mercado.html',
  styleUrl: './barra-mercado.scss',
})
export class BarraMercado {
  readonly barra = input.required<BarraDeMercado | null>();

  protected readonly itens = computed(() => this.barra()?.itens ?? []);
  protected readonly avisos = computed(() => this.barra()?.avisos ?? []);

  protected readonly atualizadoEm = computed(() => {
    const barra = this.barra();
    return barra ? formatarHora(barra.atualizadoEm) : null;
  });

  protected preco(valor: number): string {
    return formatarMoeda(valor, 'BRL');
  }
}
