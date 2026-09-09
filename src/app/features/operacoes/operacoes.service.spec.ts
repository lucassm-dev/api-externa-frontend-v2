import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OperacoesService } from './operacoes.service';

describe('Serviço de operações', () => {
  let servico: OperacoesService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servico = TestBed.inject(OperacoesService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-154 a compra sai com carteira, ticker e quantidade, sem preço unitário', () => {
    servico.registrar('COMPRA', { carteiraId: 9, ticker: 'PETR4', quantidade: 100 }).subscribe();

    const requisicao = controle.expectOne('/operacoes/compra');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ carteiraId: 9, ticker: 'PETR4', quantidade: 100 });
    expect('precoUnitario' in requisicao.request.body).toBe(false);
    requisicao.flush({});
  });

  it('@spec:AC-163 o preço digitado vai no corpo, e a venda usa a rota de venda', () => {
    servico
      .registrar('VENDA', { carteiraId: 9, ticker: 'PETR4', quantidade: 10, precoUnitario: 32.5 })
      .subscribe();

    const requisicao = controle.expectOne('/operacoes/venda');
    expect(requisicao.request.body).toEqual({
      carteiraId: 9,
      ticker: 'PETR4',
      quantidade: 10,
      precoUnitario: 32.5,
    });
    requisicao.flush({});
  });

  it('@spec:AC-169 o extrato é lido paginado e devolve os itens do servidor', () => {
    let recebido: unknown = null;
    servico.extrato(0).subscribe((pagina) => (recebido = pagina.content));

    const requisicao = controle.expectOne((r) => r.url === '/operacoes');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      content: [{ id: 1, tipo: 'COMPRA', ticker: 'PETR4' }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 20,
    });

    expect(recebido).toEqual([{ id: 1, tipo: 'COMPRA', ticker: 'PETR4' }]);
  });

  it('@spec:AC-171 avançar de página pede ao servidor a página correspondente', () => {
    servico.extrato(2).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/operacoes');
    expect(requisicao.request.params.get('page')).toBe('2');
    expect(requisicao.request.params.get('size')).toBe('20');
    requisicao.flush({ content: [], totalElements: 0, totalPages: 0, number: 2, size: 20 });
  });

  it('@spec:AC-172 a leitura do extrato não carrega nenhum parâmetro de filtro', () => {
    servico.extrato(0).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/operacoes');
    expect(requisicao.request.params.keys().sort()).toEqual(['page', 'size']);
    requisicao.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  it('@spec:AC-176 alterar sem preço novo não envia preço unitário', () => {
    servico.alterar(7, { quantidade: 50 }).subscribe();

    const requisicao = controle.expectOne('/operacoes/7');
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.body).toEqual({ quantidade: 50 });
    requisicao.flush({});
  });

  it('excluir chama DELETE na operação', () => {
    servico.excluir(7).subscribe();

    const requisicao = controle.expectOne('/operacoes/7');
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null);
  });
});
