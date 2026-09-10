import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Botao } from '../botao/botao';

export type SentidoOrdenacao = 'crescente' | 'decrescente' | 'nenhum';

@Component({
  selector: 'th[app-cabecalho-ordenavel]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Botao],
  templateUrl: './cabecalho-ordenavel.html',
  styleUrl: './cabecalho-ordenavel.scss',
  host: {
    scope: 'col',
    '[attr.aria-sort]': 'ariaSort()',
    '[attr.data-sentido]': 'sentido()',
  },
})
export class CabecalhoOrdenavel {
  readonly rotulo = input.required<string>();
  readonly sentido = input<SentidoOrdenacao>('nenhum');
  readonly ordenar = output<void>();

  protected readonly ariaSort = computed(() => {
    switch (this.sentido()) {
      case 'crescente':
        return 'ascending';
      case 'decrescente':
        return 'descending';
      default:
        return 'none';
    }
  });
}
