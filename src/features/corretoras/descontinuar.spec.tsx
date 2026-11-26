import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas', fotoUrl: null };

const XP = {
  id: 1, cnpj: '02332886000104', razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.', nomeFantasia: 'XP Investimentos', email: null, telefone: null, cep: null,
  logradouro: null, numero: null, complemento: null, bairro: null, cidade: 'São Paulo', uf: 'SP', situacaoCadastral: 'ATIVA', validadaNaCvm: true,
  dataBaseCvm: '2026-09-08', dataCadastro: '2026-09-09T10:00:00', descontinuada: false,
};
const ANTIGA = { ...XP, id: 2, cnpj: '11111111000191', nomeFantasia: 'Corretora Antiga', descontinuada: true };

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const de = (chamadas: Chamada[], rota: string, metodo = 'GET') => chamadas.filter((chamada) => url(chamada).pathname === rota && chamada.metodo === metodo);

function abrir(endereco: string, identidade: Identidade = ADMIN, especial?: (chamada: Chamada) => Response | undefined) {
  sessao.iniciar(TOKEN(), 'admin@exemplo.com', identidade);
  let xpDescontinuada = false;
  const servidor = simularServidor((chamada) => {
    const resposta = especial?.(chamada);
    if (resposta) return resposta;
    const rota = url(chamada).pathname;
    if (rota === '/corretoras/1/carteiras-afetadas') return json({ carteirasAtivas: 3 });
    if (rota === '/corretoras/1/descontinuar') {
      xpDescontinuada = true;
      return json({ ...XP, descontinuada: true });
    }
    if (rota === '/corretoras/1') return json({ ...XP, descontinuada: xpDescontinuada });
    if (rota === '/corretoras/2') return json(ANTIGA);
    if (rota === '/corretoras') return json({ content: [XP, ANTIGA], totalElements: 2, totalPages: 1, number: 0, size: 200 });
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  const roteador = createMemoryRouter(rotas, { initialEntries: [endereco] });
  render(<RouterProvider router={roteador} />);
  return servidor;
}

const esperar = <T,>(buscar: () => T | null | undefined) =>
  waitFor(() => {
    const achado = buscar();
    if (!achado) throw new Error('ainda não apareceu');
    return achado;
  });
const botao = (texto: string) => [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === texto);
const dialogo = () => document.querySelector('[role="alertdialog"]') as HTMLElement | null;

async function abrirDescontinuacao() {
  const servidor = abrir('/corretoras/1');
  fireEvent.click(await esperar(() => botao('Descontinuar')));
  await esperar(dialogo);
  return servidor;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Descontinuar corretora', () => {
  it('@spec:AC-371 só o ADMIN vê Descontinuar, e só em corretora ativa', async () => {
    abrir('/corretoras/1');
    await esperar(() => botao('Descontinuar'));
    cleanup();
    vi.unstubAllGlobals();

    abrir('/corretoras/2');
    await esperar(() => document.querySelector('h1'));
    expect(botao('Descontinuar')).toBeUndefined();
    cleanup();
    vi.unstubAllGlobals();

    abrir('/corretoras/1', INVESTIDOR);
    await esperar(() => document.querySelector('h1'));
    expect(botao('Descontinuar')).toBeUndefined();
  });

  it('@spec:AC-372 o diálogo diz quantas carteiras ativas são afetadas', async () => {
    const servidor = await abrirDescontinuacao();

    expect(de(servidor.chamadas, '/corretoras/1/carteiras-afetadas')).toHaveLength(1);
    await waitFor(() => expect(dialogo()!.textContent).toContain('3 carteiras ativas'));
    expect(de(servidor.chamadas, '/corretoras/1/descontinuar', 'PATCH')).toHaveLength(0);
  });

  it('@spec:AC-373 com motivo, descontinua e marca o detalhe; sem motivo, nada sai', async () => {
    const servidor = await abrirDescontinuacao();
    const motivo = () => dialogo()!.querySelector('input[name="motivo"]') as HTMLInputElement;

    fireEvent.click(dialogo()!.querySelector('[data-confirmar]')!);
    await waitFor(() => expect(dialogo()!.textContent).toContain('Informe o motivo'));
    expect(de(servidor.chamadas, '/corretoras/1/descontinuar', 'PATCH')).toHaveLength(0);

    fireEvent.change(motivo(), { target: { value: '  Encerrou as atividades  ' } });
    fireEvent.click(dialogo()!.querySelector('[data-confirmar]')!);

    await waitFor(() => expect(de(servidor.chamadas, '/corretoras/1/descontinuar', 'PATCH')).toHaveLength(1));
    expect(de(servidor.chamadas, '/corretoras/1/descontinuar', 'PATCH')[0].corpo).toEqual({ motivo: 'Encerrou as atividades' });
    await waitFor(() => expect(dialogo()).toBeNull());
    await esperar(() => document.querySelector('[data-descontinuada]'));
    expect(botao('Descontinuar')).toBeUndefined();
  });

  it('@spec:AC-374 a corretora descontinuada aparece marcada na lista e no detalhe', async () => {
    abrir('/corretoras');
    const antiga = await esperar(() => document.querySelector('[data-corretora="2"]'));
    expect(antiga.textContent).toContain('Descontinuada');
    expect(document.querySelector('[data-corretora="1"]')!.textContent).not.toContain('Descontinuada');
    cleanup();
    vi.unstubAllGlobals();

    abrir('/corretoras/2', INVESTIDOR);
    const marca = await esperar(() => document.querySelector('[data-descontinuada]'));
    expect(marca.textContent).toContain('Descontinuada');
  });

  it('@spec:AC-375 criar carteira não oferece a descontinuada; COR-005 do servidor aparece no formulário', async () => {
    abrir('/carteiras/nova', INVESTIDOR, (chamada) => (url(chamada).pathname === '/carteiras' && chamada.metodo === 'POST' ? erroPadrao('COR-005', 422) : undefined));

    const opcao = (await esperar(() => document.querySelector('[data-campo-corretora] option[value="2"], select[data-campo-corretora] option[value="2"]'))) as HTMLOptionElement;
    expect(opcao.disabled).toBe(true);
    expect(opcao.textContent).toContain('(descontinuada)');
    expect((document.querySelector('[data-campo-corretora] option[value="1"], select[data-campo-corretora] option[value="1"]') as HTMLOptionElement).disabled).toBe(false);

    const form = document.querySelector('form')!;
    fireEvent.change(form.querySelector('[data-campo-nome] , input[name="nome"]')!, { target: { value: 'Longo prazo' } });
    fireEvent.change(form.querySelector('select[name="corretoraId"]')!, { target: { value: '1' } });
    fireEvent.change(form.querySelector('select[name="mercado"]')!, { target: { value: 'BR' } });
    fireEvent.submit(form);

    await waitFor(() => expect(document.body.textContent).toContain('foi descontinuada e não aceita carteiras novas'));
  });
});
