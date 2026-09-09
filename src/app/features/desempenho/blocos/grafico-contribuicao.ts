import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Variacao } from '../../../shared/variacao/variacao';
import { BarraDeContribuicao } from '../contribuicao';

/**
 * "Quem está puxando o resultado?" — barras que saem de uma linha zero, ganho
 * para a direita e perda para a esquerda, da maior alta à maior baixa.
 *
 * O lado da barra, o sinal e a palavra dizem a direção. A cor só reforça: em
 * tema claro ou escuro, quem não distingue verde de vermelho continua lendo o
 * gráfico inteiro.
 *
 * Nenhum eixo de tempo: é o resultado de agora, não a trajetória dele.
 */
interface BarraDesenhada extends BarraDeContribuicao {
  ganho: boolean;
  largura: number;
  inicio: number;
}

const CENTRO = 50;

@Component({
  selector: 'app-grafico-contribuicao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Variacao],
  templateUrl: './grafico-contribuicao.html',
  styleUrl: './grafico-contribuicao.scss',
})
export class GraficoContribuicao {
  readonly barras = input.required<BarraDeContribuicao[]>();

  protected readonly desenhadas = computed<BarraDesenhada[]>(() => {
    const barras = this.barras();
    const escala = Math.max(...barras.map((barra) => Math.abs(barra.valor)), 0);

    return barras.map((barra) => {
      const largura = escala === 0 ? 0 : (Math.abs(barra.valor) / escala) * CENTRO;
      const ganho = barra.valor >= 0;
      return { ...barra, ganho, largura, inicio: ganho ? CENTRO : CENTRO - largura };
    });
  });
}
