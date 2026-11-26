import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, json, simularServidor } from '@/test/servidor';

const EMAIL = 'admin@exemplo.com';
const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas Mendes', fotoUrl: null };

const USUARIOS = [
  { id: 1, email: 'lucas@exemplo.com', nome: 'Lucas Mendes', papel: 'INVESTIDOR', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 2, temPosicaoAberta: true },
  { id: 2, email: EMAIL, nome: null, papel: 'ADMIN', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 0, temPosicaoAberta: false },
  { id: 3, email: 'ana@exemplo.com', nome: 'Ana Souza', papel: 'INVESTIDOR', situacao: 'BLOQUEADO', motivoBloqueio: 'Uso indevido', carteirasAtivas: 1, temPosicaoAberta: false },
];

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const parametros = (chamada: Chamada) => Object.fromEntries(url(chamada).searchParams);

function responder(chamada: Chamada, eu: Identidade = ADMIN): Response {
  const rota = url(chamada).pathname;
  if (rota === '/auth/login') return json(TOKEN());
  if (rota === '/auth/me') return json({ ...eu, email: EMAIL });
  if (rota === '/admin/usuarios/totais') return json(url(chamada).searchParams.get('papel') === 'ADMIN' ? { ATIVO: 1, BLOQUEADO: 0 } : { ATIVO: 2, BLOQUEADO: 1 });
  if (rota === '/admin/usuarios') {
    const numero = Number(url(chamada).searchParams.get('page'));
    return json({ content: USUARIOS, totalElements: 45, totalPages: 3, number: numero, size: 20 });
  }
  return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
}

function abrir(endereco: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [endereco] });
  render(<RouterProvider router={roteador} />);
  return { roteador, caminho: () => roteador.state.location.pathname };
}

const conectar = (identidade: Identidade) => sessao.iniciar(TOKEN(), EMAIL, identidade);
const areasDoMenu = () => [...document.querySelectorAll('[data-area]')].map((area) => area.getAttribute('data-area'));
const leituras = (chamadas: Chamada[], rota: string) => chamadas.filter((chamada) => url(chamada).pathname === rota);
const linha = (id: number) => document.querySelector(`[data-usuario="${id}"]`) as HTMLElement | null;
const escolher = (nome: string, valor: string) => fireEvent.change(document.querySelector(`select[name="${nome}"]`)!, { target: { value: valor } });

