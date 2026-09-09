import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Pagina } from '../../core/api/pagina';
import { erroInterceptor } from '../../core/erros/erro.interceptor';
import { Acao } from './acoes.model';
import { AcoesService } from './acoes.service';

const PETR4: Acao = {
  id: 12,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  mercado: 'BR',
  moeda: 'BRL',
  cotacaoAtual: 38.42,
  dataHoraCotacao: '2026-09-09T13:20:00',
};

function pagina<T>(itens: T[], extra: Partial<Pagina<T>> = {}): Pagina<T> {
  return {
    content: itens,
    totalElements: itens.length,
    totalPages: 1,
    number: 0,
    size: 20,
    ...extra,
  };
}

describe('Serviço do catálogo de ações', () => {
  let servico: AcoesService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    servico = TestBed.inject(AcoesService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-122 o cadastro envia só ticker e mercado, e devolve a ação com cotação datada', () => {
    let recebida: Acao | null = null;
    servico.cadastrar({ ticker: ' petr4 ', mercado: 'BR' }).subscribe((acao) => (recebida = acao));

    const requisicao = controle.expectOne('/acoes');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ ticker: 'PETR4', mercado: 'BR' });

    requisicao.flush(PETR4);
    expect(recebida!.nomeEmpresa).toBe('Petróleo Brasileiro S.A.');
    expect(recebida!.cotacaoAtual).toBe(38.42);
    expect(recebida!.dataHoraCotacao).toBe('2026-09-09T13:20:00');
  });

  it('@spec:AC-132 a listagem pede a página que a tela pediu', () => {
    servico.listar(2).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/acoes');
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.get('page')).toBe('2');
    expect(requisicao.request.params.get('size')).toBe('20');
    requisicao.flush(pagina([PETR4], { number: 2, totalPages: 3 }));
  });

  it('@spec:AC-133 buscar ticker que não existe devolve vazio, não erro', () => {
    let achada: Acao | null | undefined;
    servico.porTicker('vale3').subscribe((acao) => (achada = acao));

    const requisicao = controle.expectOne('/acoes/ticker/VALE3');
    requisicao.flush(
      { timestamp: '2026-09-09T12:00:00Z', status: 404, codigo: 'ACA-001', error: 'erro', message: 'não achou', path: '/acoes/ticker/VALE3' },
      { status: 404, statusText: 'erro' },
    );

    expect(achada).toBeNull();
  });

  it('@spec:AC-136 a atualização de cotação só sai quando é pedida, e sem forçar por padrão', () => {
    servico.atualizarCotacao(12).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/acoes/12/atualizar-cotacao');
    expect(requisicao.request.method).toBe('PUT');
    expect(requisicao.request.params.has('forcar')).toBe(false);
    requisicao.flush(PETR4);
  });

  it('@spec:AC-142 forçar manda o pedido explícito de ignorar o cache', () => {
    servico.atualizarCotacao(12, true).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/acoes/12/atualizar-cotacao');
    expect(requisicao.request.params.get('forcar')).toBe('true');
    requisicao.flush(PETR4);
  });

  it('@spec:AC-144 a exclusão usa o ticker no caminho, nunca o identificador', () => {
    servico.remover('petr4').subscribe();

    const requisicao = controle.expectOne('/acoes/PETR4');
    expect(requisicao.request.method).toBe('DELETE');
    expect(requisicao.request.url).not.toContain('/acoes/12');
    requisicao.flush(null);
  });

  it('@spec:AC-126 uma carteira no servidor é o bastante para saber que o investidor tem carteira', () => {
    let tem: boolean | null | undefined;
    servico.investidorTemCarteira().subscribe((resposta) => (tem = resposta));

    const requisicao = controle.expectOne((r) => r.url === '/carteiras');
    expect(requisicao.request.params.get('page')).toBe('0');
    expect(requisicao.request.params.get('size')).toBe('1');
    requisicao.flush(pagina([{ id: 1 }], { totalElements: 1 }));

    expect(tem).toBe(true);
  });

  it('@spec:AC-127 catálogo de carteiras vazio responde que o investidor não tem carteira', () => {
    let tem: boolean | null | undefined;
    servico.investidorTemCarteira().subscribe((resposta) => (tem = resposta));

    controle.expectOne((r) => r.url === '/carteiras').flush(pagina([], { totalElements: 0 }));

    expect(tem).toBe(false);
  });

  it('@spec:AC-128 consulta de carteiras que falha vira estado desconhecido, nunca "não tem"', () => {
    let tem: boolean | null | undefined;
    servico.investidorTemCarteira().subscribe((resposta) => (tem = resposta));

    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({ message: 'fora do ar' }, { status: 500, statusText: 'erro' });

    expect(tem).toBeNull();
  });
});
