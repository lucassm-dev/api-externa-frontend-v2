import { readFileSync } from 'node:fs';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Pagina } from '../../../core/api/pagina';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { Acao } from '../acoes.model';
import { ListaAcoes } from './lista-acoes';

const AGORA = new Date('2026-09-09T14:00:00');

const PETR4: Acao = {
  id: 12,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  mercado: 'BR',
  moeda: 'BRL',
  cotacaoAtual: 38.42,
  dataHoraCotacao: '2026-09-09T13:55:00',
};

const AAPL: Acao = {
  id: 13,
  ticker: 'AAPL',
  nomeEmpresa: 'Apple Inc.',
  mercado: 'US',
  moeda: 'USD',
  cotacaoAtual: 231.5,
  dataHoraCotacao: '2026-09-09T13:00:00',
};

function pagina(itens: Acao[], extra: Partial<Pagina<Acao>> = {}): Pagina<Acao> {
  return { content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: 20, ...extra };
}

describe('Lista de ações', () => {
  let fixture: ComponentFixture<ListaAcoes>;
  let componente: ListaAcoes;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  beforeEach(() => {
    // Só a data é fixada: parar os timers travaria a estabilização do componente.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'acoes', children: [] },
          { path: 'acoes/nova', children: [] },
          { path: 'acoes/:ticker', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListaAcoes);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.useRealTimers());

  async function carregar(resposta = pagina([PETR4, AAPL])) {
    await fixture.whenStable();
    controle.expectOne((r) => r.url === '/acoes').flush(resposta);
    await fixture.whenStable();
  }

  it('@spec:AC-130 o título é "Ações" e o catálogo é declarado compartilhado', async () => {
    await carregar();

    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('Ações');
    expect(elemento.querySelector('[data-catalogo-compartilhado]')?.textContent).toContain(
      'compartilhado',
    );
    expect((elemento.textContent ?? '').toLowerCase()).not.toContain('minhas ações');
  });

  it('@spec:AC-131 cada linha traz ticker, empresa, mercado, moeda e cotação com horário', async () => {
    await carregar();

    const linhas = elemento.querySelectorAll('[data-acao]');
    expect(linhas.length).toBe(2);

    const brasileira = linhas[0];
    expect(brasileira.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
    expect(brasileira.querySelector('[data-empresa]')?.textContent).toContain(
      'Petróleo Brasileiro S.A.',
    );
    expect(brasileira.querySelector('[data-mercado]')?.textContent).toContain('Brasil');
    expect(brasileira.querySelector('[data-moeda]')?.textContent).toContain('BRL');
    expect(brasileira.querySelector('[data-horario]')?.textContent).toContain('13:55');

    // Nenhuma cotação sem horário: cada preço exibido tem o seu (ADR-005).
    expect(elemento.querySelectorAll('[data-numero]').length).toBe(
      elemento.querySelectorAll('[data-horario]').length,
    );
  });

  it('@spec:AC-135 cotação com mais de 15 minutos aparece marcada, a recente não', async () => {
    await carregar();

    const [recente, velha] = elemento.querySelectorAll('[data-valor-com-horario]');
    expect(recente.getAttribute('data-defasado')).toBe('false');
    expect(velha.getAttribute('data-defasado')).toBe('true');
    expect(velha.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });

  it('@spec:AC-132 avançar de página busca a página pedida e mantém a ordem do servidor', async () => {
    await carregar(pagina([PETR4, AAPL], { number: 0, totalPages: 2, totalElements: 40 }));

    componente.irPara(1);
    await fixture.whenStable();

    const requisicao = controle.expectOne((r) => r.url === '/acoes');
    expect(requisicao.request.params.get('page')).toBe('1');
    requisicao.flush(pagina([AAPL, PETR4], { number: 1, totalPages: 2, totalElements: 40 }));
    await fixture.whenStable();

    const tickers = [...elemento.querySelectorAll('[data-ticker]')].map((t) => t.textContent?.trim());
    expect(tickers).toEqual(['AAPL', 'PETR4']);
  });

  it('@spec:AC-133 buscar ticker existente abre a ação', async () => {
    await carregar();

    componente.buscar('petr4');
    await fixture.whenStable();
    controle.expectOne('/acoes/ticker/PETR4').flush(PETR4);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/acoes/PETR4');
  });

  it('@spec:AC-133 buscar ticker inexistente vira estado vazio com oferta de cadastrar', async () => {
    await carregar();

    componente.buscar('VALE3');
    await fixture.whenStable();
    controle
      .expectOne('/acoes/ticker/VALE3')
      .flush(
        { timestamp: '2026-09-09T12:00:00Z', status: 404, codigo: 'ACA-001', error: 'erro', message: 'x', path: '/acoes/ticker/VALE3' },
        { status: 404, statusText: 'erro' },
      );
    await fixture.whenStable();

    const vazio = elemento.querySelector('[data-busca-vazia]');
    expect(vazio?.textContent).toContain('VALE3');
    expect(elemento.querySelector('[data-cadastrar-buscado]')?.getAttribute('href')).toContain(
      '/acoes/nova',
    );
    expect((elemento.textContent ?? '')).not.toContain('Ação não encontrada.');
  });

  it('@spec:AC-134 a lista não marca posse nem consulta posições do investidor', async () => {
    await carregar();

    controle.expectNone((r) => r.url.includes('/posicoes'));
    controle.expectNone((r) => r.url.includes('/consolidado'));
    controle.expectNone((r) => r.url === '/carteiras');
    expect(elemento.querySelector('[data-selo]')).toBeNull();
    expect((elemento.textContent ?? '').toLowerCase()).not.toContain('você possui');
  });

  it('@spec:AC-136 nenhuma atualização de cotação parte da lista, e nada fica agendado', async () => {
    await carregar();

    // Com o relógio adiantado 20 minutos, qualquer refresh agendado teria
    // registrado sua requisição no controlador — nenhum registra.
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] });
    vi.setSystemTime(new Date(AGORA.getTime() + 20 * 60_000));
    vi.advanceTimersByTime(20 * 60_000);

    controle.expectNone((r) => r.url.includes('atualizar-cotacao'));
    controle.verify();
  });

  it('@spec:AC-247 cada linha traz o monograma do ativo junto ao ticker', async () => {
    await carregar();

    const primeira = elemento.querySelector('[data-acao]') as HTMLElement;
    const monograma = primeira.querySelector('[data-monograma]');
    expect(monograma).not.toBeNull();
    expect(monograma?.getAttribute('aria-label')).toContain('PETR4');
    expect(primeira.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-245 a linha se destaca sob o ponteiro, e o destaque não é a única pista', () => {
    const estilo = readFileSync('src/app/features/acoes/lista/lista-acoes.scss', 'utf8');

    const hover = estilo.match(/\.linha:hover\s*\{[^}]*\}/)?.[0] ?? '';
    expect(hover).not.toBe('');
    expect(hover).toMatch(/(background|outline):/);

    // Fora do hover, cada linha tem borda e superfície próprias.
    expect(estilo).toMatch(/\.linha\s*\{[^}]*border:[^;]+;/);
  });

  it('@spec:AC-249 o paginador informa página, total e faixa, desabilitando as pontas', async () => {
    await carregar(pagina([PETR4, AAPL], { number: 0, totalPages: 3, totalElements: 50, size: 20 }));

    const paginador = elemento.querySelector('app-paginador') as HTMLElement;
    expect(paginador).not.toBeNull();
    expect(paginador.querySelector('[data-pagina]')?.textContent).toMatch(/Página 1 de 3/);
    expect(paginador.querySelector('[data-faixa]')?.textContent).toMatch(/1.*20.*50/);
    expect(paginador.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(true);
    expect(paginador.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(false);

    componente.irPara(2);
    await fixture.whenStable();
    controle
      .expectOne((r) => r.url === '/acoes')
      .flush(pagina([AAPL, PETR4], { number: 2, totalPages: 3, totalElements: 50, size: 20 }));
    await fixture.whenStable();

    const rodape = elemento.querySelector('app-paginador') as HTMLElement;
    expect(rodape.querySelector('[data-pagina]')?.textContent).toMatch(/Página 3 de 3/);
    expect(rodape.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(true);
    expect(rodape.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(false);
  });

  it('@spec:AC-250 carregando mostra esqueleto; catálogo vazio mostra estado vazio com próximo passo', async () => {
    await fixture.whenStable();

    expect(elemento.querySelector('[data-esqueleto]')).not.toBeNull();
    expect(elemento.querySelector('app-estado-vazio')).toBeNull();

    controle.expectOne((r) => r.url === '/acoes').flush(pagina([]));
    await fixture.whenStable();

    expect(elemento.querySelector('[data-esqueleto]')).toBeNull();
    const vazio = elemento.querySelector('app-estado-vazio') as HTMLElement;
    expect(vazio).not.toBeNull();
    expect(vazio.querySelector('[data-proximo-passo]')?.textContent).toMatch(/cadastrar/i);
  });
});
