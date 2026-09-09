import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Movimentacao } from '../painel.model';
import { UltimasMovimentacoes } from './ultimas-movimentacoes';

function movimentacao(id: number, extra: Partial<Movimentacao> = {}): Movimentacao {
  return {
    id,
    dataHora: '2026-09-08T13:05:00',
    tipo: 'COMPRA',
    ticker: 'PETR4',
    quantidade: 100,
    precoUnitario: 38.4,
    valorTotal: 3840,
    moeda: 'BRL',
    ...extra,
  };
}

describe('Últimas movimentações do painel', () => {
  let fixture: ComponentFixture<UltimasMovimentacoes>;

  async function montar(movimentacoes: Movimentacao[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(UltimasMovimentacoes);
    fixture.componentRef.setInput('movimentacoes', movimentacoes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-059 exibe no máximo cinco linhas, mesmo recebendo mais', async () => {
    const elemento = await montar(Array.from({ length: 8 }, (_, i) => movimentacao(i + 1)));

    expect(elemento.querySelectorAll('[data-movimentacao]')).toHaveLength(5);
  });

  it('@spec:AC-059 cada linha traz quando, tipo, ticker e total, e há atalho para o extrato', async () => {
    const elemento = await montar([movimentacao(1)]);

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    expect(linha.querySelector('[data-quando]')?.textContent).toContain('08/09/2026');
    expect(linha.querySelector('[data-tipo]')?.textContent).toContain('COMPRA');
    expect(linha.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
    expect(linha.querySelector('[data-total]')?.textContent).toContain('3.840,00');
    expect(elemento.querySelector('[data-ver-extrato]')?.getAttribute('href')).toBe('/operacoes');
  });

  it('@spec:AC-059 campo que o servidor não mandou some da linha, sem quebrar o bloco', async () => {
    const elemento = await montar([
      movimentacao(1, { ticker: undefined, quantidade: undefined, valorTotal: undefined }),
    ]);

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    expect(linha.querySelector('[data-ticker]')).toBeNull();
    expect(linha.querySelector('[data-total]')).toBeNull();
    expect(linha.querySelector('[data-quando]')).not.toBeNull();
  });
});
