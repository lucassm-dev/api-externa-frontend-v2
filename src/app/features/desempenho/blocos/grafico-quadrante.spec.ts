import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoQuadrante, PosicaoNoQuadrante } from './grafico-quadrante';

function posicao(
  ticker: string,
  valorDeMercado: number,
  rentabilidade: number,
): PosicaoNoQuadrante {
  return { ticker, nomeEmpresa: `Empresa ${ticker}`, valorDeMercado, rentabilidade };
}

describe('Gráfico de quadrante participação × rentabilidade', () => {
  let fixture: ComponentFixture<GraficoQuadrante>;

  async function montar(posicoes: PosicaoNoQuadrante[]) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoQuadrante);
    fixture.componentRef.setInput('posicoes', posicoes);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  function bolha(elemento: HTMLElement, ticker: string): SVGGElement {
    return elemento.querySelector(`[data-bolha-ticker="${ticker}"]`) as SVGGElement;
  }

  function circulo(elemento: HTMLElement, ticker: string): SVGCircleElement {
    return elemento.querySelector(
      `[data-bolha-ticker="${ticker}"] [data-bolha-area]`,
    ) as SVGCircleElement;
  }

  const cx = (elemento: HTMLElement, ticker: string) =>
    Number(circulo(elemento, ticker).getAttribute('cx'));
  const cy = (elemento: HTMLElement, ticker: string) =>
    Number(circulo(elemento, ticker).getAttribute('cy'));
  const raio = (elemento: HTMLElement, ticker: string) =>
    Number(circulo(elemento, ticker).getAttribute('r'));

  it('@spec:AC-278 cada ativo é uma bolha posicionada pela participação no eixo X e pela rentabilidade no eixo Y', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 20),
      posicao('VALE3', 3000, -10),
      posicao('ITUB4', 1000, 0),
    ]);

    expect(elemento.querySelectorAll('[data-bolha]')).toHaveLength(3);

    // X cresce com a participação na carteira (PETR4 60% > VALE3 30% > ITUB4 10%)
    expect(cx(elemento, 'PETR4')).toBeGreaterThan(cx(elemento, 'VALE3'));
    expect(cx(elemento, 'VALE3')).toBeGreaterThan(cx(elemento, 'ITUB4'));

    // Y sobe com a rentabilidade: positiva acima do zero, negativa abaixo
    expect(cy(elemento, 'PETR4')).toBeLessThan(cy(elemento, 'ITUB4'));
    expect(cy(elemento, 'VALE3')).toBeGreaterThan(cy(elemento, 'ITUB4'));
  });

  it('@spec:AC-278 o tamanho da bolha vem do valor de mercado', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 5),
      posicao('VALE3', 3000, 5),
      posicao('ITUB4', 1000, 5),
    ]);

    expect(raio(elemento, 'PETR4')).toBeGreaterThan(raio(elemento, 'VALE3'));
    expect(raio(elemento, 'VALE3')).toBeGreaterThan(raio(elemento, 'ITUB4'));
  });

  it('@spec:AC-278 os dois eixos são rotulados', async () => {
    const elemento = await montar([posicao('PETR4', 6000, 20), posicao('VALE3', 3000, -10)]);

    expect(elemento.querySelector('[data-eixo-x]')?.textContent).toMatch(/participa[çc][ãa]o/i);
    expect(elemento.querySelector('[data-eixo-y]')?.textContent).toMatch(/rentabilidade/i);
  });

  it('@spec:AC-278 a linha de rentabilidade zero está marcada e passa pelas bolhas de rentabilidade nula', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 20),
      posicao('VALE3', 3000, -10),
      posicao('ITUB4', 1000, 0),
    ]);

    const linha = elemento.querySelector('[data-linha-zero]') as SVGLineElement;
    expect(linha).not.toBeNull();

    const y1 = Number(linha.getAttribute('y1'));
    const y2 = Number(linha.getAttribute('y2'));
    expect(y1).toBe(y2);
    expect(Number(linha.getAttribute('x1'))).toBeLessThan(Number(linha.getAttribute('x2')));

    // a bolha de rentabilidade 0 fica exatamente sobre a linha
    expect(cy(elemento, 'ITUB4')).toBe(y1);
    // e as demais ficam de lados opostos dela
    expect(cy(elemento, 'PETR4')).toBeLessThan(y1);
    expect(cy(elemento, 'VALE3')).toBeGreaterThan(y1);
  });

  it('@spec:AC-278 os mesmos dados aparecem em texto: participação, rentabilidade e valor por ativo', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 20),
      posicao('VALE3', 4000, -10),
    ]);

    const item = elemento.querySelector('[data-quadrante-item="PETR4"]')!;
    expect(item.querySelector('[data-quadrante-ticker]')?.textContent).toContain('PETR4');
    expect(item.querySelector('[data-quadrante-participacao]')?.textContent).toContain('60,0%');
    expect(item.querySelector('[data-quadrante-rentabilidade]')?.textContent).toContain('20,00%');
    expect(item.querySelector('[data-quadrante-valor]')?.textContent).toContain('6.000,00');

    expect(
      elemento.querySelector('[data-quadrante-item="VALE3"] [data-quadrante-participacao]')
        ?.textContent,
    ).toContain('40,0%');
  });

  it('@spec:AC-280 cada bolha é focável e o foco revela o mesmo detalhe que o ponteiro, em texto', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 20),
      posicao('VALE3', 4000, -10),
    ]);
    const detalhe = () =>
      elemento.querySelector('[data-detalhe-quadrante]')?.textContent?.trim() ?? '';

    for (const alvo of elemento.querySelectorAll('[data-bolha]')) {
      expect(alvo.getAttribute('tabindex')).toBe('0');
    }

    bolha(elemento, 'PETR4').dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const noFoco = detalhe();
    expect(noFoco).toContain('PETR4');
    expect(noFoco).toContain('60,0%');
    expect(noFoco).toContain('20,00%');
    expect(noFoco).toContain('6.000,00');

    bolha(elemento, 'PETR4').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    bolha(elemento, 'PETR4').dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    expect(detalhe()).toBe(noFoco);

    // o mesmo detalhe está no nome acessível da bolha
    expect(bolha(elemento, 'PETR4').getAttribute('aria-label')).toBe(noFoco);
  });

  it('@spec:AC-280 foco visível e Esc devolve o quadrante ao repouso', async () => {
    const elemento = await montar([
      posicao('PETR4', 6000, 20),
      posicao('VALE3', 4000, -10),
    ]);
    const detalhe = () =>
      elemento.querySelector('[data-detalhe-quadrante]')?.textContent?.trim() ?? '';
    const repouso = detalhe();

    const alvo = bolha(elemento, 'PETR4');
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
    const elemento = await montar([posicao('PETR4', 6000, 20), posicao('VALE3', 4000, -10)]);

    expect(elemento.textContent ?? '').not.toMatch(
      /evolu|hist[óo]ric|ao longo do tempo|per[íi]odo|tend[êe]ncia|m[êe]s anterior/i,
    );
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
    expect(elemento.querySelector('[data-tendencia]')).toBeNull();
    expect(elemento.querySelector('[data-comparacao]')).toBeNull();
  });

  it('sem posição aberta explica em vez de desenhar quadrante vazio', async () => {
    const elemento = await montar([]);

    expect(elemento.querySelector('[data-sem-quadrante]')?.textContent).toContain('Nenhuma posição');
    expect(elemento.querySelector('[data-quadrante]')).toBeNull();
    expect(elemento.querySelectorAll('[data-bolha]').length).toBe(0);
  });
});
