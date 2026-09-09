import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pagina } from '../../core/api/pagina';
import { DadosDaCarteira } from './desempenho.model';
import { DesempenhoService } from './desempenho.service';

function pagina<T>(itens: T[]): Pagina<T> {
  return { content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: itens.length };
}

const consolidado = {
  valorInvestido: 1000,
  valorDeMercado: 1200,
  lucroNaoRealizado: 200,
  taxaCambioAtual: 5,
  dataHoraTaxaCambio: '2026-09-09T12:00:00Z',
  avisos: [],
};

const posicao = {
  id: 1,
  ticker: 'AAPL',
  nomeEmpresa: 'Apple',
  quantidade: 10,
  precoMedio: 20,
  cotacaoAtual: 24,
  dataHoraCotacao: '2026-09-09T12:00:00Z',
  rentabilidadeNaoRealizada: 40,
};

describe('Leituras da tela de desempenho', () => {
  let desempenho: DesempenhoService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    desempenho = TestBed.inject(DesempenhoService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-189 as carteiras do seletor vêm da listagem, mais recente primeiro', () => {
    let carteiras: unknown;
    desempenho.carteiras().subscribe((resposta) => (carteiras = resposta));

    const requisicao = controle.expectOne((pedido) => pedido.url === '/carteiras');
    expect(requisicao.request.params.get('sort')).toBe('id,desc');
    requisicao.flush(pagina([{ id: 9, nome: 'Longo prazo' }]));

    expect(carteiras).toEqual([{ id: 9, nome: 'Longo prazo' }]);
  });

  it('@spec:AC-189 a carteira escolhida traz consolidado, posições, realizado e a moeda de cada ticker', () => {
    let dados: DadosDaCarteira | undefined;
    desempenho.dadosDaCarteira(9).subscribe((resposta) => (dados = resposta));

    controle.expectOne('/carteiras/9/consolidado').flush(consolidado);
    controle.expectOne('/carteiras/9/posicoes').flush([posicao]);
    controle.expectOne('/carteiras/9/lucro-realizado').flush({ total: 0, porTicker: {} });
    controle
      .expectOne((pedido) => pedido.url === '/acoes')
      .flush(
        pagina([
          {
            id: 1,
            ticker: 'AAPL',
            nomeEmpresa: 'Apple',
            mercado: 'US',
            moeda: 'USD',
            cotacaoAtual: 24,
            dataHoraCotacao: '2026-09-09T12:00:00Z',
          },
        ]),
      );

    expect(dados?.consolidado).toEqual(consolidado);
    expect(dados?.posicoes).toEqual([posicao]);
    expect(dados?.moedas).toEqual({ AAPL: 'USD' });
  });

  it('@spec:AC-211 leitura que falha vira nula e não derruba as outras', () => {
    let dados: DadosDaCarteira | undefined;
    desempenho.dadosDaCarteira(9).subscribe((resposta) => (dados = resposta));

    controle.expectOne('/carteiras/9/consolidado').flush(consolidado);
    controle.expectOne('/carteiras/9/posicoes').flush([posicao]);
    controle
      .expectOne('/carteiras/9/lucro-realizado')
      .flush({ codigo: 'GEN-001' }, { status: 500, statusText: 'Erro' });
    controle.expectOne((pedido) => pedido.url === '/acoes').flush(pagina([]));

    expect(dados?.lucroRealizado).toBeNull();
    expect(dados?.consolidado).toEqual(consolidado);
    expect(dados?.posicoes).toEqual([posicao]);
  });

  it('@spec:AC-211 catálogo fora do ar deixa toda posição com moeda desconhecida, sem converter no escuro', () => {
    let dados: DadosDaCarteira | undefined;
    desempenho.dadosDaCarteira(9).subscribe((resposta) => (dados = resposta));

    controle.expectOne('/carteiras/9/consolidado').flush(consolidado);
    controle.expectOne('/carteiras/9/posicoes').flush([posicao]);
    controle.expectOne('/carteiras/9/lucro-realizado').flush({ total: 0, porTicker: {} });
    controle
      .expectOne((pedido) => pedido.url === '/acoes')
      .flush({ codigo: 'GEN-001' }, { status: 500, statusText: 'Erro' });

    expect(dados?.moedas).toEqual({});
  });
});
