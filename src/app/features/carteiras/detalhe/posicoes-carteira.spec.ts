import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Posicao } from '../carteiras.model';
import { PosicoesCarteira } from './posicoes-carteira';

const PETR4: Posicao = {
  id: 1,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  quantidade: 100,
  precoMedio: 10,
  cotacaoAtual: 12.5,
  dataHoraCotacao: '',
  rentabilidadeNaoRealizada: 250,
};

function minutosAtras(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString();
}

describe('Posições da carteira', () => {
  let fixture: ComponentFixture<PosicoesCarteira>;
  let elemento: HTMLElement;

  async function montar(posicoes: Posicao[], porTicker: Record<string, number> = {}) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(PosicoesCarteira);
    fixture.componentRef.setInput('posicoes', posicoes);
    fixture.componentRef.setInput('lucroPorTicker', porTicker);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  it('@spec:AC-106 cada posição traz ticker, empresa, quantidade, preço médio e cotação com horário', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.textContent).toContain('PETR4');
    expect(linha.textContent).toContain('Petróleo Brasileiro S.A.');
    expect(linha.querySelector('[data-quantidade]')?.textContent).toContain('100');
    expect(linha.querySelector('[data-preco-medio]')?.textContent).toContain('10,00');

    const cotacao = linha.querySelector('[data-cotacao] [data-valor-com-horario]') as HTMLElement;
    expect(cotacao.querySelector('[data-numero]')?.textContent).toContain('12,50');
    expect(cotacao.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-107 a rentabilidade não realizada aparece em valor e em percentual', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.querySelector('[data-rentabilidade-valor]')?.textContent).toContain('250,00');
    expect(linha.querySelector('[data-rentabilidade-percentual]')?.textContent).toContain('25,00%');
    expect(linha.querySelector('[data-rentabilidade-valor] [data-sinal]')?.textContent).toBe('▲');
  });

  it('@spec:AC-107 custo zero não inventa percentual', async () => {
    await montar([{ ...PETR4, precoMedio: 0, dataHoraCotacao: minutosAtras(2) }]);

    const linha = elemento.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.querySelector('[data-rentabilidade-percentual]')).toBeNull();
  });

  it('@spec:AC-108 só a cotação com mais de 15 minutos aparece marcada', async () => {
    await montar([
      { ...PETR4, dataHoraCotacao: minutosAtras(2) },
      { ...PETR4, id: 2, ticker: 'VALE3', dataHoraCotacao: minutosAtras(40) },
    ]);

    const recente = elemento.querySelector('[data-posicao="PETR4"] [data-valor-com-horario]');
    const velha = elemento.querySelector('[data-posicao="VALE3"] [data-valor-com-horario]');

    expect(recente?.getAttribute('data-defasado')).toBe('false');
    expect(recente?.querySelector('[data-marcacao-defasado]')).toBeNull();
    expect(velha?.getAttribute('data-defasado')).toBe('true');
    expect(velha?.querySelector('[data-marcacao-defasado]')?.textContent?.trim()).toBeTruthy();
  });

  it('@spec:AC-109 a seção "Encerradas" lista os tickers com resultado realizado e sem posição aberta', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }], {
      PETR4: 120.5,
      VALE3: -40,
      MGLU3: 12.34,
    });

    const encerradas = elemento.querySelector('[data-encerradas]') as HTMLElement;
    const tickers = Array.from(encerradas.querySelectorAll('[data-encerrada]')).map((l) =>
      l.getAttribute('data-encerrada'),
    );
    expect(tickers).toEqual(['VALE3', 'MGLU3']);
  });

  it('@spec:AC-110 sem ativo encerrado a seção não aparece', async () => {
    await montar([{ ...PETR4, dataHoraCotacao: minutosAtras(2) }], { PETR4: 120.5 });

    expect(elemento.querySelector('[data-encerradas]')).toBeNull();
    expect(elemento.textContent).not.toMatch(/encerrada/i);
  });

  it('@spec:AC-111 a encerrada mostra ticker e resultado, e nada de posição', async () => {
    await montar([], { VALE3: -40 });

    const linha = elemento.querySelector('[data-encerrada="VALE3"]') as HTMLElement;
    expect(linha.textContent).toContain('VALE3');
    expect(linha.querySelector('[data-resultado-realizado]')?.textContent).toContain('40,00');
    expect(linha.querySelector('[data-quantidade]')).toBeNull();
    expect(linha.querySelector('[data-preco-medio]')).toBeNull();
    expect(linha.querySelector('[data-cotacao]')).toBeNull();
  });
});
