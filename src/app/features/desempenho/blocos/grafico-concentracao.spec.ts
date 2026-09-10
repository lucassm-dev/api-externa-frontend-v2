import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraficoConcentracao, PosicaoConcentracao } from './grafico-concentracao';

function posicao(ticker: string, valorDeMercado: number): PosicaoConcentracao {
  return { ticker, valorDeMercado };
}

describe('Gráfico de concentração', () => {
  let fixture: ComponentFixture<GraficoConcentracao>;

  async function montar(posicoes: PosicaoConcentracao[]) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(GraficoConcentracao);
    fixture.componentRef.setInput('posicoes', posicoes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-279 mostra em texto a fatia da carteira nos três maiores ativos', async () => {
    const elemento = await montar([
      posicao('PETR4', 50),
      posicao('VALE3', 30),
      posicao('ITUB4', 10),
      posicao('B3SA3', 5),
      posicao('WEGE3', 5),
    ]);

    expect(elemento.querySelector('[data-concentracao-percentual]')?.textContent).toContain('90,0%');
    expect(elemento.querySelector('[data-concentracao-resumo]')?.textContent).toContain(
      '3 maiores ativos',
    );

    const itens = elemento.querySelectorAll('[data-concentracao-item]');
    expect(itens.length).toBe(3);
    expect(itens[0].getAttribute('data-concentracao-item')).toBe('PETR4');
  });

  it('@spec:AC-279 o arco preenchido acompanha a fatia do topo', async () => {
    const disperso = await montar([
      posicao('A', 10),
      posicao('B', 10),
      posicao('C', 10),
      posicao('D', 70),
    ]);
    const arcoDisperso = disperso.querySelector('[data-arco-preenchido]')?.getAttribute('d') ?? '';

    const concentrado = await montar([
      posicao('A', 40),
      posicao('B', 25),
      posicao('C', 15),
      posicao('D', 20),
    ]);
    const arcoConcentrado =
      concentrado.querySelector('[data-arco-preenchido]')?.getAttribute('d') ?? '';

    expect(arcoDisperso).toMatch(/^M /);
    expect(arcoConcentrado).toMatch(/^M /);
    expect(arcoDisperso).not.toEqual(arcoConcentrado);
  });

  it('@spec:AC-279 explica em texto o que a faixa significa, sem aprovar nem reprovar', async () => {
    const elemento = await montar([
      posicao('PETR4', 40),
      posicao('VALE3', 25),
      posicao('ITUB4', 15),
      posicao('B3SA3', 20),
    ]);

    const faixa = elemento.querySelector('[data-concentracao-faixa]')?.textContent ?? '';
    expect(faixa).toContain('concentrada');
    expect(faixa).toContain('70%');
    expect(faixa).not.toMatch(/recomend|arrisc|ideal|saud[áa]vel|deveria|perigos|ruim/i);
  });

  it('@spec:AC-281 não inventa passado: sem eixo de tempo, tendência ou período', async () => {
    const elemento = await montar([posicao('PETR4', 60), posicao('VALE3', 40)]);

    expect(elemento.textContent ?? '').not.toMatch(
      /evolu|hist[óo]ric|ao longo do tempo|per[íi]odo|tend[êe]ncia/i,
    );
    expect(elemento.querySelectorAll('time').length).toBe(0);
    expect(elemento.querySelector('[data-eixo-tempo]')).toBeNull();
  });

  it('sem posição aberta explica em vez de desenhar arco vazio', async () => {
    const elemento = await montar([]);

    expect(elemento.querySelector('[data-sem-concentracao]')).not.toBeNull();
    expect(elemento.querySelector('[data-arco-preenchido]')).toBeNull();
  });
});
