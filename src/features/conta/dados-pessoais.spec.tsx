import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, json, simularServidor } from '@/test/servidor';

const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas Mendes', fotoUrl: null };
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const EU = { id: 7, nome: 'Lucas Mendes', email: 'lucas@exemplo.com' };

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;

function abrir(identidade: Identidade = INVESTIDOR) {
  sessao.iniciar({ token: 't', tipo: 'Bearer', expiraEm: new Date(Date.now() + 36e5).toISOString() }, EU.email, identidade);
  const servidor = simularServidor((chamada) => {
    const rota = caminho(chamada);
    if (rota === '/investidores' && chamada.metodo === 'GET') return json({ content: [EU], totalElements: 1, totalPages: 1, number: 0, size: 20 });
    if (rota === '/investidores/7' && chamada.metodo === 'DELETE') return json(undefined, 204);
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  const roteador = createMemoryRouter(rotas, { initialEntries: ['/conta'] });
  render(<RouterProvider router={roteador} />);
  return { servidor, roteador };
}

const esperar = <T,>(buscar: () => T | null | undefined) =>
  waitFor(() => {
    const achado = buscar();
    if (!achado) throw new Error('ainda não apareceu');
    return achado;
  });
const secao = (nome: string) => document.querySelector(`[data-secao-conta="${nome}"]`) as HTMLElement | null;
const botao = (onde: ParentNode, texto: string) => [...onde.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto);
const dialogo = () => document.querySelector('[role="alertdialog"]') as HTMLElement | null;
const exclusoes = (chamadas: Chamada[]) => chamadas.filter((chamada) => chamada.metodo === 'DELETE');

async function abrirExclusao() {
  const tela = abrir();
  // Sem os dados não há id para excluir: o botão só habilita quando eles chegam.
  const excluir = await esperar(() => {
    const encontrado = secao('excluir') && botao(secao('excluir')!, 'Excluir minha conta');
    return encontrado && !encontrado.disabled ? encontrado : null;
  });
  fireEvent.click(excluir);
  await esperar(dialogo);
  return tela;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Dados pessoais e exclusão da conta', () => {
  it('@spec:AC-383 o investidor vê nome e e-mail de GET /investidores', async () => {
    abrir();

    const dados = await esperar(() => (secao('dados')?.textContent?.includes('Lucas Mendes') ? secao('dados') : null));
    expect(dados.textContent).toContain('lucas@exemplo.com');
  });

  it('@spec:AC-384 o administrador não vê dados pessoais nem excluir, e não requisita /investidores', async () => {
    const { servidor } = abrir(ADMIN);

    await esperar(() => secao('senha'));
    expect(secao('dados')).toBeNull();
    expect(secao('excluir')).toBeNull();
    expect(servidor.chamadas.filter((chamada) => caminho(chamada).startsWith('/investidores'))).toEqual([]);
  });

  it('@spec:AC-385 excluir pede confirmação, e cancelar não exclui', async () => {
    const { servidor } = await abrirExclusao();

    expect(dialogo()!.textContent).toMatch(/desativada/i);
    expect(dialogo()!.textContent).toMatch(/e-mail/i);
    fireEvent.click(dialogo()!.querySelector('[data-cancelar]')!);

    await waitFor(() => expect(dialogo()).toBeNull());
    expect(exclusoes(servidor.chamadas)).toHaveLength(0);
    expect(sessao.ativa()).toBe(true);
  });

  it('@spec:AC-386 confirmar exclui pelo id, encerra a sessão e o login explica', async () => {
    const { servidor, roteador } = await abrirExclusao();

    fireEvent.click(dialogo()!.querySelector('[data-confirmar]')!);

    await waitFor(() => expect(roteador.state.location.pathname).toBe('/entrar'));
    expect(exclusoes(servidor.chamadas).map(caminho)).toEqual(['/investidores/7']);
    expect(sessao.ativa()).toBe(false);
    await waitFor(() => expect(document.body.textContent).toContain('Sua conta foi excluída'));
  });
});
