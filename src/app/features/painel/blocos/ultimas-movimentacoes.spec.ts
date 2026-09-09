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

  it('@spec:AC-240 traz o monograma do ativo ao lado do ticker', async () => {
    const elemento = await montar([movimentacao(1, { ticker: 'PETR4' })]);

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    const ativo = linha.querySelector('.ativo') as HTMLElement;
    expect(ativo).not.toBeNull();

    const monograma = ativo.querySelector('[data-monograma]') as HTMLElement;
    expect(monograma).not.toBeNull();
    expect(monograma.getAttribute('aria-label')).toContain('PETR4');
    expect(ativo.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-240 sem ticker não há monograma na linha', async () => {
    const elemento = await montar([movimentacao(1, { ticker: undefined })]);

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    expect(linha.querySelector('[data-monograma]')).toBeNull();
    expect(linha.querySelector('.ativo')).toBeNull();
  });

  it('@spec:AC-240 o tipo da operação aparece como selo com o texto', async () => {
    const elemento = await montar([movimentacao(1, { tipo: 'COMPRA' })]);

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    const tipo = linha.querySelector('[data-tipo="COMPRA"]') as HTMLElement;
    expect(tipo).not.toBeNull();
    expect(tipo.querySelector('[data-selo]')).not.toBeNull();
    expect(tipo.textContent).toContain('COMPRA');
  });

  it('@spec:AC-240 o selo do tipo distingue compra de venda pela variante', async () => {
    const compra = await montar([movimentacao(1, { tipo: 'COMPRA' })]);
    const venda = await montar([movimentacao(2, { tipo: 'VENDA' })]);

    const seloCompra = compra.querySelector('[data-tipo="COMPRA"] [data-selo]') as HTMLElement;
    const seloVenda = venda.querySelector('[data-tipo="VENDA"] [data-selo]') as HTMLElement;
    expect(seloCompra.getAttribute('data-variante')).toBe('alta');
    expect(seloVenda.getAttribute('data-variante')).toBe('baixa');
  });
});
