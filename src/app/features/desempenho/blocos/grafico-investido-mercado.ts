import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { Variacao } from '../../../shared/variacao/variacao';

/**
 * "Quanto entrou × quanto vale hoje" — duas barras por ticker no mesmo eixo:
 * custo e valor de mercado. A diferença entre elas é o ganho ou a perda ainda
 * não realizado, e aparece em texto, com sinal.
 *
 * As duas barras de todos os tickers compartilham uma escala só, senão a de um
 * ativo maior encolheria a leitura de outro. Retrato do agora: não há eixo de
 * tempo nem tendência — o produto não guarda série histórica (ADR-010).
 *
 * Cada linha é focável e, no foco ou no ponteiro, revela o mesmo detalhe em
 * texto; Esc devolve o gráfico ao repouso (AC-280).
 */
export interface PosicaoInvestidoMercado {
  ticker: string;
  nomeEmpresa: string;
  investido: number;
  valorMercado: number;
}

type Direcao = 'alta' | 'baixa' | 'estavel';

interface BarraDesenhada {
  ticker: string;
  nomeEmpresa: string;
  direcao: Direcao;
  diferenca: number;
  larguraInvestido: number;
  larguraMercado: number;
  investidoFormatado: string;
  mercadoFormatado: string;
  diferencaFormatada: string;
}

@Component({
  selector: 'app-grafico-investido-mercado',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Variacao],
  templateUrl: './grafico-investido-mercado.html',
  styleUrl: './grafico-investido-mercado.scss',
})
export class GraficoInvestidoMercado {
  readonly posicoes = input.required<PosicaoInvestidoMercado[]>();

  protected readonly ativo = signal<string | null>(null);

  protected readonly escala = computed(() =>
    Math.max(
      ...this.posicoes().flatMap((posicao) => [
        Math.abs(posicao.investido),
        Math.abs(posicao.valorMercado),
      ]),
      0,
    ),
  );

  protected readonly escalaFormatada = computed(() => formatarReal(this.escala()));

  protected readonly desenhadas = computed<BarraDesenhada[]>(() => {
    const escala = this.escala();
    const largura = (valor: number) => (escala === 0 ? 0 : (Math.abs(valor) / escala) * 100);

    return this.posicoes().map((posicao) => {
      const diferenca = posicao.valorMercado - posicao.investido;
      const direcao: Direcao = diferenca > 0 ? 'alta' : diferenca < 0 ? 'baixa' : 'estavel';
      const sinal = diferenca > 0 ? '+' : diferenca < 0 ? '−' : '';
      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        direcao,
        diferenca,
        larguraInvestido: largura(posicao.investido),
        larguraMercado: largura(posicao.valorMercado),
        investidoFormatado: formatarReal(posicao.investido),
        mercadoFormatado: formatarReal(posicao.valorMercado),
        diferencaFormatada: `${sinal}${formatarReal(Math.abs(diferenca))}`,
      };
    });
  });

  protected destacar(ticker: string): void {
    this.ativo.set(ticker);
  }

  protected limpar(ticker: string): void {
    if (this.ativo() === ticker) {
      this.ativo.set(null);
    }
  }

  protected repousar(): void {
    this.ativo.set(null);
  }
}
