import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { estaDefasado, idadeEmMinutos } from '../../core/dados/idade-dado';
import { Moeda, formatarHora, formatarMoeda } from '../../core/formatacao/formatacao';

/**
 * Preço ou taxa de câmbio: nunca aparece sem o momento em que foi obtido
 * (ADR-005), e ganha marcação própria quando passa do limite de defasagem.
 */
@Component({
  selector: 'app-valor-com-horario',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './valor-com-horario.html',
  styleUrl: './valor-com-horario.scss',
})
export class ValorComHorario {
  readonly valor = input.required<number>();
  readonly moeda = input<Moeda>('BRL');
  readonly obtidoEm = input.required<Date | string>();

  protected readonly numero = computed(() => formatarMoeda(this.valor(), this.moeda()));
  protected readonly horario = computed(() => formatarHora(this.obtidoEm()));
  protected readonly defasado = computed(() => estaDefasado(this.obtidoEm()));
  protected readonly idade = computed(() => idadeEmMinutos(this.obtidoEm()));
}
