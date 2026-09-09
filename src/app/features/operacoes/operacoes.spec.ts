import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../core/erros/erro.interceptor';
import { Operacoes } from './operacoes';

const CARTEIRAS = {
  content: [
    {
      id: 9,
      investidorId: 1,
      corretoraId: 7,
      nomeCorretora: 'XP',
      mercado: 'BR',
      moeda: 'BRL',
      nome: 'Dividendos',
      ativa: true,
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
};

const CATALOGO = {
  content: [
    {
      id: 1,
      ticker: 'PETR4',
      nomeEmpresa: 'Petrobras',
      mercado: 'BR',
      moeda: 'BRL',
      cotacaoAtual: 32.5,
      dataHoraCotacao: new Date().toISOString(),
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
};

const OPERACAO_NO_EXTRATO = {
  id: 1,
  carteiraId: 9,
  ticker: 'PETR4',
  tipo: 'COMPRA',
  quantidade: 100,
  precoUnitario: 32.5,
  valorTotal: 3250,
  dataHora: '2026-09-09T10:00:00',
  moeda: 'BRL',
};

function extratoCom(itens: unknown[]) {
  return { content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: 20 };
}

const RESPOSTA_DA_COMPRA = {
  id: 2,
  carteiraId: 9,
  ticker: 'PETR4',
  tipo: 'COMPRA',
  quantidade: 100,
  precoUnitario: 33.1,
  valorTotal: 3310,
  dataHora: '2026-09-09T12:00:00',
  moeda: 'BRL',
  avisos: [] as string[],
};

describe('Tela de operações', () => {
  let fixture: ComponentFixture<Operacoes>;
  let componente: Operacoes;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  async function montar(queryParams: Record<string, string> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'carteiras', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Operacoes);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    await fixture.whenStable();

    for (const requisicao of controle.match((r) => r.url === '/carteiras')) {
      requisicao.flush(CARTEIRAS);
    }
    controle.expectOne((r) => r.url === '/operacoes').flush(extratoCom([OPERACAO_NO_EXTRATO]));
    for (const requisicao of controle.match((r) => r.url === '/acoes')) {
      requisicao.flush(CATALOGO);
    }
    fixture.detectChanges();
    await fixture.whenStable();
    for (const requisicao of controle.match((r) => r.url.includes('/posicoes'))) {
      requisicao.flush([]);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function registrarCompra(
    resposta = RESPOSTA_DA_COMPRA,
    extratoDepois: unknown[] = [resposta],
  ) {
    componente.registrar({
      tipo: 'COMPRA',
      operacao: { carteiraId: 9, ticker: 'PETR4', quantidade: 100 },
    });
    controle.expectOne('/operacoes/compra').flush(resposta);
    fixture.detectChanges();
    await fixture.whenStable();
    controle.expectOne((r) => r.url === '/operacoes').flush(extratoCom(extratoDepois));
    for (const requisicao of controle.match((r) => r.url.includes('/posicoes'))) {
      requisicao.flush([]);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  }

  afterEach(() => {
    for (const pendente of controle.match(() => true)) {
      pendente.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    }
    controle.verify();
  });

  it('@spec:AC-153 a tela tem um formulário e o extrato na mesma página', async () => {
    await montar();

    expect(elemento.querySelector('app-formulario-operacao')).toBeTruthy();
    expect(elemento.querySelector('[data-extrato]')).toBeTruthy();
  });

  it('@spec:AC-153 os parâmetros da carteira abrem o formulário já no tipo pedido', async () => {
    await montar({ carteira: '9', tipo: 'VENDA' });

    expect(componente.carteiraInicial()).toBe(9);
    expect(componente.tipoInicial()).toBe('VENDA');
  });

  it('@spec:AC-156 depois de registrar, o formulário continua na tela e há volta à carteira', async () => {
    await montar();
    await registrarCompra();

    expect(elemento.querySelector('app-formulario-operacao')).toBeTruthy();
    expect(elemento.querySelector('[data-voltar-carteiras]')).toBeTruthy();
    expect(elemento.querySelector('[data-resultado]')).toBeTruthy();
  });

  it('@spec:AC-173 a operação registrada aparece no extrato sem recarga manual', async () => {
    await montar();
    expect(elemento.querySelectorAll('[data-operacao]').length).toBe(1);

    await registrarCompra(RESPOSTA_DA_COMPRA, [RESPOSTA_DA_COMPRA, OPERACAO_NO_EXTRATO]);

    const ids = [...elemento.querySelectorAll('[data-operacao]')].map((linha) =>
      linha.getAttribute('data-operacao'),
    );
    expect(ids).toEqual(['2', '1']);
  });

  it('@spec:AC-166 uma compra com avisos é apresentada como registrada, sem erro na tela', async () => {
    await montar();
    await registrarCompra({
      ...RESPOSTA_DA_COMPRA,
      avisos: ['O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.'],
    });

    expect(elemento.querySelector('[data-confirmacao]')!.textContent).toContain('registrada');
    expect(elemento.querySelectorAll('[data-nivel="aviso"]').length).toBe(1);
    expect(elemento.querySelectorAll('[data-nivel="erro"]').length).toBe(0);
    expect(componente.textoDoErro()).toBeNull();
  });

  it('@spec:AC-177 depois de editar, o extrato é relido e mostra os valores novos', async () => {
    await montar();

    componente.abrirEdicao(OPERACAO_NO_EXTRATO as never);
    fixture.detectChanges();
    componente.salvarEdicao({ quantidade: 50 });

    const alteracao = controle.expectOne('/operacoes/1');
    expect(alteracao.request.method).toBe('PUT');
    alteracao.flush({ ...RESPOSTA_DA_COMPRA, id: 1, quantidade: 50, avisos: [] });
    fixture.detectChanges();
    await fixture.whenStable();

    controle
      .expectOne((r) => r.url === '/operacoes')
      .flush(extratoCom([{ ...OPERACAO_NO_EXTRATO, quantidade: 50 }]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(elemento.querySelector('[data-operacao="1"] [data-quantidade]')!.textContent).toContain(
      '50',
    );
    expect(elemento.querySelector('app-editar-operacao')).toBeNull();
  });

  it('@spec:AC-180 depois de excluir, a operação sai do extrato sem recarga manual', async () => {
    await montar();

    componente.excluir(OPERACAO_NO_EXTRATO as never);
    controle.expectOne('/operacoes/1').flush(null);
    fixture.detectChanges();
    await fixture.whenStable();

    controle.expectOne((r) => r.url === '/operacoes').flush(extratoCom([]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(elemento.querySelector('[data-operacao="1"]')).toBeNull();
    expect(elemento.querySelector('[data-extrato-vazio]')).toBeTruthy();
  });

  it('@spec:AC-182 OPE-001 relê o extrato em vez de insistir na operação que sumiu', async () => {
    await montar();

    componente.excluir(OPERACAO_NO_EXTRATO as never);
    controle.expectOne('/operacoes/1').flush(
      {
        timestamp: '2026-09-09T12:00:00Z',
        status: 404,
        codigo: 'OPE-001',
        error: 'erro',
        message: 'não encontrada',
        path: '/operacoes/1',
      },
      { status: 404, statusText: 'erro' },
    );
    fixture.detectChanges();
    await fixture.whenStable();

    controle.expectOne((r) => r.url === '/operacoes').flush(extratoCom([]));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(componente.textoDoErro()).toBe('Operação não encontrada.');
    expect(elemento.querySelector('[data-operacao="1"]')).toBeNull();
  });
});
