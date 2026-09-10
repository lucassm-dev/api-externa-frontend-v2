import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoMapaPosicoes, PosicaoNoMapa } from './grafico-mapa-posicoes';

function posicao(
  ticker: string,
  valorDeMercado: number,
  resultado: number,
): PosicaoNoMapa {
  return { ticker, nomeEmpresa: `Empresa ${ticker}`, valorDeMercado, resultado };
}

describe('Gráfico do mapa de blocos das posições', () => {
  let fixture: ComponentFixture<GraficoMapaPosicoes>;

  async function montar(posicoes: PosicaoNoMapa[]) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoMapaPosicoes);
    fixture.componentRef.setInput('posicoes', posicoes);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function bloco(elemento: HTMLElement, ticker: string): SVGGElement {
    return elemento.querySelector(`[data-bloco-ticker="${ticker}"]`) as SVGGElement;
  }

  function area(elemento: HTMLElement, ticker: string): number {
    const rect = elemento.querySelector(`[data-bloco-ticker="${ticker}"] [data-bloco-area]`)!;
    return Number(rect.getAttribute('width')) * Number(rect.getAttribute('height'));
  }

  it('@spec:AC-276 cada ativo vira um bloco de área proporcional ao valor de mercado', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 400),
      posicao('VALE3', 3000, -200),
      posicao('ITUB4', 1000, 50),
    ]);

    expect(elemento.querySelectorAll('[data-bloco]')).toHaveLength(3);

    const total = area(elemento, 'PETR4') + area(elemento, 'VALE3') + area(elemento, 'ITUB4');
    expect(area(elemento, 'PETR4') / total).toBeCloseTo(0.6, 5);
    expect(area(elemento, 'VALE3') / total).toBeCloseTo(0.3, 5);
    expect(area(elemento, 'ITUB4') / total).toBeCloseTo(0.1, 5);
  });

  it('@spec:AC-276 ticker, valor e participação ficam em texto na legenda', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 400),
      posicao('VALE3', 4000, -200),
    ]);
    const item = elemento.querySelector('[data-mapa-item="PETR4"]')!;

    expect(item.querySelector('[data-mapa-ticker]')?.textContent).toContain('PETR4');
    expect(item.querySelector('[data-mapa-valor]')?.textContent).toContain('6.000,00');
    expect(item.querySelector('[data-mapa-participacao]')?.textContent).toContain('60,0%');
    expect(
      elemento.querySelector('[data-mapa-item="VALE3"] [data-mapa-participacao]')?.textContent,
    ).toContain('40,0%');
  });

  it('@spec:AC-276 a cor indica o sinal do resultado, mas não é a única pista', async () => {
    const elemento = await montar([
      posicao('PETR4', 5000, 400),
      posicao('VALE3', 5000, -300),
    ]);

    // cor
    const areaGanho = elemento
      .querySelector('[data-bloco-ticker="PETR4"] [data-bloco-area]')
      ?.getAttribute('fill');
    const areaPerda = elemento
      .querySelector('[data-bloco-ticker="VALE3"] [data-bloco-area]')
      ?.getAttribute('fill');
    expect(areaGanho).toContain('cor-alta');
    expect(areaPerda).toContain('cor-baixa');

    // pista redundante: atributo de sinal e glifo/palavra em texto
    expect(bloco(elemento, 'PETR4').getAttribute('data-sinal')).toBe('alta');
    expect(bloco(elemento, 'VALE3').getAttribute('data-sinal')).toBe('baixa');
    expect(
      elemento.querySelector('[data-mapa-item="VALE3"] [data-sinal]')?.textContent?.trim(),
    ).toBe('▼');
    expect(
      elemento.querySelector('[data-mapa-item="VALE3"] [data-descricao]')?.textContent?.trim(),
    ).toBe('baixa');
    expect(bloco(elemento, 'VALE3').textContent).toContain('▼');
  });

  it('@spec:AC-280 cada bloco é focável e revela o mesmo detalhe do ponteiro, em texto', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 400),
      posicao('VALE3', 4000, -250),
    ]);
    const detalhe = () => elemento.querySelector('[data-detalhe-mapa]')?.textContent?.trim() ?? '';

    for (const alvo of elemento.querySelectorAll('[data-bloco]')) {
      expect(alvo.getAttribute('tabindex')).toBe('0');
    }

    bloco(elemento, 'VALE3').dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const noFoco = detalhe();
    expect(noFoco).toContain('VALE3');
    expect(noFoco).toContain('4.000,00');
    expect(noFoco).toContain('40,0%');
    expect(noFoco).toContain('perda');
    expect(noFoco).toContain('250,00');

    bloco(elemento, 'VALE3').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    bloco(elemento, 'VALE3').dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(detalhe()).toBe(noFoco);

    // o aria-label do bloco carrega o mesmo detalhe
    expect(bloco(elemento, 'VALE3').getAttribute('aria-label')).toBe(noFoco);
  });

  it('@spec:AC-280 foco visível e Esc devolve o mapa ao repouso', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 400),
      posicao('VALE3', 4000, -250),
    ]);
    const detalhe = () => elemento.querySelector('[data-detalhe-mapa]')?.textContent?.trim() ?? '';
    const repouso = detalhe();

    const alvo = bloco(elemento, 'PETR4');
    alvo.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(alvo.classList.contains('ativo')).toBe(true);
    expect(detalhe()).not.toBe(repouso);

    alvo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(alvo.classList.contains('ativo')).toBe(false);
    expect(detalhe()).toBe(repouso);
  });

  it('@spec:AC-281 nenhum eixo de tempo, tendência ou comparação de período', async () => {
    const elemento = await montar([posicao('PETR4', 6000, 400), posicao('VALE3', 4000, -250)]);

    expect(elemento.textContent ?? '').not.toMatch(
      /evolu|hist[óo]ric|ao longo do tempo|per[íi]odo|tend[êe]ncia|m[êe]s anterior/i,
    );
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
    expect(elemento.querySelector('[data-tendencia]')).toBeNull();
    expect(elemento.querySelector('[data-comparacao]')).toBeNull();
  });

  it('sem posição aberta explica em vez de desenhar mapa vazio', async () => {
    const elemento = await montar([]);

    expect(elemento.querySelector('[data-sem-mapa]')?.textContent).toContain('Nenhuma posição');
    expect(elemento.querySelector('[data-mapa]')).toBeNull();
    expect(elemento.querySelectorAll('[data-bloco]').length).toBe(0);
  });
});
