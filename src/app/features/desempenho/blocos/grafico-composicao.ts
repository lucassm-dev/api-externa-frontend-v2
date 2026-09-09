import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { Composicao, FatiaDaComposicao } from '../composicao';

/**
 * "Estou concentrado demais em alguma coisa?" — barras ordenadas da maior
 * fatia à menor, cada uma com ticker, valor e participação em texto. A cor
 * identifica o ativo; nunca é a única forma de ler a fatia.
 *
 * Retrato do agora: não há eixo de tempo aqui, e não pode haver — o sistema
 * não guarda série histórica (ADR-010).
 *
 * Quando a soma das fatias não fecha com o valor de mercado do consolidado, o
 * gráfico continua visível mas confessa: uma composição que não bate com o
 * total é bonita e mentirosa se não disser nada.
 */
interface FatiaDesenhada extends FatiaDaComposicao {
  cor: string;
  valorFormatado: string;
  participacaoFormatada: string;
}

const CORES_DE_SERIE = 8;

@Component({
  selector: 'app-grafico-composicao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback],
  templateUrl: './grafico-composicao.html',
  styleUrl: './grafico-composicao.scss',
})
export class GraficoComposicao {
  readonly composicao = input.required<Composicao>();

  protected readonly fatias = computed<FatiaDesenhada[]>(() =>
    this.composicao().fatias.map((fatia, indice) => ({
      ...fatia,
      cor:
        indice < CORES_DE_SERIE ? `var(--cor-serie-${indice + 1})` : 'var(--cor-serie-resto)',
      valorFormatado: formatarReal(fatia.valor),
      participacaoFormatada: `${formatarNumero(fatia.participacao, 1)}%`,
    })),
  );

  protected readonly soma = computed(() => formatarReal(this.composicao().soma));

  protected readonly ressalva = computed(() => {
    const composicao = this.composicao();
    if (composicao.fecha) {
      return null;
    }
    const semMoeda = composicao.fatias.filter((fatia) => !fatia.convertido).map((f) => f.ticker);
    const diferenca = formatarReal(Math.abs(composicao.diferenca));
    const detalhe = semMoeda.length
      ? ` A moeda de ${semMoeda.join(', ')} não foi encontrada no catálogo de ações, então esses valores não foram convertidos.`
      : '';
    return (
      `A soma das fatias (${formatarReal(composicao.soma)}) não fecha com o valor de mercado ` +
      `da carteira (${formatarReal(composicao.valorDeMercado)}): diferença de ${diferenca}.` +
      `${detalhe} Leia a composição com essa ressalva.`
    );
  });
}
