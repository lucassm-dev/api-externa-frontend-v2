import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { Variacao } from '../../../shared/variacao/variacao';
import { Posicao } from '../carteiras.model';
import { posicoesEncerradas } from '../posicoes-encerradas';
import { percentualNaoRealizado } from '../rentabilidade';

/**
 * As posições abertas e, logo abaixo, as encerradas — que o backend não
 * devolve: elas saem do cruzamento entre o resultado realizado por ticker e os
 * tickers que ainda têm posição. Sem essa seção, quem vendeu tudo de um ativo
 * conclui que o sistema perdeu o registro (PRD-005).
 */
@Component({
  selector: 'app-posicoes-carteira',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ValorComHorario, Variacao],
  templateUrl: './posicoes-carteira.html',
  styleUrl: './posicoes-carteira.scss',
})
export class PosicoesCarteira {
  readonly posicoes = input.required<Posicao[]>();
  readonly lucroPorTicker = input<Record<string, number>>({});

  protected readonly formatarReal = formatarReal;

  protected readonly encerradas = computed(() =>
    posicoesEncerradas(this.lucroPorTicker(), this.posicoes()),
  );

  protected quantidade(posicao: Posicao): string {
    return formatarNumero(posicao.quantidade, 0);
  }

  protected percentual(posicao: Posicao): number | null {
    return percentualNaoRealizado(posicao);
  }
}
