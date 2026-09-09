import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { InitialsPipe } from 'ngx-oneforall/pipes/initials';

@Component({
  selector: 'app-monograma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InitialsPipe],
  templateUrl: './monograma.html',
  styleUrl: './monograma.scss',
})
export class Monograma {
  readonly ticker = input.required<string>();
  readonly logoUrl = input<string | null>(null);

  protected readonly logoFalhou = signal(false);
  protected readonly tickerNormalizado = computed(() => this.ticker().trim().toUpperCase());
  protected readonly serie = computed(() => {
    let hash = 0;
    for (const caractere of this.tickerNormalizado()) {
      hash = (hash * 31 + caractere.charCodeAt(0)) | 0;
    }
    return Math.abs(hash % 8) + 1;
  });
  protected readonly cor = computed(() => `var(--cor-serie-${this.serie()})`);
  protected readonly exibirLogo = computed(() => Boolean(this.logoUrl()) && !this.logoFalhou());
}
