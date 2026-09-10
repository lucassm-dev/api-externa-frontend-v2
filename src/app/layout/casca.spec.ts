import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

describe('Casca responsiva com menu compacto (T-115)', () => {
  let fixture: ComponentFixture<Casca>;
  let router: Router;

  const matchMediaOriginal = globalThis.matchMedia;
  let estreita: { set(valor: boolean): void };

  function instalarMatchMedia(inicial: boolean) {
    const ouvintes = new Set<(evento: MediaQueryListEvent) => void>();
    let atual = inicial;
    const lista = {
      get matches() {
        return atual;
      },
      media: '',
      onchange: null,
      addEventListener: (_tipo: string, cb: (evento: MediaQueryListEvent) => void) =>
        ouvintes.add(cb),
      removeEventListener: (_tipo: string, cb: (evento: MediaQueryListEvent) => void) =>
        ouvintes.delete(cb),
      addListener: (cb: (evento: MediaQueryListEvent) => void) => ouvintes.add(cb),
      removeListener: (cb: (evento: MediaQueryListEvent) => void) => ouvintes.delete(cb),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList;

    globalThis.matchMedia = ((consulta: string) => {
      (lista as { media: string }).media = consulta;
      return lista;
    }) as typeof globalThis.matchMedia;

    estreita = {
      set(valor: boolean) {
        atual = valor;
        ouvintes.forEach((cb) => cb({ matches: valor } as MediaQueryListEvent));
      },
    };
  }

  afterEach(() => {
    globalThis.matchMedia = matchMediaOriginal;
  });

  async function montar(telaEstreita: boolean, rotaInicial = '/painel') {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
    instalarMatchMedia(telaEstreita);
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
    router = TestBed.inject(Router);
    sessao.iniciar(
      {
        token: 'jwt-abc',
        tipo: 'Bearer',
        expiraEm: new Date(Date.now() + 600 * 60_000).toISOString(),
      },
      'lucas@exemplo.com',
    );
    await router.navigateByUrl(rotaInicial);
    fixture = TestBed.createComponent(Casca);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const menu = (el: HTMLElement) => el.querySelector('[data-menu]') as HTMLButtonElement | null;
  const nav = (el: HTMLElement) => el.querySelector('[data-areas]') as HTMLElement | null;

  it('@spec:AC-270 o documento não impõe largura mínima maior que a tela', () => {
    const estilos = readFileSync(join(process.cwd(), 'src/styles.scss'), 'utf8');

    for (const bloco of estilos.match(/\bbody\s*\{[^}]*\}/gs) ?? []) {
      expect(bloco).not.toMatch(/min-width/);
    }
    expect(estilos).not.toContain('largura-minima');

    const estilosCasca = readFileSync(join(process.cwd(), 'src/app/layout/casca.scss'), 'utf8');
    expect(estilosCasca).not.toMatch(/min-width\s*:/);
  });

  it('@spec:AC-270 a 360px a navegação larga não fica exposta: colapsa atrás do menu', async () => {
    const el = await montar(true);

    expect(menu(el)).not.toBeNull();
    // a lista de áreas não ocupa a horizontal enquanto fechada
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 abaixo de 768px as áreas ficam atrás de um botão de menu', async () => {
    const el = await montar(true);

    const botao = menu(el);
    expect(botao).not.toBeNull();
    expect(botao?.getAttribute('aria-expanded')).toBe('false');
    expect(botao?.getAttribute('aria-controls')).toBe('areas-do-produto');
    expect(nav(el)?.id).toBe('areas-do-produto');
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 o botão de menu anuncia o estado e alterna a navegação', async () => {
    const el = await montar(true);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 o menu fecha por teclado com Esc', async () => {
    const el = await montar(true);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    nav(el)!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('@spec:AC-271 o menu fecha ao navegar para outra área', async () => {
    const el = await montar(true);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    await router.navigateByUrl('/carteiras');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('@spec:AC-271 clicar numa área do menu fecha o painel', async () => {
    const el = await montar(true);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();

    (nav(el)!.querySelector('[data-area="/carteiras"]') as HTMLAnchorElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('@spec:AC-271 em tela larga a navegação fica visível, sem botão de menu', async () => {
    const el = await montar(false);

    expect(menu(el)).toBeNull();
    expect(nav(el)).not.toBeNull();
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);
  });

  it('@spec:AC-271 ao alargar a tela o menu compacto se recolhe', async () => {
    const el = await montar(true);

    menu(el)!.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    estreita.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(menu(el)).toBeNull();
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);
  });
});
