import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas', fotoUrl: null };

const RELATORIO = {
  total: 1234,
  picos: [
    { hora: '2026-11-20T14:00:00', requisicoes: 200 },
    { hora: '2026-11-21T09:00:00', requisicoes: 50 },
  ],
  usuarios: [
    { id: 1, email: 'lucas@exemplo.com', requisicoes: 900 },
    { id: 3, email: 'ana@exemplo.com', requisicoes: 334 },
  ],
};

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const parametros = (chamada: Chamada) => Object.fromEntries(url(chamada).searchParams);
const doUso = (chamadas: Chamada[]) => chamadas.filter((chamada) => url(chamada).pathname === '/admin/uso');

function abrir(endereco: string, identidade: Identidade = ADMIN, especial?: (chamada: Chamada) => Response | undefined) {
  sessao.iniciar(TOKEN(), 'admin@exemplo.com', identidade);
  const servidor = simularServidor((chamada) => {
    const resposta = especial?.(chamada);
    if (resposta) return resposta;
    if (url(chamada).pathname === '/admin/uso') return json(RELATORIO);
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  const roteador = createMemoryRouter(rotas, { initialEntries: [endereco] });
  render(<RouterProvider router={roteador} />);
  return { servidor, roteador, caminho: () => roteador.state.location.pathname };
}

const esperar = <T,>(buscar: () => T | null | undefined) =>
  waitFor(() => {
    const achado = buscar();
    if (!achado) throw new Error('ainda não apareceu');
    return achado;
  });
const areasDoMenu = () => [...document.querySelectorAll('[data-area]')].map((area) => area.getAttribute('data-area'));
const preencher = (form: Element, campo: string, valor: string) => fireEvent.change(form.querySelector(`input[name="${campo}"]`)!, { target: { value: valor } });
const apoioDo = (form: Element, campo: string) => {
  const id = form.querySelector(`input[name="${campo}"]`)?.getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? '') : '';
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Ver o uso da API', () => {
  it('@spec:AC-365 o ADMIN vê Uso depois de Usuários; o investidor não vê e o endereço o leva ao Painel', async () => {
    abrir('/admin/uso');
    await esperar(() => document.querySelector('[data-total-requisicoes]'));
    expect(areasDoMenu()).toEqual(['/admin/usuarios', '/admin/uso', '/corretoras', '/acoes']);
    cleanup();
    vi.unstubAllGlobals();

    const investidor = abrir('/admin/uso', INVESTIDOR);
    await waitFor(() => expect(investidor.caminho()).toBe('/painel'));
    await waitFor(() => expect(areasDoMenu().length).toBeGreaterThan(0));
    expect(areasDoMenu()).not.toContain('/admin/uso');
    expect(investidor.servidor.chamadas.filter((chamada) => url(chamada).pathname.startsWith('/admin'))).toEqual([]);
  });

  it('@spec:AC-366 sem período, a leitura sai sem datas e a tela fala dos últimos 7 dias', async () => {
    const { servidor } = abrir('/admin/uso');

    const total = await esperar(() => document.querySelector('[data-total-requisicoes]'));
    expect(parametros(doUso(servidor.chamadas)[0])).toEqual({});
    expect(total.textContent).toContain('1.234');
    expect(document.body.textContent).toContain('Últimos 7 dias');
  });

  it('@spec:AC-367 o período vai ao servidor e ao endereço; data final antes da inicial não sai; AUT-018 vai ao campo', async () => {
    const { servidor, roteador } = abrir('/admin/uso');
    const form = await esperar(() => document.querySelector('form[data-periodo-uso]'));

    preencher(form, 'dataInicio', '2026-11-01');
    preencher(form, 'dataFim', '2026-11-15');
    fireEvent.submit(form);
    await waitFor(() => expect(parametros(doUso(servidor.chamadas).at(-1)!)).toEqual({ dataInicio: '2026-11-01', dataFim: '2026-11-15' }));
    expect(roteador.state.location.search).toContain('dataInicio=2026-11-01');

    const antes = doUso(servidor.chamadas).length;
    const depois = await esperar(() => document.querySelector('form[data-periodo-uso]'));
    preencher(depois, 'dataInicio', '2026-11-15');
    preencher(depois, 'dataFim', '2026-11-01');
    fireEvent.submit(depois);
    await waitFor(() => expect(apoioDo(depois, 'dataFim')).toContain('não pode ser anterior à data inicial'));
    expect(doUso(servidor.chamadas)).toHaveLength(antes);
    cleanup();
    vi.unstubAllGlobals();

    abrir('/admin/uso?dataInicio=2026-11-15&dataFim=2026-11-01', ADMIN, (chamada) => (url(chamada).pathname === '/admin/uso' ? erroPadrao('AUT-018', 422) : undefined));
    const recusado = await esperar(() => document.querySelector('form[data-periodo-uso]'));
    await waitFor(() => expect(apoioDo(recusado, 'dataFim')).toContain('não pode ser anterior à data inicial'));
  });

  it('@spec:AC-368 cada pico tem a hora, uma barra proporcional à maior e o valor escrito', async () => {
    abrir('/admin/uso');

    const picos = await esperar(() => (document.querySelectorAll('[data-pico]').length === 2 ? [...document.querySelectorAll('[data-pico]')] : null));
    expect(picos[0].textContent).toContain('20/11 às 14h');
    expect(picos[0].textContent).toContain('200');
    expect(picos[1].textContent).toContain('21/11 às 09h');
    expect((picos[0].querySelector('[data-barra]') as HTMLElement).style.width).toBe('100%');
    expect((picos[1].querySelector('[data-barra]') as HTMLElement).style.width).toBe('25%');
  });

  it('@spec:AC-369 quem mais chamou aparece com e-mail e requisições, na ordem do servidor', async () => {
    abrir('/admin/uso');

    const linhas = await esperar(() => (document.querySelectorAll('[data-usuario-uso]').length === 2 ? [...document.querySelectorAll('[data-usuario-uso]')] : null));
    expect(linhas[0].textContent).toContain('lucas@exemplo.com');
    expect(linhas[0].textContent).toContain('900');
    expect(linhas[1].textContent).toContain('ana@exemplo.com');
  });

  it('@spec:AC-370 período sem uso mostra estado vazio, sem gráfico nem lista', async () => {
    abrir('/admin/uso', ADMIN, (chamada) => (url(chamada).pathname === '/admin/uso' ? json({ total: 0, picos: [], usuarios: [] }) : undefined));

    const vazio = await esperar(() => document.querySelector('[data-uso-vazio]'));
    expect(vazio.textContent).toContain('Nenhuma requisição');
    expect(document.querySelector('[data-pico]')).toBeNull();
    expect(document.querySelector('[data-usuario-uso]')).toBeNull();
  });
});
