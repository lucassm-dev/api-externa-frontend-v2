import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type FormatoEsqueleto = 'linha' | 'bloco' | 'tabela';

@Component({
  selector: 'app-esqueleto',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './esqueleto.html',
  styleUrl: './esqueleto.scss',
})
export class Esqueleto {
  readonly formato = input<FormatoEsqueleto>('linha');
  protected readonly linhas = computed(() => Array.from({ length: this.formato() === 'tabela' ? 5 : 1 }));
}
