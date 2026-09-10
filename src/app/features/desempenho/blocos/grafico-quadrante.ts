import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { Variacao } from '../../../shared/variacao/variacao';

/**
 * "Quem pesa e quem rende?" — cada posição aberta é uma bolha: o eixo horizontal
 * é a participação na carteira, o vertical é a rentabilidade, e o tamanho da
 * bolha é o valor de mercado. O canto de baixo à direita — participação alta,
 * rentabilidade negativa — é o peso morto, e o quadrante deixa isso visível.
 *
 * É um retrato do agora: sem eixo de tempo, sem tendência, sem comparação com
 * período anterior — o produto não guarda série histórica (ADR-010).
 *
 * Cada bolha é focável pelo teclado e revela, em texto, o mesmo detalhe que o
 * ponteiro revelaria; Esc devolve o quadrante ao repouso (AC-280).
 */
export interface PosicaoNoQuadrante {
  ticker: string;
  nomeEmpresa: string;
  /** Valor de mercado da posição, em real. Define a participação e o tamanho da bolha. */
  valorDeMercado: number;
  /** Rentabilidade da posição, em pontos percentuais, com sinal. */
  rentabilidade: number;
}

type Sinal = 'alta' | 'baixa' | 'estavel';

const COR: Record<Sinal, string> = {
  alta: 'var(--cor-alta)',
  baixa: 'var(--cor-baixa)',
  estavel: 'var(--cor-estavel)',
};

/** Moldura do desenho, em unidades do viewBox 0..100. */
const MOLDURA = { x0: 16, largura: 80, yTopo: 6, altura: 82 } as const;
const Y_ZERO = MOLDURA.yTopo + MOLDURA.altura / 2;

const RAIO_MINIMO = 2.5;
const RAIO_MAXIMO = 9;

/** Acima disto a bolha comporta o ticker legível; abaixo, só a legenda o traz. */
const RAIO_ROTULO = 5;

const REPOUSO =
  'Passe o ponteiro ou use Tab numa bolha para ver participação na carteira, rentabilidade e valor de mercado.';

interface BolhaDesenhada {
  ticker: string;
  nomeEmpresa: string;
  rentabilidade: number;
  cx: number;
  cy: number;
  r: number;
  sinal: Sinal;
  cor: string;
  participacaoFormatada: string;
  rentabilidadeFormatada: string;
  valorFormatado: string;
  rotuloVisivel: boolean;
  detalhe: string;
}

@Component({
  selector: 'app-grafico-quadrante',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Variacao],
  templateUrl: './grafico-quadrante.html',
  styleUrl: './grafico-quadrante.scss',
})
export class GraficoQuadrante {
  readonly posicoes = input.required<PosicaoNoQuadrante[]>();

  protected readonly moldura = MOLDURA;
  protected readonly yZero = Y_ZERO;

  protected readonly bolhaAtiva = signal<string | null>(null);

  protected readonly bolhas = computed<BolhaDesenhada[]>(() => {
    const posicoes = this.posicoes();
    const somaMercado = posicoes.reduce((soma, p) => soma + Math.max(p.valorDeMercado, 0), 0);
    const maxParticipacao =
      somaMercado > 0
        ? Math.max(...posicoes.map((p) => Math.max(p.valorDeMercado, 0) / somaMercado)) * 100
        : 0;
    const maxRentabilidade = Math.max(...posicoes.map((p) => Math.abs(p.rentabilidade)), 0);
    const maxValor = Math.max(...posicoes.map((p) => Math.max(p.valorDeMercado, 0)), 0);

    return posicoes.map((posicao) => {
      const participacao =
        somaMercado > 0 ? (Math.max(posicao.valorDeMercado, 0) / somaMercado) * 100 : 0;
      const sinal: Sinal =
        posicao.rentabilidade > 0 ? 'alta' : posicao.rentabilidade < 0 ? 'baixa' : 'estavel';
      const prefixo = posicao.rentabilidade > 0 ? '+' : posicao.rentabilidade < 0 ? '−' : '';

      const cx =
        MOLDURA.x0 +
        (maxParticipacao === 0 ? 0 : (participacao / maxParticipacao) * MOLDURA.largura);
      const cy =
        Y_ZERO -
        (maxRentabilidade === 0
          ? 0
          : (posicao.rentabilidade / maxRentabilidade) * (MOLDURA.altura / 2));
      const r =
        RAIO_MINIMO +
        (maxValor === 0
          ? 0
          : Math.sqrt(Math.max(posicao.valorDeMercado, 0) / maxValor) *
            (RAIO_MAXIMO - RAIO_MINIMO));

      const participacaoFormatada = `${formatarNumero(participacao, 1)}%`;
      const rentabilidadeFormatada = `${prefixo}${formatarNumero(Math.abs(posicao.rentabilidade), 2)}%`;
      const valorFormatado = formatarReal(posicao.valorDeMercado);

      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        rentabilidade: posicao.rentabilidade,
        cx,
        cy,
        r,
        sinal,
        cor: COR[sinal],
        participacaoFormatada,
        rentabilidadeFormatada,
        valorFormatado,
        rotuloVisivel: r >= RAIO_ROTULO,
        detalhe:
          `${posicao.ticker}, ${posicao.nomeEmpresa}. ` +
          `Participação ${participacaoFormatada} da carteira. ` +
          `Rentabilidade ${rentabilidadeFormatada}. ` +
          `Valor de mercado ${valorFormatado}.`,
      };
    });
  });

  /** Rótulos de ponta dos eixos, para dar leitura de grandeza ao desenho. */
  protected readonly escalaParticipacao = computed(() => {
    const soma = this.posicoes().reduce((s, p) => s + Math.max(p.valorDeMercado, 0), 0);
    const max =
      soma > 0
        ? Math.max(...this.posicoes().map((p) => Math.max(p.valorDeMercado, 0) / soma)) * 100
        : 0;
    return `${formatarNumero(max, 1)}%`;
  });

  protected readonly escalaRentabilidade = computed(() => {
    const max = Math.max(...this.posicoes().map((p) => Math.abs(p.rentabilidade)), 0);
    return `${formatarNumero(max, 2)}%`;
  });

  protected readonly descricao = computed(
    () =>
      `Quadrante de ${this.bolhas().length} posição(ões) abertas. O eixo horizontal é a ` +
      `participação na carteira; o vertical, a rentabilidade. O tamanho da bolha é o valor de mercado.`,
  );

  protected readonly detalhe = computed(() => {
    const ativa = this.bolhaAtiva();
    return this.bolhas().find((bolha) => bolha.ticker === ativa)?.detalhe ?? REPOUSO;
  });

  protected ativar(ticker: string): void {
    this.bolhaAtiva.set(ticker);
  }

  protected repousar(): void {
    this.bolhaAtiva.set(null);
  }

  protected aoEscapar(evento: Event): void {
    this.bolhaAtiva.set(null);
    (evento.target as { blur?: () => void } | null)?.blur?.();
  }
}
