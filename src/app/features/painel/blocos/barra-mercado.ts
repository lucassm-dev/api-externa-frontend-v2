import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarHora, formatarMoeda } from '../../../core/formatacao/formatacao';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { Variacao } from '../../../shared/variacao/variacao';
import { BarraDeMercado } from '../painel.model';

/**
 * Contexto de mercado, igual para todo investidor. Item que a fonte não
 * devolveu simplesmente não aparece, e o que faltou vira aviso discreto — nunca
 * erro, e nunca derruba a tela (ADR-006).
 *
 * A lista de chips é renderizada duas vezes: a cópia é decorativa
 * (`aria-hidden`, sem os marcadores `data-item`) e existe só para o loop da
 * rolagem não ter emenda (ASM-055).
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

  /**
   * Q-029: a barra corre a velocidade constante (~40 px/s), não em duração
   * fixa — com duração fixa, mais itens acelerariam a barra. Como cada chip tem
   * largura parecida, escalar a duração pelo número de itens mantém a
   * velocidade estável. `SEGUNDOS_POR_CHIP` é o único ponto de ajuste.
   */
  protected readonly duracaoAnimacao = computed(() => {
    const segundos = Math.max(this.itens().length, 1) * SEGUNDOS_POR_CHIP;
    return `${segundos}s`;
  });

  protected preco(valor: number): string {
    return formatarMoeda(valor, 'BRL');
  }
}

const SEGUNDOS_POR_CHIP = 4.5;
