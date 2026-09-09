import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pagina } from '../../core/api/pagina';
import { Carteira } from './carteiras.model';
import { CarteirasService } from './carteiras.service';

const CARTEIRA: Carteira = {
  id: 9,
  investidorId: 1,
  corretoraId: 7,
  nomeCorretora: 'XP Investimentos',
  mercado: 'BR',
  moeda: 'BRL',
  nome: 'Dividendos',
  ativa: true,
};

function pagina(content: Carteira[], extras: Partial<Pagina<Carteira>> = {}): Pagina<Carteira> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    number: 0,
    size: 200,
    ...extras,
  };
}

describe('Serviço das carteiras', () => {
  let servico: CarteirasService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servico = TestBed.inject(CarteirasService);
    controle = TestBed.inject(HttpTestingController);
  });

  it('@spec:AC-093 envia exatamente o mercado escolhido, sem valor padrão embutido', () => {
    servico.criar({ corretoraId: 7, mercado: 'US', nome: 'Small caps' }).subscribe();

    const requisicao = controle.expectOne('/carteiras');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ corretoraId: 7, mercado: 'US', nome: 'Small caps' });
  });

  it('@spec:AC-094 a criação devolve a carteira com o identificador do servidor', () => {
    let criada: Carteira | undefined;
    servico.criar({ corretoraId: 7, mercado: 'BR', nome: 'Dividendos' }).subscribe((c) => (criada = c));

    controle.expectOne('/carteiras').flush(CARTEIRA);

    expect(criada?.id).toBe(9);
  });

  it('@spec:AC-097 lista pedindo a página ao servidor, da mais recente para a mais antiga', () => {
    servico.listar(2).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/carteiras');
    expect(requisicao.request.params.get('page')).toBe('2');
    expect(requisicao.request.params.get('size')).toBe('20');
    expect(requisicao.request.params.get('sort')).toBe('id,desc');
  });

  it('@spec:AC-113 busca o extrato numa página larga e informa quantas existem no servidor', () => {
    let extrato: { buscadas: number; totalNoServidor: number } | undefined;
    servico.extratoDoInvestidor().subscribe((e) => (extrato = e));

    const requisicao = controle.expectOne((r) => r.url === '/operacoes');
    expect(requisicao.request.params.get('size')).toBe('200');
    requisicao.flush({
      content: [{ id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA' }],
      totalElements: 640,
      totalPages: 4,
      number: 0,
      size: 200,
    });

    expect(extrato).toEqual({
      itens: [{ id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA' }],
      totalNoServidor: 640,
      buscadas: 1,
    });
  });

  it('@spec:AC-100 número que falha vira ausência de número, nunca erro propagado', () => {
    let numeros: unknown = 'não chamou';
    servico.numerosDaCarteira(9).subscribe((n) => (numeros = n));

    controle.expectOne('/carteiras/9/consolidado').flush('', { status: 500, statusText: 'Erro' });
    controle.expectOne('/carteiras/9/lucro-realizado').flush({ total: 12, porTicker: {} });

    expect(numeros).toEqual({ consolidado: null, lucroRealizado: { total: 12, porTicker: {} } });
  });

  it('@spec:AC-120 carteira ausente da listagem é tratada como não encontrada', () => {
    let achada: Carteira | null | undefined;
    servico.porId(9).subscribe((c) => (achada = c));

    controle.expectOne((r) => r.url === '/carteiras').flush(pagina([{ ...CARTEIRA, id: 4 }]));

    expect(achada).toBeNull();
  });

  it('@spec:AC-120 a busca pela carteira percorre as páginas da listagem', () => {
    let achada: Carteira | null | undefined;
    servico.porId(9).subscribe((c) => (achada = c));

    controle
      .expectOne((r) => r.url === '/carteiras' && r.params.get('page') === '0')
      .flush(pagina([{ ...CARTEIRA, id: 4 }], { totalPages: 2, totalElements: 2 }));
    controle
      .expectOne((r) => r.url === '/carteiras' && r.params.get('page') === '1')
      .flush(pagina([CARTEIRA], { number: 1, totalPages: 2, totalElements: 2 }));

    expect(achada?.id).toBe(9);
  });

  it('@spec:AC-115 renomear manda só o nome', () => {
    servico.renomear(9, 'Longo prazo').subscribe();

    const requisicao = controle.expectOne('/carteiras/9');
    expect(requisicao.request.method).toBe('PATCH');
    expect(requisicao.request.body).toEqual({ nome: 'Longo prazo' });
  });

  it('@spec:AC-119 excluir chama a remoção da carteira', () => {
    servico.excluir(9).subscribe();

    const requisicao = controle.expectOne('/carteiras/9');
    expect(requisicao.request.method).toBe('DELETE');
  });

  afterEach(() => controle.verify());
});
