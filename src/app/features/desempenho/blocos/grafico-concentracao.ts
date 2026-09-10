import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatarNumero, formatarReal } from '../../../core/formatacao/formatacao';
import {
  Concentracao,
  FaixaConcentracao,
  concentracaoDaCarteira,
} from './concentracao-da-carteira';

/**
 * "Quão espalhada está a carteira?" — um arco mostra que fatia do valor está nos
 * três maiores ativos, com o percentual grande no centro e a faixa explicada em
 * texto logo abaixo.
 *
 * A faixa descreve a distribuição de hoje; não é recomendação de compra ou
 * venda. Retrato do agora: sem eixo de tempo, sem tendência, sem comparação com
 * período anterior (ADR-010).
 */
export interface PosicaoConcentracao {
  ticker: string;
  valorDeMercado: number;
}

interface TextoDaFaixa {
  nome: string;
  explicacao: string;
}

const FAIXAS: Record<FaixaConcentracao, TextoDaFaixa> = {
  dispersa: {
    nome: 'dispersa',
    explicacao:
      'Os três maiores ativos somam menos de 40% da carteira: o valor está espalhado por muitas posições.',
  },
  media: {
    nome: 'média',
    explicacao:
      'Os três maiores ativos somam entre 40% e 70% da carteira: parte relevante do valor está em poucas posições.',
  },
  concentrada: {
    nome: 'concentrada',
    explicacao:
      'Os três maiores ativos somam 70% ou mais da carteira: a maior parte do valor está em poucas posições.',
  },
};

const RAIO = 40;
const CENTRO_X = 50;
const BASE_Y = 52;

interface PontoDoArco {
  x: number;
  y: number;
}

function ponto(fracao: number, raio: number): PontoDoArco {
  const angulo = Math.PI * (1 - fracao);
  return {
    x: CENTRO_X + raio * Math.cos(angulo),
    y: BASE_Y - raio * Math.sin(angulo),
  };
}

function arco(fracao: number, raio = RAIO): string {
  const inicio = ponto(0, raio);
  const fim = ponto(Math.max(0, Math.min(1, fracao)), raio);
  return `M ${inicio.x} ${inicio.y} A ${raio} ${raio} 0 0 1 ${fim.x} ${fim.y}`;
}

interface MaiorAtivo {
  ticker: string;
  valorFormatado: string;
  participacaoFormatada: string;
}

@Component({
  selector: 'app-grafico-concentracao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './grafico-concentracao.html',
  styleUrl: './grafico-concentracao.scss',
})
export class GraficoConcentracao {
  readonly posicoes = input.required<PosicaoConcentracao[]>();

  protected readonly concentracao = computed<Concentracao | null>(() =>
    concentracaoDaCarteira(this.posicoes().map((posicao) => posicao.valorDeMercado)),
  );

  protected readonly percentualFormatado = computed(() => {
    const c = this.concentracao();
    return c ? `${formatarNumero(c.percentualTopo, 1)}%` : '';
  });

  protected readonly trilha = arco(1);

  protected readonly preenchido = computed(() => {
    const c = this.concentracao();
    return c ? arco(c.fracaoTopo) : '';
  });

  protected readonly faixa = computed<TextoDaFaixa | null>(() => {
    const c = this.concentracao();
    return c ? FAIXAS[c.faixa] : null;
  });

  protected readonly maiores = computed<MaiorAtivo[]>(() => {
    const c = this.concentracao();
    if (!c) {
      return [];
    }
    const total = this.posicoes().reduce(
      (soma, posicao) => soma + Math.max(posicao.valorDeMercado, 0),
      0,
    );
    return [...this.posicoes()]
      .filter((posicao) => posicao.valorDeMercado > 0)
      .sort((a, b) => b.valorDeMercado - a.valorDeMercado)
      .slice(0, c.ativosNoTopo)
      .map((posicao) => ({
        ticker: posicao.ticker,
        valorFormatado: formatarReal(posicao.valorDeMercado),
        participacaoFormatada:
          total > 0 ? `${formatarNumero((posicao.valorDeMercado / total) * 100, 1)}%` : '0,0%',
      }));
  });

  protected readonly resumo = computed(() => {
    const c = this.concentracao();
    if (!c) {
      return '';
    }
    return (
      `${this.percentualFormatado()} da carteira está nos seus ${c.ativosNoTopo} maiores ` +
      `${c.ativosNoTopo === 1 ? 'ativo' : 'ativos'}.`
    );
  });
}
