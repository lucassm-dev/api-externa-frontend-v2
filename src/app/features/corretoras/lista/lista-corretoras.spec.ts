import { readFileSync } from 'node:fs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { Corretora } from '../corretoras.model';
import { ListaCorretoras } from './lista-corretoras';

function corretora(id: number, razaoSocial: string, cnpj: string, extra: Partial<Corretora> = {}): Corretora {
  return {
    id,
    cnpj,
    razaoSocial,
    nomeFantasia: null,
    email: null,
    telefone: null,
    cep: null,
    logradouro: null,
    numero: null,
    complemento: null,
    bairro: null,
    cidade: 'São Paulo',
    uf: 'SP',
    situacaoCadastral: 'ATIVA',
    validadaNaCvm: true,
    dataBaseCvm: '2026-09-08',
    dataCadastro: '2026-09-09T10:00:00',
    ...extra,
  };
}

const CATALOGO = [
  corretora(1, 'XP INVESTIMENTOS CCTVM S.A.', '02332886000104'),
  corretora(2, 'RICO INVESTIMENTOS CTVM', '01234567000195', { cidade: 'Rio de Janeiro', uf: 'RJ' }),
  corretora(3, 'CLEAR CTVM', '11222333000181', { validadaNaCvm: false }),
];

describe('Lista de corretoras', () => {
  let fixture: ComponentFixture<ListaCorretoras>;
  let componente: ListaCorretoras;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'corretoras', children: [] },
          { path: 'corretoras/nova', children: [] },
          { path: 'corretoras/:id', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListaCorretoras);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function responder(
    conteudo: Corretora[],
    carteiras: { corretoraId: number }[] | 'falha',
    pagina = { number: 0, totalPages: 1 },
  ) {
    controle.expectOne((r) => r.url === '/corretoras' && r.method === 'GET').flush({
      content: conteudo,
      totalElements: conteudo.length,
      totalPages: pagina.totalPages,
      number: pagina.number,
      size: 20,
    });

    const requisicaoCarteiras = controle.expectOne((r) => r.url === '/carteiras');
    if (carteiras === 'falha') {
      requisicaoCarteiras.flush({}, { status: 500, statusText: 'erro' });
    } else {
      requisicaoCarteiras.flush({
        content: carteiras.map((c, i) => ({ id: i + 1, corretoraId: c.corretoraId })),
        totalElements: carteiras.length,
        totalPages: 1,
        number: 0,
        size: 200,
      });
    }
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await montar();
  });

  afterEach(() => controle.verify());

  it('@spec:AC-076 o título é "Corretoras" e o catálogo é apresentado como compartilhado', async () => {
    await responder(CATALOGO, []);

    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('Corretoras');
    expect(elemento.textContent).not.toContain('Minhas corretoras');
    expect(elemento.querySelector('[data-catalogo-compartilhado]')?.textContent).toMatch(
      /compartilhad/i,
    );
  });

  it('@spec:AC-077 cada linha traz nome, CNPJ formatado, cidade/UF e a validação', async () => {
    await responder(CATALOGO, []);

    const linha = elemento.querySelector('[data-corretora="1"]') as HTMLElement;
    expect(linha.querySelector('[data-nome]')?.textContent).toContain('XP INVESTIMENTOS');
    expect(linha.querySelector('[data-cnpj]')?.textContent).toContain('02.332.886/0001-04');
    expect(linha.querySelector('[data-lugar]')?.textContent).toContain('São Paulo/SP');
    expect(linha.querySelector('[data-validacao]')?.textContent).toMatch(/validada/i);

    const semValidacao = elemento.querySelector('[data-corretora="3"]') as HTMLElement;
    expect(semValidacao.querySelector('[data-validacao]')?.textContent).not.toMatch(/^Validada/i);
  });

  it('@spec:AC-078 avançar de página pede a página seguinte ao servidor', async () => {
    await responder(CATALOGO, [], { number: 0, totalPages: 3 });

    componente.irPara(1);
    await fixture.whenStable();

    const requisicao = controle.expectOne((r) => r.url === '/corretoras' && r.method === 'GET');
    expect(requisicao.request.params.get('page')).toBe('1');
    requisicao.flush({ content: [], totalElements: 41, totalPages: 3, number: 1, size: 20 });
    controle.expectOne((r) => r.url === '/carteiras').flush({
      content: [], totalElements: 0, totalPages: 1, number: 0, size: 200,
    });
    await fixture.whenStable();
  });

  it('@spec:AC-079 buscar um CNPJ do catálogo abre o detalhe daquela corretora', async () => {
    await responder(CATALOGO, []);
    const router = TestBed.inject(Router);

    componente.buscar('02.332.886/0001-04');
    await fixture.whenStable();
    controle.expectOne('/corretoras/cnpj/02332886000104').flush(CATALOGO[0]);
    await fixture.whenStable();

    expect(router.url).toBe('/corretoras/1');
  });

  it('@spec:AC-080 busca sem resultado vira estado vazio com oferta de cadastrar, não erro', async () => {
    await responder(CATALOGO, []);
    const router = TestBed.inject(Router);

    componente.buscar('11.222.333/0001-81');
    await fixture.whenStable();
    controle.expectOne('/corretoras/cnpj/11222333000181').flush(
      { timestamp: '', status: 404, codigo: 'COR-001', error: '', message: 'não encontrada', path: '' },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    const vazio = elemento.querySelector('[data-busca-vazia]') as HTMLElement;
    expect(vazio).toBeTruthy();
    expect(vazio.textContent).toContain('11.222.333/0001-81');
    expect(vazio.querySelector('[data-cadastrar-buscado]')).toBeTruthy();
    expect(elemento.textContent).not.toContain('Corretora não encontrada.');
    expect(router.url).not.toContain('/corretoras/');
  });

  it('@spec:AC-081 o selo conta as carteiras do investidor em cada corretora', async () => {
    await responder(CATALOGO, [
      { corretoraId: 1 },
      { corretoraId: 1 },
      { corretoraId: 2 },
    ]);

    expect(elemento.querySelector('[data-corretora="1"] [data-selo]')?.textContent).toContain(
      '2 carteiras suas',
    );
    expect(elemento.querySelector('[data-corretora="2"] [data-selo]')?.textContent).toContain(
      '1 carteira sua',
    );
    expect(elemento.querySelector('[data-corretora="3"] [data-selo]')).toBeNull();
  });

  it('@spec:AC-082 o selo não reordena a lista', async () => {
    await responder(CATALOGO, [{ corretoraId: 3 }]);

    const ordem = [...elemento.querySelectorAll('[data-corretora]')].map((linha) =>
      linha.getAttribute('data-corretora'),
    );
    expect(ordem).toEqual(['1', '2', '3']);
  });

  it('@spec:AC-083 falha ao contar carteiras deixa a lista inteira na tela, sem selo e sem erro', async () => {
    await responder(CATALOGO, 'falha');

    expect(elemento.querySelectorAll('[data-corretora]').length).toBe(3);
    expect(elemento.querySelectorAll('[data-selo]').length).toBe(0);
    expect(elemento.querySelector('[nivel="erro"], .erro')).toBeNull();
    expect(elemento.textContent).not.toMatch(/erro/i);
  });

  it('o selo de uso passa a ser renderizado pela primitiva de selo, com texto e sinal', async () => {
    await responder(CATALOGO, [{ corretoraId: 1 }, { corretoraId: 1 }]);

    const selo = elemento.querySelector('[data-corretora="1"] app-selo [data-selo]') as HTMLElement;
    expect(selo).not.toBeNull();
    expect(selo.textContent).toContain('2 carteiras suas');
    // O selo carrega um sinal além da cor, não é um texto solto colorido.
    expect(selo.querySelector('[data-icone]')).not.toBeNull();
  });

  it('@spec:AC-245 a linha se destaca sob o ponteiro, e o destaque não é a única pista', async () => {
    await responder(CATALOGO, []);

    const estilo = readFileSync('src/app/features/corretoras/lista/lista-corretoras.scss', 'utf8');

    const hover = estilo.match(/\.linha:hover\s*\{[^}]*\}/)?.[0] ?? '';
    expect(hover).not.toBe('');
    expect(hover).toMatch(/(background|outline):/);
    expect(estilo).toMatch(/\.linha\s*\{[^}]*border:[^;]+;/);
  });

  it('@spec:AC-249 o paginador informa página, total e faixa, desabilitando as pontas', async () => {
    await responder(CATALOGO, [], { number: 0, totalPages: 3 });

    const paginador = elemento.querySelector('app-paginador') as HTMLElement;
    expect(paginador).not.toBeNull();
    expect(paginador.querySelector('[data-pagina]')?.textContent).toMatch(/Página 1 de 3/);
    expect(paginador.querySelector('[data-faixa]')?.textContent).toMatch(/de 3/);
    expect(paginador.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(true);
    expect(paginador.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(false);

    componente.irPara(2);
    await fixture.whenStable();
    controle.expectOne((r) => r.url === '/corretoras' && r.method === 'GET').flush({
      content: CATALOGO,
      totalElements: 3,
      totalPages: 3,
      number: 2,
      size: 20,
    });
    controle.expectOne((r) => r.url === '/carteiras').flush({
      content: [],
      totalElements: 0,
      totalPages: 1,
      number: 0,
      size: 200,
    });
    await fixture.whenStable();

    const rodape = elemento.querySelector('app-paginador') as HTMLElement;
    expect(rodape.querySelector('[data-pagina]')?.textContent).toMatch(/Página 3 de 3/);
    expect(rodape.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(true);
    expect(rodape.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(false);
  });

  it('@spec:AC-250 carregando mostra esqueleto; catálogo vazio mostra estado vazio com próximo passo', async () => {
    expect(elemento.querySelector('[data-esqueleto]')).not.toBeNull();
    expect(elemento.querySelector('app-estado-vazio')).toBeNull();

    await responder([], []);

    expect(elemento.querySelector('[data-esqueleto]')).toBeNull();
    const vazio = elemento.querySelector('app-estado-vazio') as HTMLElement;
    expect(vazio).not.toBeNull();
    expect(vazio.querySelector('[data-proximo-passo]')?.textContent).toMatch(/cadastrar/i);
  });
});
