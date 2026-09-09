import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { estaDefasado } from '../../../core/dados/idade-dado';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarDataHora } from '../../../core/formatacao/formatacao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { IdadeDasCotacoes } from '../idade-das-cotacoes';

/**
 * O que a tela precisa confessar, no corpo dela e não em tooltip nem rodapé:
 * a rentabilidade não inclui dividendos nem JCP — o produto não tem esse dado,
 * e uma ação que distribuiu dinheiro aparece pior do que foi —, e os preços são
 * snapshots de idades diferentes entre si, qualificados pelo mais antigo
 * (ADR-005).
 *
 * Os avisos que o backend manda no consolidado (câmbio indisponível, por
 * exemplo) entram aqui como aviso, nunca como erro: o número continua na tela
 * com a última taxa conhecida (ADR-006).
 */
@Component({
  selector: 'app-confissoes-desempenho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback, ValorComHorario],
  templateUrl: './confissoes-desempenho.html',
  styleUrl: './confissoes-desempenho.scss',
})
export class ConfissoesDesempenho {
  readonly idade = input.required<IdadeDasCotacoes>();
  readonly avisosDoConsolidado = input<string[]>([]);
  readonly taxaCambio = input<number | null>(null);
  readonly dataHoraTaxaCambio = input<string | null>(null);

  protected readonly horarioMaisAntigo = computed(() => {
    const maisAntiga = this.idade().maisAntiga;
    return maisAntiga === null ? null : formatarDataHora(maisAntiga);
  });

  protected readonly maisAntigaDefasada = computed(() => {
    const maisAntiga = this.idade().maisAntiga;
    return maisAntiga !== null && estaDefasado(maisAntiga);
  });

  protected readonly defasados = computed(() => this.idade().tickersDefasados);
}
