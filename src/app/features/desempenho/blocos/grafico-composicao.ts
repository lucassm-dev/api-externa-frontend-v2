import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { Composicao, FatiaDaComposicao } from '../composicao';
import { setoresDaRosca } from './setores-da-rosca';

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
interface FatiaDesenhada {
  ticker: string;
  nomeEmpresa: string;
  valor: number;
  participacao: number;
  cor: string;
  valorFormatado: string;
  participacaoFormatada: string;
  caminho: string;
}

const CORES_DE_SERIE = 8;

function agruparCauda(fatias: FatiaDaComposicao[]): FatiaDaComposicao[] {
  if (fatias.length <= CORES_DE_SERIE) {
    return fatias;
  }

  const principais = fatias.slice(0, CORES_DE_SERIE);
  const cauda = fatias.slice(CORES_DE_SERIE);
  return [
    ...principais,
    {
      ticker: 'DEMAIS',
      nomeEmpresa: `${cauda.length} ativo${cauda.length === 1 ? '' : 's'} agrupado${cauda.length === 1 ? '' : 's'}`,
      valor: cauda.reduce((soma, fatia) => soma + fatia.valor, 0),
      participacao: cauda.reduce((soma, fatia) => soma + fatia.participacao, 0),
      moedaOriginal: 'BRL',
      convertido: cauda.every((fatia) => fatia.convertido),
    },
  ];
}

@Component({
  selector: 'app-grafico-composicao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MensagemFeedback],
  templateUrl: './grafico-composicao.html',
  styleUrl: './grafico-composicao.scss',
})
export class GraficoComposicao {
  readonly composicao = input.required<Composicao>();
  protected readonly fatiaAtiva = signal<string | null>(null);

  protected readonly fatias = computed<FatiaDesenhada[]>(() => {
    const fatias = agruparCauda(this.composicao().fatias);
    const setores = setoresDaRosca(fatias.map((fatia) => fatia.participacao));

    return fatias.map((fatia, indice) => ({
      ticker: fatia.ticker,
      nomeEmpresa: fatia.nomeEmpresa,
      valor: fatia.valor,
      participacao: fatia.participacao,
      cor: indice < CORES_DE_SERIE ? `var(--cor-serie-${indice + 1})` : 'var(--cor-serie-resto)',
      valorFormatado: formatarReal(fatia.valor),
      participacaoFormatada: `${formatarNumero(fatia.participacao, 1)}%`,
      caminho: setores.find((setor) => setor.indice === indice)?.caminho ?? '',
    }));
  });

  protected readonly soma = computed(() => formatarReal(this.composicao().soma));
  protected readonly valorDeMercado = computed(() =>
    formatarReal(this.composicao().valorDeMercado),
  );
  protected readonly descricaoRosca = computed(
    () =>
      `Composição da carteira em ${this.fatias().length} setores. Valor de mercado ${this.valorDeMercado()}.`,
  );

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

  protected destacar(ticker: string): void {
    this.fatiaAtiva.set(ticker);
  }

  protected limparDestaque(ticker: string): void {
    if (this.fatiaAtiva() === ticker) {
      this.fatiaAtiva.set(null);
    }
  }
}
