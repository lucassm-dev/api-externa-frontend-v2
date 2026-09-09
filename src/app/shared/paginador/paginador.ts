import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

@Component({
  selector: 'app-paginador',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideChevronLeft, LucideChevronRight],
  templateUrl: './paginador.html',
  styleUrl: './paginador.scss',
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalItens = input.required<number>();
  readonly itensPorPagina = input.required<number>();
  readonly paginaMudou = output<number>();

  protected readonly inicio = computed(() =>
    this.totalItens() === 0 ? 0 : (this.pagina() - 1) * this.itensPorPagina() + 1,
  );
  protected readonly fim = computed(() => Math.min(this.pagina() * this.itensPorPagina(), this.totalItens()));
  protected readonly naPrimeira = computed(() => this.pagina() <= 1);
  protected readonly naUltima = computed(() => this.pagina() >= this.totalPaginas());

  protected irPara(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas() && pagina !== this.pagina()) {
      this.paginaMudou.emit(pagina);
    }
  }
}