async function abrirUsuarios(endereco = '/admin/usuarios') {
  conectar(ADMIN);
  const servidor = simularServidor((chamada) => responder(chamada));
  const tela = abrir(endereco);
  await waitFor(() => expect(linha(1)).not.toBeNull());
  return { ...tela, servidor };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('O ADMIN começa pelos usuários', () => {
  it('@spec:AC-348 o ADMIN entra por Usuários e o menu oferece Usuários, Uso, Corretoras e Ações', async () => {
    simularServidor((chamada) => responder(chamada));
    const tela = abrir('/entrar');
    const form = await waitFor(() => {
      const encontrado = document.querySelector('form');
      if (!encontrado?.querySelector('input[name="senha"]')) throw new Error('sem login');
      return encontrado;
    });
    fireEvent.change(form.querySelector('input[name="email"]')!, { target: { value: EMAIL } });
    fireEvent.change(form.querySelector('input[name="senha"]')!, { target: { value: 'segura123' } });
    fireEvent.submit(form);

    await waitFor(() => expect(tela.caminho()).toBe('/admin/usuarios'));
    await waitFor(() => expect(areasDoMenu()).toEqual(['/admin/usuarios', '/admin/uso', '/corretoras', '/acoes']));
    cleanup();

    const inicio = abrir('/');
    await waitFor(() => expect(inicio.caminho()).toBe('/admin/usuarios'));
  });

  it('@spec:AC-349 rota de investidor aberta pelo ADMIN leva aos usuários sem requisitar a área', async () => {
    for (const area of ['/painel', '/carteiras', '/operacoes', '/desempenho']) {
      conectar(ADMIN);
      const servidor = simularServidor((chamada) => responder(chamada));
      const { caminho } = abrir(area);

      await waitFor(() => expect(caminho()).toBe('/admin/usuarios'));
      const daArea = servidor.chamadas.filter((chamada) => /^\/(carteiras|operacoes|mercado|painel)/.test(url(chamada).pathname));
      expect(daArea, `${area} requisitou ${daArea.map((c) => c.url)}`).toEqual([]);
      cleanup();
      vi.unstubAllGlobals();
    }
  });

  it('@spec:AC-350 o investidor não vê Usuários e o endereço o leva ao Painel sem requisitar /admin', async () => {
    conectar(INVESTIDOR);
    const servidor = simularServidor((chamada) => responder(chamada, INVESTIDOR));
    const { caminho } = abrir('/admin/usuarios');

    await waitFor(() => expect(caminho()).toBe('/painel'));
    await waitFor(() => expect(areasDoMenu().length).toBeGreaterThan(0));
    expect(areasDoMenu()).not.toContain('/admin/usuarios');
    expect(servidor.chamadas.filter((chamada) => url(chamada).pathname.startsWith('/admin'))).toEqual([]);
  });
});

describe('Ver os usuários', () => {
  it('@spec:AC-351 cada linha mostra e-mail, nome, papel, situação, carteiras ativas e posição aberta', async () => {
    const { servidor } = await abrirUsuarios();

    expect(parametros(leituras(servidor.chamadas, '/admin/usuarios')[0])).toEqual({ page: '0', size: '20' });
    const lucas = linha(1)!.textContent!;
    expect(lucas).toContain('lucas@exemplo.com');
    expect(lucas).toContain('Lucas Mendes');
    expect(lucas).toContain('Investidor');
    expect(lucas).toContain('Ativo');
    expect(linha(1)!.querySelector('[data-carteiras-ativas]')!.textContent).toBe('2');
    expect(linha(1)!.querySelector('[data-posicao-aberta]')!.textContent).toBe('Sim');
    expect(linha(2)!.textContent).toContain('Sem nome');
    expect(linha(2)!.textContent).toContain('Administrador');
    expect(linha(3)!.textContent).toContain('Bloqueado');
  });

  it('@spec:AC-352 situação e papel vão ao servidor, moram no endereço e não oferecem excluído', async () => {
    const { servidor, roteador } = await abrirUsuarios();
    const opcoesDeSituacao = [...document.querySelectorAll('select[name="situacao"] option')].map((opcao) => opcao.getAttribute('value'));
    expect(opcoesDeSituacao).toEqual(['', 'ATIVO', 'BLOQUEADO']);

    escolher('situacao', 'BLOQUEADO');
    await waitFor(() => expect(parametros(leituras(servidor.chamadas, '/admin/usuarios').at(-1)!)).toEqual({ page: '0', size: '20', situacao: 'BLOQUEADO' }));
    escolher('papel', 'INVESTIDOR');
    await waitFor(() =>
      expect(parametros(leituras(servidor.chamadas, '/admin/usuarios').at(-1)!)).toEqual({ page: '0', size: '20', situacao: 'BLOQUEADO', papel: 'INVESTIDOR' }),
    );
    expect(new URLSearchParams(roteador.state.location.search).get('situacao')).toBe('BLOQUEADO');
    cleanup();
    vi.unstubAllGlobals();

    const recarregado = await abrirUsuarios('/admin/usuarios?situacao=ATIVO&papel=ADMIN');
    expect(parametros(leituras(recarregado.servidor.chamadas, '/admin/usuarios')[0])).toEqual({ page: '0', size: '20', situacao: 'ATIVO', papel: 'ADMIN' });
    expect((document.querySelector('select[name="papel"]') as HTMLSelectElement).value).toBe('ADMIN');
  });

  it('@spec:AC-353 os totais acompanham o papel', async () => {
    const { servidor } = await abrirUsuarios();
    await waitFor(() => expect(document.querySelector('[data-total="ATIVO"]')?.textContent).toContain('2'));
    expect(document.querySelector('[data-total="BLOQUEADO"]')?.textContent).toContain('1');
    expect(parametros(leituras(servidor.chamadas, '/admin/usuarios/totais')[0])).toEqual({});

    escolher('papel', 'ADMIN');
    await waitFor(() => expect(parametros(leituras(servidor.chamadas, '/admin/usuarios/totais').at(-1)!)).toEqual({ papel: 'ADMIN' }));
    await waitFor(() => expect(document.querySelector('[data-total="ATIVO"]')?.textContent).toContain('1'));
    expect(document.querySelector('[data-total="BLOQUEADO"]')?.textContent).toContain('0');
  });

  it('@spec:AC-354 a próxima página leva os filtros', async () => {
    const { servidor } = await abrirUsuarios('/admin/usuarios?papel=INVESTIDOR');

    fireEvent.click(await waitFor(() => document.querySelector('[data-proxima]')!));

    await waitFor(() => expect(parametros(leituras(servidor.chamadas, '/admin/usuarios').at(-1)!)).toEqual({ page: '1', size: '20', papel: 'INVESTIDOR' }));
  });
});
