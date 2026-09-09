import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import {
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
} from '../../../core/formatacao/formatacao';
import { Operacao, opcaoDeTipo } from '../operacoes.model';

/**
 * O ponto mais delicado do produto. Uma operação pode ser **registrada com
 * sucesso e trazer avisos**: o preço veio do cache, a cota da fonte estourou
 * (EXT-009), a fonte caiu (EXT-010), o câmbio não é o mais recente (EXT-011).
 *
 * Isso não é erro — a operação aconteceu. Pintar de vermelho ou usar o
 * componente de erro faz o investidor achar que a compra falhou, registrar de
 * novo, e ficar com duas compras reais no extrato (ADR-006). Por isso os avisos
 * saem no nível "aviso" da fundação, junto do resultado.
 *
 * O preço exibido é o `precoUnitario` da resposta, não a estimativa que estava
 * no formulário: o backend pode ter buscado preço novo (ASM-040).
 */
@Component({
  selector: 'app-resultado-operacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback],
  templateUrl: './resultado-operacao.html',
  styleUrl: './resultado-operacao.scss',
})
export class ResultadoOperacao {
  readonly operacao = input.required<Operacao>();

  protected readonly rotuloDoTipo = computed(() => opcaoDeTipo(this.operacao().tipo).rotulo);
  protected readonly ehVenda = computed(() => this.operacao().tipo === 'VENDA');

  protected readonly quando = computed(() => formatarDataHora(this.operacao().dataHora));
  protected readonly quantidade = computed(() => formatarNumero(this.operacao().quantidade, 0));
  protected readonly precoEfetivo = computed(() =>
    formatarMoeda(this.operacao().precoUnitario, this.operacao().moeda),
  );
  protected readonly total = computed(() =>
    formatarMoeda(this.operacao().valorTotal, this.operacao().moeda),
  );

  /** Ausente é ausente: nada de traço nem zero no lugar de um número que não veio. */
  protected readonly lucroRealizado = computed(() => {
    const valor = this.operacao().lucroRealizado;
    return valor === undefined ? null : formatarMoeda(valor, this.operacao().moeda);
  });

  protected readonly precoMedioNoMomento = computed(() => {
    const valor = this.operacao().precoMedioCompraNoMomento;
    return valor === undefined ? null : formatarMoeda(valor, this.operacao().moeda);
  });

  protected readonly avisos = computed(() => this.operacao().avisos ?? []);
}
