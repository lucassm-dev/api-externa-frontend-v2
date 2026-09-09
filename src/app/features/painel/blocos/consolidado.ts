import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { Variacao } from '../../../shared/variacao/variacao';
import { CarteiraResumida, ConsolidadoDaCarteira } from '../painel.model';

/**
 * O consolidado de UMA carteira, sempre em real e com a taxa de câmbio à vista
 * (ADR-004). Nada aqui soma carteiras: o número somado no cliente não bate com
 * nenhuma outra tela do sistema.
 */
@Component({
  selector: 'app-consolidado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback, ValorComHorario, Variacao],
  templateUrl: './consolidado.html',
  styleUrl: './consolidado.scss',
})
export class Consolidado {
  readonly carteiras = input.required<CarteiraResumida[]>();
  readonly carteiraSelecionada = input.required<number | null>();
  readonly consolidado = input.required<ConsolidadoDaCarteira | null>();
  readonly carregando = input(false);

  readonly selecionar = output<number>();

  protected readonly avisos = computed(() => this.consolidado()?.avisos ?? []);

  protected readonly valores = computed(() => {
    const consolidado = this.consolidado();
    if (!consolidado) {
      return null;
    }
    return {
      investido: formatarReal(consolidado.valorInvestido),
      mercado: formatarReal(consolidado.valorDeMercado),
      resultado: consolidado.lucroNaoRealizado,
      taxa: consolidado.taxaCambioAtual,
      taxaObtidaEm: consolidado.dataHoraTaxaCambio,
    };
  });

  protected escolher(valor: string): void {
    this.selecionar.emit(Number(valor));
  }
}
