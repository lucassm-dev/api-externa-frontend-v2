import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import { Variacao } from '../../../shared/variacao/variacao';
import { blocosDoMapa } from './blocos-do-mapa';

/**
 * "Onde meu dinheiro está?" — cada posição aberta é um bloco de área
 * proporcional ao seu valor de mercado de hoje. É um retrato do agora: sem
 * eixo de tempo, sem tendência, sem comparação com período anterior (ADR-010).
 *
 * A cor diz o sinal do resultado não realizado, mas nunca sozinha: o bloco
 * carrega o glifo (▲/▼), e a legenda repete ticker, valor, participação e o
 * resultado com sinal e palavra. Quem não distingue as cores lê o mapa inteiro.
 *
 * Cada bloco é focável pelo teclado e revela, em texto, o mesmo detalhe que o
 * ponteiro revelaria; Esc devolve o mapa ao repouso (AC-280).
 */
export interface PosicaoNoMapa {
  ticker: string;
  nomeEmpresa: string;
  /** Valor de mercado da posição, em real. */
  valorDeMercado: number;
  /** Resultado não realizado da posição, em real, com sinal. */
  resultado: number;
}

type Sinal = 'alta' | 'baixa' | 'estavel';

const GLIFO: Record<Sinal, string> = { alta: '▲', baixa: '▼', estavel: '–' };
const PALAVRA: Record<Sinal, string> = { alta: 'ganho', baixa: 'perda', estavel: 'sem resultado' };
const COR: Record<Sinal, string> = {
  alta: 'var(--cor-alta-bloco)',
  baixa: 'var(--cor-baixa-bloco)',
  estavel: 'var(--cor-estavel-bloco)',
};

/** Abaixo disto o rótulo no bloco não cabe legível; a legenda continua com tudo. */
const LARGURA_MINIMA_ROTULO = 16;
const ALTURA_MINIMA_ROTULO = 12;

const REPOUSO =
  'Passe o ponteiro ou use Tab num bloco para ver ticker, valor de mercado, participação e resultado.';

interface BlocoDesenhado {
  ticker: string;
  nomeEmpresa: string;
  resultado: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  sinal: Sinal;
  glifo: string;
  cor: string;
  valorFormatado: string;
  participacaoFormatada: string;
  rotuloVisivel: boolean;
  detalhe: string;
}

@Component({
  selector: 'app-grafico-mapa-posicoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Variacao],
  templateUrl: './grafico-mapa-posicoes.html',
  styleUrl: './grafico-mapa-posicoes.scss',
})
export class GraficoMapaPosicoes {
  readonly posicoes = input.required<PosicaoNoMapa[]>();
  protected readonly blocoAtivo = signal<string | null>(null);

  protected readonly blocos = computed<BlocoDesenhado[]>(() => {
    const posicoes = this.posicoes();
    const somaMercado = posicoes.reduce((soma, p) => soma + Math.max(p.valorDeMercado, 0), 0);

    return blocosDoMapa(posicoes.map((p) => p.valorDeMercado)).map((bloco) => {
      const posicao = posicoes[bloco.indice];
      const participacao =
        somaMercado > 0 ? (Math.max(posicao.valorDeMercado, 0) / somaMercado) * 100 : 0;
      const sinal: Sinal =
        posicao.resultado > 0 ? 'alta' : posicao.resultado < 0 ? 'baixa' : 'estavel';
      const valorFormatado = formatarReal(posicao.valorDeMercado);
      const participacaoFormatada = `${formatarNumero(participacao, 1)}%`;

      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        resultado: posicao.resultado,
        x: bloco.retangulo.x,
        y: bloco.retangulo.y,
        largura: bloco.retangulo.largura,
        altura: bloco.retangulo.altura,
        sinal,
        glifo: GLIFO[sinal],
        cor: COR[sinal],
        valorFormatado,
        participacaoFormatada,
        rotuloVisivel:
          bloco.retangulo.largura >= LARGURA_MINIMA_ROTULO &&
          bloco.retangulo.altura >= ALTURA_MINIMA_ROTULO,
        detalhe:
          `${posicao.ticker}, ${posicao.nomeEmpresa}. ` +
          `Valor de mercado ${valorFormatado}, ${participacaoFormatada} da carteira. ` +
          `Resultado: ${PALAVRA[sinal]} de ${formatarReal(Math.abs(posicao.resultado))}.`,
      };
    });
  });

  protected readonly descricaoMapa = computed(
    () =>
      `Mapa de ${this.blocos().length} posição(ões) abertas. A área de cada bloco é ` +
      `proporcional ao seu valor de mercado.`,
  );

  protected readonly detalhe = computed(() => {
    const ativo = this.blocoAtivo();
    return this.blocos().find((bloco) => bloco.ticker === ativo)?.detalhe ?? REPOUSO;
  });

  protected ativar(ticker: string): void {
    this.blocoAtivo.set(ticker);
  }

  protected repousar(): void {
    this.blocoAtivo.set(null);
  }

  protected aoEscapar(evento: Event): void {
    this.blocoAtivo.set(null);
    (evento.target as { blur?: () => void } | null)?.blur?.();
  }
}
