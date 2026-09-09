import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ROTA_LOGIN } from '../core/sessao/sessao.model';
import { SessaoService } from '../core/sessao/sessao.service';
import { TemaService } from '../core/tema/tema.service';
import { Casca } from './casca';

describe('Casca da área interna', () => {
  let fixture: ComponentFixture<Casca>;
  let sessao: SessaoService;
  let router: Router;

  async function montar(minutosAteExpirar: number) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'entrar', children: [] }])],
    });
    sessao = TestBed.inject(SessaoService);
    router = TestBed.inject(Router);
    sessao.iniciar(
      {
        token: 'jwt-abc',
        tipo: 'Bearer',
        expiraEm: new Date(Date.now() + minutosAteExpirar * 60_000).toISOString(),
      },
      'lucas@exemplo.com',
    );
    fixture = TestBed.createComponent(Casca);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-041 sair limpa a sessão e leva ao login', async () => {
    const elemento = await montar(600);
    const navegou = vi.spyOn(router, 'navigateByUrl');

    const sair = elemento.querySelector('[data-sair]') as HTMLButtonElement;
    expect(sair).not.toBeNull();
    sair.click();
    await fixture.whenStable();

    expect(sessao.ativa()).toBe(false);
    expect(String(navegou.mock.calls[0][0])).toContain(ROTA_LOGIN);
  });

  it('@spec:AC-041 o botão de sair fica sempre visível, com o e-mail de quem está entrado', async () => {
    const elemento = await montar(600);

    expect(elemento.querySelector('[data-sair]')?.textContent).toMatch(/sair/i);
    expect(elemento.textContent).toContain('lucas@exemplo.com');
  });

  it('@spec:AC-043 o aviso aparece a menos de 5 minutos do fim, sem nenhuma chamada ao servidor', async () => {
    const faltando3 = await montar(3);
    expect(faltando3.querySelector('[data-aviso-sessao]')).not.toBeNull();

    const faltando60 = await montar(60);
    expect(faltando60.querySelector('[data-aviso-sessao]')).toBeNull();
  });

  it('@spec:AC-044 o aviso é comunicado como aviso, não bloqueia e oferece entrar novamente', async () => {
    const elemento = await montar(3);

    const aviso = elemento.querySelector('[data-aviso-sessao] [data-nivel]');
    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(aviso?.getAttribute('role')).not.toBe('alert');
    expect(elemento.querySelector('[data-entrar-novamente]')).not.toBeNull();
    // o conteúdo da área interna continua acessível: o aviso não é bloqueio
    expect(elemento.querySelector('router-outlet')).not.toBeNull();
  });

  it('@spec:AC-044 entrar novamente encerra a sessão atual e leva ao login', async () => {
    const elemento = await montar(3);
    const navegou = vi.spyOn(router, 'navigateByUrl');

    (elemento.querySelector('[data-entrar-novamente]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(sessao.ativa()).toBe(false);
    expect(String(navegou.mock.calls[0][0])).toContain(ROTA_LOGIN);
  });
});

describe('Navegação do shell', () => {
  let fixture: ComponentFixture<Casca>;

  async function montar(rotaInicial = '/painel') {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'entrar', children: [] },
          { path: 'painel', children: [] },
          { path: 'corretoras', children: [] },
          { path: 'carteiras', children: [] },
          { path: 'acoes', children: [] },
          { path: 'operacoes', children: [] },
          { path: 'desempenho', children: [] },
        ]),
      ],
    });
    const sessao = TestBed.inject(SessaoService);
    sessao.iniciar(
      {
        token: 'jwt-abc',
        tipo: 'Bearer',
        expiraEm: new Date(Date.now() + 600 * 60_000).toISOString(),
      },
      'lucas@exemplo.com',
    );
    await TestBed.inject(Router).navigateByUrl(rotaInicial);
    fixture = TestBed.createComponent(Casca);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-047 a barra superior leva às seis áreas do produto', async () => {
    const elemento = await montar();

    const areas = [...elemento.querySelectorAll('[data-areas] a')].map((link) =>
      link.getAttribute('data-area'),
    );
    expect(areas).toEqual([
      '/painel',
      '/corretoras',
      '/carteiras',
      '/acoes',
      '/operacoes',
      '/desempenho',
    ]);
  });

  it('@spec:AC-047 a área em que o investidor está aparece marcada', async () => {
    const noPainel = await montar('/painel');
    expect(noPainel.querySelector('[data-area="/painel"]')?.getAttribute('aria-current')).toBe(
      'page',
    );
    expect(
      noPainel.querySelector('[data-area="/carteiras"]')?.getAttribute('aria-current'),
    ).toBeNull();

    const nasCarteiras = await montar('/carteiras');
    expect(
      nasCarteiras.querySelector('[data-area="/carteiras"]')?.getAttribute('aria-current'),
    ).toBe('page');
  });

  it('@spec:AC-048 sair fica na própria barra, fora de qualquer menu suspenso', async () => {
    const elemento = await montar();

    const sair = elemento.querySelector('[data-sair]');
    expect(sair).not.toBeNull();
    expect(sair?.closest('header.barra')).not.toBeNull();
    expect(elemento.querySelectorAll('[mat-menu-trigger-for], [aria-haspopup]')).toHaveLength(0);
  });

  it('@spec:AC-049 a alternância de tema muda o tema e a escolha sobrevive à visita', async () => {
    const elemento = await montar();
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');

    (elemento.querySelector('[data-alternar-tema]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');

    // visita seguinte: a aplicação sobe de novo e lê o que ficou guardado
    TestBed.resetTestingModule();
    document.documentElement.removeAttribute('data-tema');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    expect(TestBed.inject(TemaService).tema()).toBe('escuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
  });
});
