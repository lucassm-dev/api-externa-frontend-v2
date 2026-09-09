import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Moeda, formatarMoeda, formatarNumero } from '../../core/formatacao/formatacao';

type Direcao = 'alta' | 'baixa' | 'estavel';

const SINAIS: Record<Direcao, string> = { alta: '▲', baixa: '▼', estavel: '–' };

/** Ganho e perda nunca dependem só de cor: vêm com seta e com a palavra (PRD-001). */
@Component({
  selector: 'app-variacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './variacao.html',
  styleUrl: './variacao.scss',
})
export class Variacao {
  readonly valor = input.required<number>();
  readonly moeda = input<Moeda | null>(null);
  readonly percentual = input(false);

  protected readonly direcao = computed<Direcao>(() => {
    const valor = this.valor();
    if (valor > 0) return 'alta';
    if (valor < 0) return 'baixa';
    return 'estavel';
  });

  protected readonly sinal = computed(() => SINAIS[this.direcao()]);

  protected readonly numero = computed(() => {
    const modulo = Math.abs(this.valor());
    if (this.percentual()) {
      return `${formatarNumero(modulo)}%`;
    }
    const moeda = this.moeda();
    return moeda ? formatarMoeda(modulo, moeda) : formatarNumero(modulo);
  });
}
