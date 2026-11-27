import { readFileSync } from 'node:fs';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { ROTA_LOGIN } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { TemaService, temaService } from '@/core/tema/tema.service';
import { classesDe, gerarCss } from '@/test/tailwind';
import { Casca } from './casca';

const AREAS = ['/painel', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/relatorios', '/desempenho'];

function instalarMatchMedia(inicial: boolean) {
  const ouvintes = new Set<(evento: MediaQueryListEvent) => void>();
  let atual = inicial;
  const lista = {
    get matches() {
      return atual;
    },
    media: '',
    onchange: null,
    addEventListener: (_tipo: string, cb: (evento: MediaQueryListEvent) => void) => ouvintes.add(cb),
    removeEventListener: (_tipo: string, cb: (evento: MediaQueryListEvent) => void) => ouvintes.delete(cb),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  } as unknown as MediaQueryList;
  window.matchMedia = (() => lista) as typeof window.matchMedia;
  return {
    definir(valor: boolean) {
      atual = valor;
      act(() => ouvintes.forEach((cb) => cb({ matches: valor } as MediaQueryListEvent)));
    },
  };
}

const matchMediaOriginal = window.matchMedia;

async function montar({ minutos = 600, rota = '/painel', estreita = false } = {}) {
  localStorage.clear();
  document.documentElement.removeAttribute('data-tema');
  temaService.definir('claro');
  const tela = instalarMatchMedia(estreita);
  sessao.iniciar(
    { token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + minutos * 60_000).toISOString() },
    'lucas@exemplo.com',
  );
  const roteador = createMemoryRouter(
    [
      { path: '/entrar', element: <p data-login /> },
      { element: <Casca />, children: AREAS.map((path) => ({ path, element: <Outlet /> })) },
    ],
    { initialEntries: [rota] },
  );
  const { container } = render(<RouterProvider router={roteador} />);
  await waitFor(() => expect(container.querySelector('[data-casca]')).not.toBeNull());
  return { el: container, roteador, tela };
}

afterEach(() => {
  window.matchMedia = matchMediaOriginal;
  sessao.encerrar();
});

const botaoEm = (el: HTMLElement, seletor: string) => el.querySelector(`${seletor} button`) as HTMLButtonElement;

