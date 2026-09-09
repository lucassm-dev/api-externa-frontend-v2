import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { Selo, VarianteSelo } from '../../../shared/selo/selo';
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
  imports: [Selo, Variacao],
  templateUrl: './numeros-desempenho.html',
  styleUrl: './numeros-desempenho.scss',
})
export class NumerosDesempenho {
  readonly resultados = input.required<ResultadosDaCarteira>();

  protected readonly investido = computed(() => formatarReal(this.resultados().valorInvestido));
  protected readonly mercado = computed(() => formatarReal(this.resultados().valorDeMercado));
  protected readonly seloNaoRealizado = computed(() =>
    this.seloDoPercentual(this.resultados().naoRealizadoPercentual),
  );
  protected readonly seloRealizado = computed(() =>
    this.seloDoPercentual(this.resultados().realizadoPercentual),
  );

  private seloDoPercentual(
    percentual: number | null,
  ): { variante: VarianteSelo; texto: string } | null {
    if (percentual === null) {
      return null;
    }
    if (percentual > 0) {
      return { variante: 'alta', texto: `Alta ${formatarNumero(percentual)}%` };
    }
    if (percentual < 0) {
      return { variante: 'baixa', texto: `Baixa ${formatarNumero(Math.abs(percentual))}%` };
    }
    return { variante: 'estavel', texto: 'Estável 0,00%' };
  }
}
