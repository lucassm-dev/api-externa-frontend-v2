import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Corretora } from './corretoras.model';
import { CorretorasService } from './corretoras.service';

function corretora(id: number, cnpj = '02332886000104'): Corretora {
  return {
    id,
    cnpj,
    razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.',
    nomeFantasia: 'XP Investimentos',
    email: 'contato@xp.com.br',
    telefone: '1130000000',
    cep: '04538133',
    logradouro: 'Avenida Brigadeiro Faria Lima',
    numero: '3600',
    complemento: '10 andar',
    bairro: 'Itaim Bibi',
    cidade: 'São Paulo',
    uf: 'SP',
    situacaoCadastral: 'ATIVA',
    validadaNaCvm: true,
    dataBaseCvm: '2026-09-08',
    dataCadastro: '2026-09-09T10:00:00',
  };
}

function paginaDeCarteiras(corretoraIds: number[], number = 0, totalPages = 1) {
  return {
    content: corretoraIds.map((corretoraId, indice) => ({ id: indice + 1, corretoraId })),
    totalElements: corretoraIds.length,
    totalPages,
    number,
    size: 200,
  };
}

describe('Catálogo de corretoras', () => {
  let servico: CorretorasService;
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    servico = TestBed.inject(CorretorasService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-074 o cadastro envia só o CNPJ, em dígitos, e nada é guardado quando é recusado', () => {
    let recusa: unknown;
    servico.cadastrar('02.332.886/0001-04').subscribe({ error: (erro) => (recusa = erro) });

    const requisicao = controle.expectOne('/corretoras');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ cnpj: '02332886000104' });

    requisicao.flush(
      { timestamp: '', status: 422, codigo: 'COR-003', error: '', message: 'Empresa não autorizada na CVM.', path: '/corretoras' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    expect(recusa).toBeTruthy();

    servico.listar(0).subscribe();
    const lista = controle.expectOne((r) => r.url === '/corretoras' && r.method === 'GET');
    lista.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });

  it('@spec:AC-078 a listagem é paginada e pede a página que a tela pediu', () => {
    servico.listar(2).subscribe();

    const requisicao = controle.expectOne((r) => r.url === '/corretoras' && r.method === 'GET');
    expect(requisicao.request.params.get('page')).toBe('2');
    expect(requisicao.request.params.get('size')).toBe('20');
    requisicao.flush({ content: [corretora(1)], totalElements: 41, totalPages: 3, number: 2, size: 20 });
  });

  it('@spec:AC-079 a busca por CNPJ consulta a rota por CNPJ em dígitos puros', () => {
    let achada: Corretora | null | undefined;
    servico.porCnpj('02.332.886/0001-04').subscribe((resposta) => (achada = resposta));

    const requisicao = controle.expectOne('/corretoras/cnpj/02332886000104');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush(corretora(7));

    expect(achada?.id).toBe(7);
  });

  it('@spec:AC-080 CNPJ ausente do catálogo devolve nada encontrado, não um erro', () => {
    let resultado: Corretora | null | undefined = undefined;
    let houveErro = false;
    servico.porCnpj('02332886000104').subscribe({
      next: (resposta) => (resultado = resposta),
      error: () => (houveErro = true),
    });

    controle.expectOne('/corretoras/cnpj/02332886000104').flush(
      { timestamp: '', status: 404, codigo: 'COR-001', error: '', message: 'não encontrada', path: '' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(resultado).toBeNull();
    expect(houveErro).toBe(false);
  });

  it('@spec:AC-081 a contagem do selo percorre todas as páginas das carteiras do investidor', () => {
    let contagem: Map<number, number> | undefined;
    servico.carteirasPorCorretora().subscribe((mapa) => (contagem = mapa));

    const primeira = controle.expectOne((r) => r.url === '/carteiras' && r.params.get('page') === '0');
    expect(primeira.request.params.get('size')).toBe('200');
    primeira.flush(paginaDeCarteiras([1, 1, 2], 0, 2));

    const segunda = controle.expectOne((r) => r.url === '/carteiras' && r.params.get('page') === '1');
    segunda.flush(paginaDeCarteiras([2], 1, 2));

    expect(contagem?.get(1)).toBe(2);
    expect(contagem?.get(2)).toBe(2);
  });

  it('@spec:AC-083 falha ao ler as carteiras vira contagem vazia, nunca erro na lista', () => {
    let contagem: Map<number, number> | undefined;
    let houveErro = false;
    servico.carteirasPorCorretora().subscribe({
      next: (mapa) => (contagem = mapa),
      error: () => (houveErro = true),
    });

    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({}, { status: 500, statusText: 'Internal Server Error' });

    expect(contagem?.size).toBe(0);
    expect(houveErro).toBe(false);
  });

  it('remover chama a exclusão da corretora pelo identificador', () => {
    servico.remover(7).subscribe();
    const requisicao = controle.expectOne('/corretoras/7');
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null, { status: 204, statusText: 'No Content' });
  });
});
