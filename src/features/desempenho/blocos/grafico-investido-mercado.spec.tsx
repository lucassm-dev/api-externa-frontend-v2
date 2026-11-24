import { fireEvent, render } from '@testing-library/react';
import { GraficoInvestidoMercado, PosicaoInvestidoMercado } from './grafico-investido-mercado';

function posicao(ticker: string, investido: number, valorMercado: number): PosicaoInvestidoMercado {
  return { ticker, nomeEmpresa: `Empresa ${ticker}`, investido, valorMercado };
}

function montar(posicoes: PosicaoInvestidoMercado[]) {
  return render(<GraficoInvestidoMercado posicoes={posicoes} />).container;
}

describe('Gráfico de investido × valor de mercado', () => {
  it('@spec:AC-277 cada ticker traz duas barras — custo e valor de hoje — na mesma escala', () => {
    const elemento = montar([posicao('PETR4', 1000, 1500), posicao('VALE3', 2000, 1600)]);

    // escala comum = 2000, o maior valor entre todos os investidos e mercados
    const maior = elemento.querySelector('[data-investido-mercado="VALE3"]')!;
    expect(maior.querySelector('[data-barra-investido]')?.getAttribute('width')).toBe('100%');
    expect(maior.querySelector('[data-barra-mercado]')?.getAttribute('width')).toBe('80%');

    const menor = elemento.querySelector('[data-investido-mercado="PETR4"]')!;
    expect(menor.querySelector('[data-barra-investido]')?.getAttribute('width')).toBe('50%');
    expect(menor.querySelector('[data-barra-mercado]')?.getAttribute('width')).toBe('75%');

    expect(elemento.querySelectorAll('[data-barra-investido]').length).toBe(2);
    expect(elemento.querySelectorAll('[data-barra-mercado]').length).toBe(2);
  });

  it('@spec:AC-277 a diferença entre investido e mercado aparece em texto, com sinal', () => {
    const elemento = montar([posicao('PETR4', 1000, 1500), posicao('VALE3', 2000, 1600)]);

    const ganho = elemento.querySelector('[data-investido-mercado="PETR4"]')!;
    const perda = elemento.querySelector('[data-investido-mercado="VALE3"]')!;

    expect(ganho.getAttribute('data-direcao')).toBe('alta');
    expect(perda.getAttribute('data-direcao')).toBe('baixa');

    const textoGanho = ganho.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(textoGanho).toContain('▲');
    expect(textoGanho).toContain('500,00');

    const textoPerda = perda.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(textoPerda).toContain('▼');
    expect(textoPerda).toContain('400,00');
  });

  it('@spec:AC-277 investido e mercado empatados: diferença estável, sem sinal de alta nem de baixa', () => {
    const elemento = montar([posicao('ITUB4', 1000, 1000)]);
    const linha = elemento.querySelector('[data-investido-mercado="ITUB4"]')!;

    expect(linha.getAttribute('data-direcao')).toBe('estavel');
    const texto = linha.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(texto).not.toContain('▲');
    expect(texto).not.toContain('▼');
  });

  it('@spec:AC-280 cada linha é focável e o foco revela o mesmo detalhe em texto; Esc volta ao repouso', () => {
    const elemento = montar([posicao('PETR4', 1000, 1500)]);
    const linha = elemento.querySelector('[data-investido-mercado="PETR4"]') as HTMLElement;
    expect(linha.tabIndex).toBe(0);

    const detalhe = linha.querySelector('[data-investido-mercado-detalhe]') as HTMLElement;
    expect(detalhe.hidden).toBe(true);

    fireEvent.focus(linha);
    expect(detalhe.hidden).toBe(false);
    expect(detalhe.textContent).toContain('1.000,00');
    expect(detalhe.textContent).toContain('1.500,00');

    fireEvent.keyDown(linha, { key: 'Escape' });
    expect(detalhe.hidden).toBe(true);
  });

  it('@spec:AC-280 o ponteiro revela o mesmo detalhe que o foco revelaria', () => {
    const elemento = montar([posicao('PETR4', 1000, 1500)]);
    const linha = elemento.querySelector('[data-investido-mercado="PETR4"]') as HTMLElement;
    const detalhe = linha.querySelector('[data-investido-mercado-detalhe]') as HTMLElement;

    fireEvent.mouseEnter(linha);
    expect(detalhe.hidden).toBe(false);

    fireEvent.mouseLeave(linha);
    expect(detalhe.hidden).toBe(true);
  });

  it('@spec:AC-281 nenhum gráfico novo inventa passado: sem eixo de tempo, tendência ou período', () => {
    const elemento = montar([posicao('PETR4', 1000, 1500)]);

    expect(elemento.textContent ?? '').not.toMatch(/evolu|hist[óo]ric|ao longo do tempo|per[íi]odo|tend[êe]ncia/i);
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });

  it('sem posição aberta explica em vez de desenhar barra vazia', () => {
    const elemento = montar([]);

    expect(elemento.querySelector('[data-sem-investido-mercado]')).not.toBeNull();
    expect(elemento.querySelectorAll('[data-barra-investido]').length).toBe(0);
  });
});
