import { render } from '@testing-library/react';
import { BarraDeContribuicao } from '../contribuicao';
import { GraficoContribuicao } from './grafico-contribuicao';

function barra(ticker: string, valor: number): BarraDeContribuicao {
  return {
    ticker,
    nomeEmpresa: `Empresa ${ticker}`,
    valor,
    moedaOriginal: 'BRL',
    convertido: true,
  };
}

function montar(barras: BarraDeContribuicao[]) {
  return render(<GraficoContribuicao barras={barras} />).container;
}

describe('Gráfico de contribuição por ativo', () => {
  it('@spec:AC-198 apresenta as barras na ordem recebida, do maior ganho à maior perda', () => {
    const elemento = montar([barra('PETR4', 500), barra('AAPL', 200), barra('VALE3', -300)]);

    const tickers = [...elemento.querySelectorAll('[data-contribuicao-ticker]')].map((no) => no.textContent?.trim());
    expect(tickers).toEqual(['PETR4', 'AAPL', 'VALE3']);
    expect(elemento.querySelector('[data-contribuicao="PETR4"] [data-contribuicao-valor]')?.textContent).toContain('500,00');
  });

  it('@spec:AC-200 ganho e perda se distinguem sem cor: lado da barra, sinal e palavra', () => {
    const elemento = montar([barra('PETR4', 500), barra('VALE3', -500)]);

    const ganho = elemento.querySelector('[data-contribuicao="PETR4"]');
    const perda = elemento.querySelector('[data-contribuicao="VALE3"]');

    expect(ganho?.getAttribute('data-direcao')).toBe('alta');
    expect(perda?.getAttribute('data-direcao')).toBe('baixa');

    expect(ganho?.querySelector('[data-contribuicao-barra]')?.getAttribute('x')).toBe('50%');
    expect(perda?.querySelector('[data-contribuicao-barra]')?.getAttribute('x')).toBe('0%');

    expect(ganho?.querySelector('[data-sinal]')?.textContent).toBe('▲');
    expect(perda?.querySelector('[data-sinal]')?.textContent).toBe('▼');
    expect(ganho?.querySelector('[data-descricao]')?.textContent).toBe('alta');
    expect(perda?.querySelector('[data-descricao]')?.textContent).toBe('baixa');
  });

  it('@spec:AC-200 a linha do zero existe e separa os dois lados', () => {
    const elemento = montar([barra('PETR4', 500)]);

    expect(elemento.querySelector('[data-linha-zero]')?.getAttribute('x1')).toBe('50%');
  });

  it('@spec:AC-263 ganhos e perdas partem da mesma linha de zero e trazem sinal em texto', () => {
    const elemento = montar([barra('PETR4', 400), barra('VALE3', -200)]);
    const ganho = elemento.querySelector('[data-contribuicao="PETR4"]');
    const perda = elemento.querySelector('[data-contribuicao="VALE3"]');

    expect(ganho?.querySelector('[data-linha-zero]')?.getAttribute('x1')).toBe('50%');
    expect(perda?.querySelector('[data-linha-zero]')?.getAttribute('x1')).toBe('50%');
    expect(ganho?.querySelector('[data-contribuicao-barra]')?.getAttribute('x')).toBe('50%');
    expect(perda?.querySelector('[data-contribuicao-barra]')?.getAttribute('x')).toBe('25%');
    expect(ganho?.querySelector('[data-sinal]')?.textContent).toBe('▲');
    expect(perda?.querySelector('[data-sinal]')?.textContent).toBe('▼');
  });

  it('@spec:AC-201 não há eixo de tempo no gráfico', () => {
    const elemento = montar([barra('PETR4', 500)]);

    expect(elemento.textContent ?? '').not.toMatch(/evolu|hist[óo]ric|ao longo do tempo|per[íi]odo/i);
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });
});
