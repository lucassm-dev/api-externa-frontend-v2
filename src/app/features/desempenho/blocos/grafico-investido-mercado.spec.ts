import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoInvestidoMercado, PosicaoInvestidoMercado } from './grafico-investido-mercado';

function posicao(
  ticker: string,
  investido: number,
  valorMercado: number,
): PosicaoInvestidoMercado {
  return { ticker, nomeEmpresa: `Empresa ${ticker}`, investido, valorMercado };
}

describe('Gráfico de investido × valor de mercado', () => {
  let fixture: ComponentFixture<GraficoInvestidoMercado>;

  async function montar(posicoes: PosicaoInvestidoMercado[]) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoInvestidoMercado);
    fixture.componentRef.setInput('posicoes', posicoes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-277 cada ticker traz duas barras — custo e valor de hoje — na mesma escala', async () => {
    const elemento = await montar([posicao('PETR4', 1000, 1500), posicao('VALE3', 2000, 1600)]);

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

  it('@spec:AC-277 a diferença entre investido e mercado aparece em texto, com sinal', async () => {
    const elemento = await montar([posicao('PETR4', 1000, 1500), posicao('VALE3', 2000, 1600)]);

    const ganho = elemento.querySelector('[data-investido-mercado="PETR4"]')!;
    const perda = elemento.querySelector('[data-investido-mercado="VALE3"]')!;

    expect(ganho.getAttribute('data-direcao')).toBe('alta');
    expect(perda.getAttribute('data-direcao')).toBe('baixa');

    const textoGanho =
      ganho.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(textoGanho).toContain('▲');
    expect(textoGanho).toContain('500,00');

    const textoPerda =
      perda.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(textoPerda).toContain('▼');
    expect(textoPerda).toContain('400,00');
  });

  it('@spec:AC-277 investido e mercado empatados: diferença estável, sem sinal de alta nem de baixa', async () => {
    const elemento = await montar([posicao('ITUB4', 1000, 1000)]);
    const linha = elemento.querySelector('[data-investido-mercado="ITUB4"]')!;

    expect(linha.getAttribute('data-direcao')).toBe('estavel');
    const texto = linha.querySelector('[data-investido-mercado-diferenca]')?.textContent ?? '';
    expect(texto).not.toContain('▲');
    expect(texto).not.toContain('▼');
  });

  it('@spec:AC-280 cada linha é focável e o foco revela o mesmo detalhe em texto; Esc volta ao repouso', async () => {
    const elemento = await montar([posicao('PETR4', 1000, 1500)]);
    const linha = elemento.querySelector('[data-investido-mercado="PETR4"]') as HTMLElement;
    expect(linha.tabIndex).toBe(0);

    const detalhe = linha.querySelector('[data-investido-mercado-detalhe]') as HTMLElement;
    expect(detalhe.hidden).toBe(true);

    linha.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(detalhe.hidden).toBe(false);
    expect(detalhe.textContent).toContain('1.000,00');
    expect(detalhe.textContent).toContain('1.500,00');

    linha.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(detalhe.hidden).toBe(true);
  });

  it('@spec:AC-280 o ponteiro revela o mesmo detalhe que o foco revelaria', async () => {
    const elemento = await montar([posicao('PETR4', 1000, 1500)]);
    const linha = elemento.querySelector('[data-investido-mercado="PETR4"]') as HTMLElement;
    const detalhe = linha.querySelector('[data-investido-mercado-detalhe]') as HTMLElement;

    linha.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(detalhe.hidden).toBe(false);

    linha.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();
    expect(detalhe.hidden).toBe(true);
  });

  it('@spec:AC-281 nenhum gráfico novo inventa passado: sem eixo de tempo, tendência ou período', async () => {
    const elemento = await montar([posicao('PETR4', 1000, 1500)]);

    expect(elemento.textContent ?? '').not.toMatch(
      /evolu|hist[óo]ric|ao longo do tempo|per[íi]odo|tend[êe]ncia/i,
    );
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });

  it('sem posição aberta explica em vez de desenhar barra vazia', async () => {
    const elemento = await montar([]);

    expect(elemento.querySelector('[data-sem-investido-mercado]')).not.toBeNull();
    expect(elemento.querySelectorAll('[data-barra-investido]').length).toBe(0);
  });
});
