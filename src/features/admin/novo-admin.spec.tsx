import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { feedback } from '@/core/feedback/feedback.service';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const NOVO = { id: 9, email: 'novo@exemplo.com', nome: null, papel: 'ADMIN', situacao: 'ATIVO', motivoBloqueio: null, carteirasAtivas: 0, temPosicaoAberta: false };

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const de = (chamadas: Chamada[], rota: string, metodo = 'GET') => chamadas.filter((chamada) => url(chamada).pathname === rota && chamada.metodo === metodo);

function abrir(endereco: string, identidade: Identidade = ADMIN, especial?: (chamada: Chamada) => Response | undefined) {
  sessao.iniciar(TOKEN(), 'admin@exemplo.com', identidade);
  const servidor = simularServidor((chamada) => {
    const resposta = especial?.(chamada);
    if (resposta) return resposta;
    const rota = url(chamada).pathname;
    if (rota === '/admin/usuarios/totais') return json({ ATIVO: 1, BLOQUEADO: 0 });
    if (rota === '/admin/usuarios' && chamada.metodo === 'POST') return json(NOVO, 201);
    if (rota === '/admin/usuarios') return json({ content: [NOVO], totalElements: 1, totalPages: 1, number: 0, size: 20 });
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  const roteador = createMemoryRouter(rotas, { initialEntries: [endereco] });
  render(<RouterProvider router={roteador} />);
  return { servidor, caminho: () => roteador.state.location.pathname };
}

const formulario = () =>
  waitFor(() => {
    const form = document.querySelector('form[data-novo-admin]');
    if (!form) throw new Error('sem formulário');
    return form;
  });
const preencher = (form: Element, campo: string, valor: string) =>
  fireEvent.change(form.querySelector(`input[name="${campo}"]`)!, { target: { value: valor } });
const apoioDo = (form: Element, campo: string) => {
  const id = form.querySelector(`input[name="${campo}"]`)?.getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? '') : '';
};

async function preencherValido() {
  const form = await formulario();
  preencher(form, 'email', 'novo@exemplo.com');
  preencher(form, 'senha', 'segura123');
  preencher(form, 'confirmarSenha', 'segura123');
  return form;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessao.encerrar();
});

describe('Criar outro administrador', () => {
  it('@spec:AC-360 a área de usuários leva ao formulário com e-mail, senha e confirmação', async () => {
    const { caminho } = abrir('/admin/usuarios');
    const link = await waitFor(() => {
      const encontrado = [...document.querySelectorAll('a')].find((a) => a.textContent?.includes('Novo administrador'));
      if (!encontrado) throw new Error('sem link');
      return encontrado;
    });

    fireEvent.click(link);

    await waitFor(() => expect(caminho()).toBe('/admin/usuarios/novo'));
    const form = await formulario();
    expect(['email', 'senha', 'confirmarSenha'].every((campo) => form.querySelector(`input[name="${campo}"]`))).toBe(true);
  });

  it('@spec:AC-361 criar manda só e-mail e senha, volta à lista relida e avisa', async () => {
    const aviso = vi.spyOn(feedback, 'informar');
    const { servidor, caminho } = abrir('/admin/usuarios/novo');
    const form = await preencherValido();

    fireEvent.submit(form);

    await waitFor(() => expect(caminho()).toBe('/admin/usuarios'));
    expect(de(servidor.chamadas, '/admin/usuarios', 'POST')[0].corpo).toEqual({ email: 'novo@exemplo.com', senha: 'segura123' });
    await waitFor(() => expect(de(servidor.chamadas, '/admin/usuarios').length).toBeGreaterThan(0));
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('novo@exemplo.com'));
  });

  it('@spec:AC-362 e-mail, senha ou confirmação inválidos não saem', async () => {
    const { servidor } = abrir('/admin/usuarios/novo');
    const form = await formulario();

    preencher(form, 'email', 'sem-arroba');
    preencher(form, 'senha', 'semnumero');
    preencher(form, 'confirmarSenha', 'outra1234');
    fireEvent.submit(form);

    await waitFor(() => expect(apoioDo(form, 'senha')).toContain('8 caracteres'));
    expect(apoioDo(form, 'email')).toContain('nome@dominio.com');
    expect(apoioDo(form, 'confirmarSenha')).toContain('não coincidem');
    expect(de(servidor.chamadas, '/admin/usuarios', 'POST')).toHaveLength(0);
  });

  it('@spec:AC-363 e-mail em uso aparece no campo e o digitado fica', async () => {
    const { caminho } = abrir('/admin/usuarios/novo', ADMIN, (chamada) => (chamada.metodo === 'POST' ? erroPadrao('AUT-001', 409) : undefined));
    const form = await preencherValido();

    fireEvent.submit(form);

    await waitFor(() => expect(apoioDo(form, 'email')).toContain('já está em uso'));
    expect((form.querySelector('input[name="email"]') as HTMLInputElement).value).toBe('novo@exemplo.com');
    expect(caminho()).toBe('/admin/usuarios/novo');
  });

  it('@spec:AC-364 o investidor que abre o endereço vai ao Painel sem requisitar /admin', async () => {
    const { servidor, caminho } = abrir('/admin/usuarios/novo', { papel: 'INVESTIDOR', nome: 'Lucas', fotoUrl: null });

    await waitFor(() => expect(caminho()).toBe('/painel'));
    expect(servidor.chamadas.filter((chamada) => url(chamada).pathname.startsWith('/admin'))).toEqual([]);
  });
});
