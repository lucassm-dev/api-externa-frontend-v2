import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraDeContribuicao } from '../contribuicao';
import { GraficoContribuicao } from './grafico-contribuicao';

function barra(ticker: string, valor: number): BarraDeContribuicao {
  return { ticker, nomeEmpresa: `Empresa ${ticker}`, valor, moedaOriginal: 'BRL', convertido: true };
}

describe('Gráfico de contribuição por ativo', () => {
  let fixture: ComponentFixture<GraficoContribuicao>;

  async function montar(barras: BarraDeContribuicao[]) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoContribuicao);
    fixture.componentRef.setInput('barras', barras);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-198 apresenta as barras na ordem recebida, do maior ganho à maior perda', async () => {
    const elemento = await montar([barra('PETR4', 500), barra('AAPL', 200), barra('VALE3', -300)]);

    const tickers = [...elemento.querySelectorAll('[data-contribuicao-ticker]')].map((no) =>
      no.textContent?.trim(),
    );
    expect(tickers).toEqual(['PETR4', 'AAPL', 'VALE3']);
    expect(elemento.querySelector('[data-contribuicao="PETR4"] [data-contribuicao-valor]')?.textContent)
      .toContain('500,00');
  });

  it('@spec:AC-200 ganho e perda se distinguem sem cor: lado da barra, sinal e palavra', async () => {
    const elemento = await montar([barra('PETR4', 500), barra('VALE3', -500)]);

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

  it('@spec:AC-200 a linha do zero existe e separa os dois lados', async () => {
    const elemento = await montar([barra('PETR4', 500)]);

    expect(elemento.querySelector('[data-linha-zero]')?.getAttribute('x1')).toBe('50%');
  });

  it('@spec:AC-201 não há eixo de tempo no gráfico', async () => {
    const elemento = await montar([barra('PETR4', 500)]);

    expect(elemento.textContent ?? '').not.toMatch(/evolu|hist[óo]ric|ao longo do tempo|per[íi]odo/i);
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });
});
