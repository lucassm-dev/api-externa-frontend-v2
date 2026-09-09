import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { Variacao } from '../../../shared/variacao/variacao';
import { ResultadosDaCarteira } from '../resultados';

/**
 * Os quatro números do PRD-008, sempre nesta ordem. Realizado e não realizado
 * ficam em cartões separados e rotulados: são naturezas diferentes, o
 * investidor experiente sabe disso, e somá-los destruiria a confiança na tela
 * inteira.
 *
 * Nada de rentabilidade anualizada: anualizar exige saber há quanto tempo cada
 * posição existe e ponderar aportes, o que depende do extrato inteiro —
 * paginado e sem filtro (ADR-010).
 */
@Component({
  selector: 'app-numeros-desempenho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Variacao],
  templateUrl: './numeros-desempenho.html',
  styleUrl: './numeros-desempenho.scss',
})
export class NumerosDesempenho {
  readonly resultados = input.required<ResultadosDaCarteira>();

  protected readonly investido = computed(() => formatarReal(this.resultados().valorInvestido));
  protected readonly mercado = computed(() => formatarReal(this.resultados().valorDeMercado));
}
