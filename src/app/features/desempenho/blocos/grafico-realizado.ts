import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { Selo, VarianteSelo } from '../../../shared/selo/selo';
import { Variacao } from '../../../shared/variacao/variacao';
import { BarraDeRealizado } from '../realizado-por-ticker';

/**
 * O que já foi apurado em vendas, por ticker. É um dos poucos números fechados
 * do produto: não muda com a cotação, e por isso não carrega horário de
 * snapshot como os demais.
 *
 * Inclui ticker que não tem mais posição aberta — quem zerou um ativo continua
 * vendo o que ele rendeu. O total é o do backend, não a soma refeita aqui.
 */
interface BarraDesenhada extends BarraDeRealizado {
  ganho: boolean;
  largura: number;
  inicio: number;
  selo: { variante: VarianteSelo; texto: string };
}

const CENTRO = 50;

@Component({
  selector: 'app-grafico-realizado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Selo, Variacao],
  templateUrl: './grafico-realizado.html',
  styleUrl: './grafico-realizado.scss',
})
export class GraficoRealizado {
  readonly barras = input.required<BarraDeRealizado[]>();
  readonly total = input.required<number>();

  protected readonly totalFormatado = computed(() => formatarReal(this.total()));

  protected readonly desenhadas = computed<BarraDesenhada[]>(() => {
    const barras = [...this.barras()].sort((uma, outra) => outra.valor - uma.valor);
    const escala = Math.max(...barras.map((barra) => Math.abs(barra.valor)), 0);

    return barras.map((barra) => {
      const largura = escala === 0 ? 0 : (Math.abs(barra.valor) / escala) * CENTRO;
      const ganho = barra.valor >= 0;
      const selo: BarraDesenhada['selo'] =
        barra.valor > 0
          ? { variante: 'alta', texto: 'Ganho' }
          : barra.valor < 0
            ? { variante: 'baixa', texto: 'Perda' }
            : { variante: 'estavel', texto: 'Estável' };
      return { ...barra, ganho, largura, inicio: ganho ? CENTRO : CENTRO - largura, selo };
    });
  });
}
