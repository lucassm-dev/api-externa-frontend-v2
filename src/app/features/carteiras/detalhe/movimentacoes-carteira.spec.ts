import { readFileSync } from 'node:fs';
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

  it('@spec:AC-244 quantidade e total ficam à direita, em fonte de largura fixa e com dígitos de mesma largura', async () => {
    await montar({ itens: ITENS, totalNoServidor: 3, buscadas: 3 });

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    const numericas = Array.from(linha.querySelectorAll('td[data-numero]'));
    expect(numericas.length).toBe(2);
    expect(numericas.some((td) => td.textContent?.includes('100'))).toBe(true);
    expect(numericas.some((td) => td.textContent?.includes('1.000,00'))).toBe(true);

    const estilo = readFileSync(
      'src/app/features/carteiras/detalhe/movimentacoes-carteira.scss',
      'utf8',
    );
    const regra = estilo.match(/\[data-numero\][\s\S]*?\}/)?.[0] ?? '';
    expect(regra).toMatch(/text-align:\s*right/);
    expect(regra).toMatch(/font-family:\s*var\(--fonte-numero\)/);
    expect(regra).toMatch(/font-variant-numeric:\s*[^;]*tabular-nums/);
  });

  it('@spec:AC-246 o tipo da operação vira selo com texto e símbolo, nunca só cor', async () => {
    await montar({ itens: ITENS, totalNoServidor: 3, buscadas: 3 });

    const seloCompra = elemento.querySelector('[data-movimentacao="1"] app-selo') as HTMLElement;
    expect(seloCompra.getAttribute('data-tipo')).toBe('COMPRA');
    const marcaCompra = seloCompra.querySelector('[data-selo]') as HTMLElement;
    expect(marcaCompra.getAttribute('data-variante')).toBe('alta');
    expect(marcaCompra.textContent).toContain('COMPRA');
    expect(marcaCompra.querySelector('svg[data-icone]')).toBeTruthy();

    const marcaVenda = elemento.querySelector(
      '[data-movimentacao="3"] app-selo [data-selo]',
    ) as HTMLElement;
    expect(marcaVenda.getAttribute('data-variante')).toBe('baixa');
    expect(marcaVenda.textContent).toContain('VENDA');
  });

  it('@spec:AC-247 a linha com ativo traz o monograma junto do ticker', async () => {
    await montar({ itens: ITENS, totalNoServidor: 3, buscadas: 3 });

    const linha = elemento.querySelector('[data-movimentacao="1"]') as HTMLElement;
    const monograma = linha.querySelector('app-monograma [data-monograma]') as HTMLElement;
    expect(monograma).toBeTruthy();
    expect(monograma.getAttribute('aria-label')).toContain('PETR4');
    expect(linha.querySelector('.ativo strong')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-250 sem movimentações a tabela dá lugar a um estado vazio com próximo passo', async () => {
    await montar({ itens: [], totalNoServidor: 0, buscadas: 0 });

    expect(elemento.querySelector('table.tabela')).toBeNull();
    const vazio = elemento.querySelector('[data-sem-movimentacao]') as HTMLElement;
    expect(vazio).toBeTruthy();
    const passo = vazio.querySelector('[data-proximo-passo]') as HTMLAnchorElement;
    expect(passo).toBeTruthy();
    expect(passo.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-250 enquanto carrega mostra o esqueleto com a silhueta das linhas', async () => {
    await montar({ itens: [], totalNoServidor: 0, buscadas: 0 });
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    expect(elemento.querySelector('[data-sem-movimentacao]')).toBeNull();
    const esqueleto = elemento.querySelector(
      '[data-carregando-movimentacoes] [data-esqueleto]',
    ) as HTMLElement;
    expect(esqueleto).toBeTruthy();
    expect(esqueleto.getAttribute('data-formato')).toBe('tabela');
    expect(esqueleto.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(esqueleto.getAttribute('aria-hidden')).toBe('true');
  });
});