describe('Casca da área interna', () => {
  it('@spec:AC-041 sair limpa a sessão e leva ao login', async () => {
    const { el, roteador } = await montar();

    fireEvent.click(botaoEm(el, '[data-sair]'));

    expect(sessao.ativa()).toBe(false);
    await waitFor(() => expect(roteador.state.location.pathname).toBe(ROTA_LOGIN));
  });

  it('@spec:AC-041 o botão de sair fica sempre visível, com o e-mail de quem está entrado', async () => {
    const { el } = await montar();

    expect(botaoEm(el, '[data-sair]').getAttribute('aria-label')).toMatch(/sair/i);
    expect(el.textContent).toContain('lucas@exemplo.com');
  });

  it('@spec:AC-287 sair por ícone mantém o encerramento direto da sessão', async () => {
    const { el, roteador } = await montar();
    const sair = botaoEm(el, '[data-sair]');

    expect(sair.getAttribute('aria-label')).toBe('Sair do sistema');
    expect(el.querySelector('[data-sair] svg[aria-hidden="true"]')).not.toBeNull();

    fireEvent.click(sair);

    expect(sessao.ativa()).toBe(false);
    await waitFor(() => expect(roteador.state.location.pathname).toBe(ROTA_LOGIN));
  });

  it('@spec:AC-043 o aviso aparece a menos de 5 minutos do fim, sem nenhuma chamada ao servidor', async () => {
    const chamadas = vi.fn();
    vi.stubGlobal('fetch', chamadas);

    const faltando3 = await montar({ minutos: 3 });
    expect(faltando3.el.querySelector('[data-aviso-sessao]')).not.toBeNull();
    faltando3.el.remove();

    const faltando60 = await montar({ minutos: 60 });
    expect(faltando60.el.querySelector('[data-aviso-sessao]')).toBeNull();
    expect(chamadas).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('@spec:AC-044 o aviso é comunicado como aviso, não bloqueia e oferece entrar novamente', async () => {
    const { el } = await montar({ minutos: 3 });

    const aviso = el.querySelector('[data-aviso-sessao] [data-nivel]');
    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(aviso?.getAttribute('role')).not.toBe('alert');
    expect(el.querySelector('[data-entrar-novamente]')).not.toBeNull();
    // o conteúdo da área interna continua acessível: o aviso não é bloqueio
    expect(el.querySelector('main')).not.toBeNull();
  });

  it('@spec:AC-044 entrar novamente encerra a sessão atual e leva ao login', async () => {
    const { el, roteador } = await montar({ minutos: 3 });

    fireEvent.click(el.querySelector('[data-entrar-novamente]')!);

    expect(sessao.ativa()).toBe(false);
    await waitFor(() => expect(roteador.state.location.pathname).toBe(ROTA_LOGIN));
  });
});

describe('Navegação do shell', () => {
  it('@spec:AC-401 a barra do investidor leva às sete áreas, em ordem', async () => {
    const { el } = await montar();

    const areas = [...el.querySelectorAll('[data-areas] a')].map((link) => link.getAttribute('data-area'));
    expect(areas).toEqual(AREAS);
  });

  it('@spec:AC-401 a área em que o investidor está aparece marcada', async () => {
    const noPainel = await montar({ rota: '/painel' });
    expect(noPainel.el.querySelector('[data-area="/painel"]')?.getAttribute('aria-current')).toBe('page');
    expect(noPainel.el.querySelector('[data-area="/carteiras"]')?.getAttribute('aria-current')).toBeNull();
    noPainel.el.remove();

    const nasCarteiras = await montar({ rota: '/carteiras' });
    expect(nasCarteiras.el.querySelector('[data-area="/carteiras"]')?.getAttribute('aria-current')).toBe('page');
  });

  it('@spec:AC-048 sair fica na própria barra, fora de qualquer menu suspenso', async () => {
    const { el } = await montar();

    const sair = botaoEm(el, '[data-sair]');
    expect(sair).not.toBeNull();
    expect(sair.closest('header[data-barra]')).not.toBeNull();
    expect(el.querySelectorAll('[aria-haspopup]')).toHaveLength(0);
  });

  it('@spec:AC-049 a alternância de tema muda o tema e a escolha sobrevive à visita', async () => {
    const { el } = await montar();
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');

    fireEvent.click(botaoEm(el, '[data-alternar-tema]'));
    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');

    // visita seguinte: a aplicação sobe de novo e lê o que ficou guardado
    document.documentElement.removeAttribute('data-tema');
    expect(new TemaService().tema()).toBe('escuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
  });

  it('@spec:AC-285 identifica o investidor com e-mail e avatar de iniciais', async () => {
    const { el } = await montar();
    const identidade = el.querySelector('[data-identidade-investidor]');
    const avatar = identidade?.querySelector('[data-avatar-investidor]');

    expect(identidade?.textContent).toContain('Investidor');
    expect(identidade?.textContent).toContain('lucas@exemplo.com');
    expect(identidade?.querySelector('[data-email]')?.getAttribute('title')).toBe('lucas@exemplo.com');
    expect(avatar?.textContent?.trim()).toBe('LE');
    expect(avatar?.getAttribute('aria-hidden')).toBe('true');
    expect(identidade?.getAttribute('aria-haspopup')).toBeNull();
  });

  it('@spec:AC-286 tema usa ícone e nomeia a ação disponível nos dois estados', async () => {
    const { el } = await montar();
    const controle = () => el.querySelector('[data-alternar-tema]');

    expect(controle()?.getAttribute('data-tema-atual')).toBe('claro');
    expect(botaoEm(el, '[data-alternar-tema]').getAttribute('aria-label')).toBe('Ativar tema escuro');
    expect(controle()?.querySelector('[data-icone-tema="lua"]')).not.toBeNull();

    fireEvent.click(botaoEm(el, '[data-alternar-tema]'));

    expect(controle()?.getAttribute('data-tema-atual')).toBe('escuro');
    expect(botaoEm(el, '[data-alternar-tema]').getAttribute('aria-label')).toBe('Ativar tema claro');
    expect(controle()?.querySelector('[data-icone-tema="sol"]')).not.toBeNull();
  });
});

describe('Casca responsiva com menu compacto', () => {
  const menu = (el: HTMLElement) => el.querySelector('[data-menu]') as HTMLButtonElement | null;
  const nav = (el: HTMLElement) => el.querySelector('[data-areas]') as HTMLElement | null;

  it('@spec:AC-270 o documento não impõe largura mínima maior que a tela', () => {
    const global = readFileSync('src/styles/global.css', 'utf8');
    for (const bloco of global.match(/\bbody\s*\{[^}]*\}/gs) ?? []) {
      expect(bloco).not.toMatch(/min-width/);
    }
    expect(global).not.toContain('largura-minima');

    const casca = readFileSync('src/layout/casca.tsx', 'utf8');
    const pisos = [...casca.matchAll(/\bmin-w-(\S+?)["'\s]/g)].map(([, valor]) => valor);
    expect(pisos.length).toBeGreaterThan(0);
    expect(pisos.every((valor) => valor === '0')).toBe(true);
  });

  it('@spec:AC-288 a identidade trunca só visualmente e os ícones têm alvo móvel de 44px', async () => {
    const { el } = await montar({ estreita: true });
    const email = el.querySelector('[data-identidade-investidor] [data-email]') as HTMLElement;

    expect(email.textContent).toBe('lucas@exemplo.com');
    expect(email.getAttribute('title')).toBe('lucas@exemplo.com');
    expect(await gerarCss(classesDe(email))).toMatch(/text-overflow:\s*ellipsis/);

    const icone = botaoEm(el, '[data-sair]');
    const css = await gerarCss(classesDe(icone));
    const estreito = css.slice(css.indexOf('@media (width < 48rem)'));
    expect(css).toContain('@media (width < 48rem)');
    expect(estreito).toMatch(/min-width:\s*calc\(var\(--spacing\) \* 11\)/);
    expect(estreito).toMatch(/min-height:\s*calc\(var\(--spacing\) \* 11\)/);
  });

  it('@spec:AC-270 a 360px a navegação larga não fica exposta: colapsa atrás do menu', async () => {
    const { el } = await montar({ estreita: true });

    expect(menu(el)).not.toBeNull();
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 abaixo de 768px as áreas ficam atrás de um botão de menu', async () => {
    const { el } = await montar({ estreita: true });

    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
    expect(menu(el)?.getAttribute('aria-controls')).toBe('areas-do-produto');
    expect(nav(el)?.id).toBe('areas-do-produto');
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 o botão de menu anuncia o estado e alterna a navegação', async () => {
    const { el } = await montar({ estreita: true });

    fireEvent.click(menu(el)!);
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);

    fireEvent.click(menu(el)!);
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
    expect(nav(el)?.hasAttribute('hidden')).toBe(true);
  });

  it('@spec:AC-271 o menu fecha por teclado com Esc', async () => {
    const { el } = await montar({ estreita: true });

    fireEvent.click(menu(el)!);
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    fireEvent.keyDown(nav(el)!, { key: 'Escape' });
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('@spec:AC-271 o menu fecha ao navegar para outra área', async () => {
    const { el, roteador } = await montar({ estreita: true });

    fireEvent.click(menu(el)!);
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    await act(() => roteador.navigate('/carteiras'));
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('false');
  });

  it('@spec:AC-271 clicar numa área do menu fecha o painel', async () => {
    const { el } = await montar({ estreita: true });

    fireEvent.click(menu(el)!);
    fireEvent.click(nav(el)!.querySelector('[data-area="/carteiras"]')!);

    await waitFor(() => expect(menu(el)?.getAttribute('aria-expanded')).toBe('false'));
  });

  it('@spec:AC-271 em tela larga a navegação fica visível, sem botão de menu', async () => {
    const { el } = await montar({ estreita: false });

    expect(menu(el)).toBeNull();
    expect(nav(el)).not.toBeNull();
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);
  });

  it('@spec:AC-271 ao alargar a tela o menu compacto se recolhe', async () => {
    const { el, tela } = await montar({ estreita: true });

    fireEvent.click(menu(el)!);
    expect(menu(el)?.getAttribute('aria-expanded')).toBe('true');

    tela.definir(false);

    expect(menu(el)).toBeNull();
    expect(nav(el)?.hasAttribute('hidden')).toBe(false);
  });
});
