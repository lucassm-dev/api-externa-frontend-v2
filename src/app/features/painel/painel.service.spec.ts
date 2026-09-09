import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pagina } from '../../core/api/pagina';
import { CarteiraResumida, Movimentacao } from './painel.model';
import { PainelService } from './painel.service';

function pagina<T>(itens: T[], total = itens.length): Pagina<T> {
  return { content: itens, totalElements: total, totalPages: 1, number: 0, size: itens.length };
}

describe('Leituras do painel', () => {
  let painel: PainelService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    painel = TestBed.inject(PainelService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-050 a barra de mercado vem inteira, com itens, horário e avisos', () => {
    let barra: unknown;
    painel.barraDeMercado().subscribe((resposta) => (barra = resposta));

    const requisicao = controle.expectOne('/mercado/barra-cotacoes');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      itens: [
        { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.2, logoUrl: null },
      ],
      atualizadoEm: '2026-09-08T13:00:00Z',
      avisos: ['Cotação do dólar indisponível.'],
    });

    expect(barra).toEqual({
      itens: [
        { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.2, logoUrl: null },
      ],
      atualizadoEm: '2026-09-08T13:00:00Z',
      avisos: ['Cotação do dólar indisponível.'],
    });
  });

  it('@spec:AC-051 a barra fora do ar vira ausência de barra, não erro propagado', () => {
    let barra: unknown = 'nao-respondeu';
    let falhou = false;
    painel.barraDeMercado().subscribe({
      next: (resposta) => (barra = resposta),
      error: () => (falhou = true),
    });

    controle.expectOne('/mercado/barra-cotacoes').flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(falhou).toBe(false);
    expect(barra).toBeNull();
  });

  it('@spec:AC-057 as carteiras são pedidas ordenadas por identificador decrescente', () => {
    let carteiras: CarteiraResumida[] = [];
    painel.carteiras().subscribe((resposta) => (carteiras = resposta));

    const requisicao = controle.expectOne((r) => r.url === '/carteiras');
    expect(requisicao.request.params.get('sort')).toBe('id,desc');
    expect(requisicao.request.params.get('page')).toBe('0');

    const recente = { id: 9, nome: 'Longo prazo' } as CarteiraResumida;
    const antiga = { id: 2, nome: 'Primeira' } as CarteiraResumida;
    requisicao.flush(pagina([recente, antiga]));

    expect(carteiras.map((carteira) => carteira.id)).toEqual([9, 2]);
  });

  it('@spec:AC-053 o consolidado é pedido de uma carteira por vez, pelo identificador dela', () => {
    painel.consolidado(7).subscribe();

    const requisicao = controle.expectOne('/carteiras/7/consolidado');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      valorInvestido: 1000,
      valorDeMercado: 1100,
      lucroNaoRealizado: 100,
      taxaCambioAtual: 5.4,
      dataHoraTaxaCambio: '2026-09-08T13:00:00Z',
      avisos: [],
    });
  });

  it('@spec:AC-059 o painel pede cinco movimentações e nunca exibe mais que isso', () => {
    let movimentacoes: Movimentacao[] = [];
    painel.ultimasMovimentacoes().subscribe((resposta) => (movimentacoes = resposta));

    const requisicao = controle.expectOne((r) => r.url === '/operacoes');
    expect(requisicao.request.params.get('size')).toBe('5');

    const seis = Array.from({ length: 6 }, (_, indice) => ({
      id: indice + 1,
      dataHora: '2026-09-08T13:00:00Z',
      tipo: 'COMPRA',
    })) as Movimentacao[];
    requisicao.flush(pagina(seis, 42));

    expect(movimentacoes).toHaveLength(5);
  });

  it('@spec:AC-060 a sonda do catálogo pergunta se existe alguma corretora, sem trazer a lista', () => {
    let temCorretora: boolean | undefined;
    painel.catalogoTemCorretora().subscribe((resposta) => (temCorretora = resposta));

    const vazio = controle.expectOne((r) => r.url === '/corretoras');
    expect(vazio.request.params.get('size')).toBe('1');
    vazio.flush(pagina([], 0));
    expect(temCorretora).toBe(false);

    painel.catalogoTemCorretora().subscribe((resposta) => (temCorretora = resposta));
    controle.expectOne((r) => r.url === '/corretoras').flush(pagina([{ id: 1 }], 1));
    expect(temCorretora).toBe(true);
  });
});
