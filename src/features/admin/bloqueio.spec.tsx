import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const EMAIL = 'admin@exemplo.com';
const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });

const LUCAS = { id: 1, email: 'lucas@exemplo.com', nome: 'Lucas Mendes', papel: 'INVESTIDOR', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 2, temPosicaoAberta: true };
const EU = { id: 2, email: EMAIL, nome: null, papel: 'ADMIN', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 0, temPosicaoAberta: false };
const ANA = { id: 3, email: 'ana@exemplo.com', nome: 'Ana Souza', papel: 'INVESTIDOR', situacao: 'BLOQUEADO', motivoBloqueio: 'Uso indevido da API', carteirasAtivas: 1, temPosicaoAberta: false };

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const de = (chamadas: Chamada[], rota: string, metodo = 'GET') => chamadas.filter((chamada) => url(chamada).pathname === rota && chamada.metodo === metodo);

function abrirComServidor(especial?: (chamada: Chamada) => Response | undefined) {
  sessao.iniciar(TOKEN(), EMAIL, { papel: 'ADMIN', nome: null, fotoUrl: null });
  const servidor = simularServidor((chamada) => {
    const resposta = especial?.(chamada);
    if (resposta) return resposta;
    const rota = url(chamada).pathname;
    if (rota === '/admin/usuarios/totais') return json({ ATIVO: 2, BLOQUEADO: 1 });
    if (rota === '/admin/usuarios') return json({ content: [LUCAS, EU, ANA], totalElements: 3, totalPages: 1, number: 0, size: 20 });
    if (chamada.metodo === 'PATCH') return json(LUCAS);
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: ['/admin/usuarios'] })} />);
  return servidor;
}

const linha = (id: number) => document.querySelector(`[data-usuario="${id}"]`) as HTMLElement | null;
const botaoDaLinha = (id: number, texto: string) => [...(linha(id)?.querySelectorAll('button') ?? [])].find((botao) => botao.textContent?.trim() === texto);
const dialogo = () => document.querySelector('[role="alertdialog"]') as HTMLElement | null;
const motivo = () => dialogo()!.querySelector('input[name="motivo"]') as HTMLInputElement;
const confirmar = () => fireEvent.click(dialogo()!.querySelector('[data-confirmar]')!);

async function abrirBloqueioDoLucas(especial?: (chamada: Chamada) => Response | undefined) {
  const servidor = abrirComServidor(especial);
  await waitFor(() => expect(botaoDaLinha(1, 'Bloquear')).toBeDefined());
  fireEvent.click(botaoDaLinha(1, 'Bloquear')!);
  await waitFor(() => expect(dialogo()).not.toBeNull());
  return servidor;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Bloquear e desbloquear', () => {
  it('@spec:AC-355 bloquear manda o motivo e relê a lista e os totais', async () => {
    const servidor = await abrirBloqueioDoLucas();
    const listasAntes = de(servidor.chamadas, '/admin/usuarios').length;
    const totaisAntes = de(servidor.chamadas, '/admin/usuarios/totais').length;

    fireEvent.change(motivo(), { target: { value: '  Uso indevido  ' } });
    confirmar();

    await waitFor(() => expect(de(servidor.chamadas, '/admin/usuarios/1/bloquear', 'PATCH')).toHaveLength(1));
    expect(de(servidor.chamadas, '/admin/usuarios/1/bloquear', 'PATCH')[0].corpo).toEqual({ motivo: 'Uso indevido' });
    await waitFor(() => expect(dialogo()).toBeNull());
    await waitFor(() => expect(de(servidor.chamadas, '/admin/usuarios').length).toBeGreaterThan(listasAntes));
    expect(de(servidor.chamadas, '/admin/usuarios/totais').length).toBeGreaterThan(totaisAntes);
  });

  it('@spec:AC-356 sem motivo o bloqueio não sai e o diálogo continua aberto', async () => {
    const servidor = await abrirBloqueioDoLucas();

    fireEvent.change(motivo(), { target: { value: '   ' } });
    confirmar();

    await waitFor(() => expect(dialogo()!.textContent).toContain('Informe o motivo'));
    expect(dialogo()).not.toBeNull();
    expect(servidor.chamadas.filter((chamada) => chamada.metodo === 'PATCH')).toHaveLength(0);
  });

  it('@spec:AC-357 a própria linha não oferece bloquear; AUT-011 do servidor aparece no diálogo', async () => {
    await abrirBloqueioDoLucas((chamada) => (chamada.metodo === 'PATCH' ? erroPadrao('AUT-011', 422) : undefined));
    expect(botaoDaLinha(2, 'Bloquear')).toBeUndefined();

    fireEvent.change(motivo(), { target: { value: 'Teste' } });
    confirmar();

    await waitFor(() => expect(dialogo()!.textContent).toContain('não pode bloquear a sua própria conta'));
  });

  it('@spec:AC-358 desbloquear manda o PATCH e relê a lista e os totais', async () => {
    const servidor = abrirComServidor();
    await waitFor(() => expect(botaoDaLinha(3, 'Desbloquear')).toBeDefined());
    const listasAntes = de(servidor.chamadas, '/admin/usuarios').length;
    expect(botaoDaLinha(3, 'Bloquear')).toBeUndefined();

    fireEvent.click(botaoDaLinha(3, 'Desbloquear')!);

    await waitFor(() => expect(de(servidor.chamadas, '/admin/usuarios/3/desbloquear', 'PATCH')).toHaveLength(1));
    await waitFor(() => expect(de(servidor.chamadas, '/admin/usuarios').length).toBeGreaterThan(listasAntes));
  });

  it('@spec:AC-359 a linha bloqueada mostra o motivo', async () => {
    abrirComServidor();

    await waitFor(() => expect(linha(3)?.querySelector('[data-motivo-bloqueio]')?.textContent).toContain('Uso indevido da API'));
    expect(linha(1)?.querySelector('[data-motivo-bloqueio]')).toBeNull();
  });
});
