import { render } from '@testing-library/react';
import { BarraDeRealizado } from '../realizado-por-ticker';
import { GraficoRealizado } from './grafico-realizado';

function montar(barras: BarraDeRealizado[], total: number) {
  return render(<GraficoRealizado barras={barras} total={total} />).container;
}

describe('Gráfico de resultado realizado por ativo', () => {
  it('@spec:AC-202 cada ticker apurado aparece com o valor, e o total exibido é o do servidor', () => {
    const elemento = montar(
      [
        { ticker: 'VALE3', valor: 600 },
        { ticker: 'MGLU3', valor: -100 },
      ],
      500,
    );

    const tickers = [...elemento.querySelectorAll('[data-realizado-ticker]')].map((no) => no.textContent?.trim());
    expect(tickers).toEqual(['VALE3', 'MGLU3']);
    expect(elemento.querySelector('[data-realizado="MGLU3"] [data-realizado-valor]')?.textContent).toContain('100,00');
    expect(elemento.querySelector('[data-total-realizado]')?.textContent).toContain('500,00');
  });

  it('@spec:AC-202 perda apurada se distingue do ganho sem depender de cor', () => {
    const elemento = montar(
      [
        { ticker: 'VALE3', valor: 600 },
        { ticker: 'MGLU3', valor: -100 },
      ],
      500,
    );

    expect(elemento.querySelector('[data-realizado="VALE3"]')?.getAttribute('data-direcao')).toBe('alta');
    expect(elemento.querySelector('[data-realizado="MGLU3"]')?.getAttribute('data-direcao')).toBe('baixa');
    expect(elemento.querySelector('[data-realizado="MGLU3"] [data-sinal]')?.textContent).toBe('▼');
  });

  it('@spec:AC-263 ordena do maior ganho à maior perda, usa zero comum e sela o resultado', () => {
    const elemento = montar(
      [
        { ticker: 'MGLU3', valor: -100 },
        { ticker: 'ITUB4', valor: 0 },
        { ticker: 'VALE3', valor: 600 },
      ],
      500,
    );

    const tickers = [...elemento.querySelectorAll('[data-realizado-ticker]')].map((no) => no.textContent?.trim());
    expect(tickers).toEqual(['VALE3', 'ITUB4', 'MGLU3']);
    expect(elemento.querySelector('[data-realizado="VALE3"] [data-linha-zero]')?.getAttribute('x1')).toBe('50%');
    expect(elemento.querySelector('[data-realizado="MGLU3"] [data-sinal]')?.textContent).toBe('▼');
    expect(elemento.querySelector('[data-realizado="VALE3"] [data-selo]')?.textContent).toContain('Ganho');
    expect(elemento.querySelector('[data-realizado="MGLU3"] [data-selo]')?.textContent).toContain('Perda');
  });

  it('@spec:AC-203 sem venda nenhuma explica em vez de desenhar gráfico vazio', () => {
    const elemento = montar([], 0);

    expect(elemento.querySelector('[data-sem-realizado]')?.textContent).toContain('depois da primeira venda');
    expect(elemento.querySelectorAll('[data-realizado-barra]').length).toBe(0);
  });

  it('@spec:AC-204 não há eixo de tempo no gráfico', () => {
    const elemento = montar([{ ticker: 'VALE3', valor: 600 }], 600);

    expect(elemento.textContent ?? '').not.toMatch(/evolu|hist[óo]ric|ao longo do tempo|per[íi]odo/i);
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });
});
