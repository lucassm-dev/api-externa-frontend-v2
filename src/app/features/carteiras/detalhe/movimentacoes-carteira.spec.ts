import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ExtratoBuscado } from '../carteiras.model';
import { MovimentacoesCarteira } from './movimentacoes-carteira';

const ITENS = [
  {
    id: 1,
    carteiraId: 9,
    dataHora: '2026-09-09T10:00:00',
    tipo: 'COMPRA',
    ticker: 'PETR4',
    quantidade: 100,
    precoUnitario: 10,
    valorTotal: 1000,
    moeda: 'BRL' as const,
  },
  { id: 2, carteiraId: 4, dataHora: '2026-09-08T10:00:00', tipo: 'VENDA', ticker: 'VALE3' },
  { id: 3, carteiraId: 9, dataHora: '2026-09-07T10:00:00', tipo: 'VENDA', ticker: 'MGLU3' },
];

describe('Movimentações da carteira na tela', () => {
  let fixture: ComponentFixture<MovimentacoesCarteira>;
  let elemento: HTMLElement;

  async function montar(extrato: ExtratoBuscado) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'operacoes', children: [] }])],
    });
    fixture = TestBed.createComponent(MovimentacoesCarteira);
    fixture.componentRef.setInput('extrato', extrato);
    fixture.componentRef.setInput('carteiraId', 9);
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  it('@spec:AC-112 mostra apenas as operações desta carteira', async () => {
    await montar({ itens: ITENS, totalNoServidor: 3, buscadas: 3 });

    const ids = Array.from(elemento.querySelectorAll('[data-movimentacao]')).map((l) =>
      l.getAttribute('data-movimentacao'),
    );
    expect(ids).toEqual(['1', '3']);
    expect(elemento.textContent).not.toContain('VALE3');
  });

  it('@spec:AC-113 extrato maior do que o buscado é declarado como recorte parcial', async () => {
    await montar({ itens: ITENS, totalNoServidor: 640, buscadas: 200 });

    const aviso = elemento.querySelector('[data-recorte-parcial]') as HTMLElement;
    expect(aviso).toBeTruthy();
    expect(aviso.textContent).toContain('200');
    expect(aviso.textContent).toMatch(/mais recentes/i);
    expect(aviso.querySelector('a')?.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-114 extrato que coube inteiro não recebe aviso de recorte', async () => {
    await montar({ itens: ITENS, totalNoServidor: 3, buscadas: 3 });

    expect(elemento.querySelector('[data-recorte-parcial]')).toBeNull();
    expect(elemento.textContent).not.toMatch(/mais recentes/i);
  });
});
