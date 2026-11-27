import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas', fotoUrl: null };
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const CARTEIRAS = [{ id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true }];
const DATA = '2026-11-20T10:00:00';

// O recorte em duas páginas de 200: uma compra e uma venda em real, e uma venda em dólar a taxa 5.
const PAGINA_1 = [
  { id: 1, carteiraId: 9, ticker: 'PETR4', tipo: 'COMPRA', quantidade: 10, precoUnitario: 100, valorTotal: 1000, dataHora: DATA, moeda: 'BRL', taxaCambioNaOperacao: 1 },
  { id: 2, carteiraId: 9, ticker: 'PETR4', tipo: 'VENDA', quantidade: 5, precoUnitario: 120, valorTotal: 600, dataHora: DATA, moeda: 'BRL', taxaCambioNaOperacao: 1, lucroRealizado: 100 },
];
const PAGINA_2 = [
  { id: 3, carteiraId: 9, ticker: 'AAPL', tipo: 'VENDA', quantidade: 5, precoUnitario: 100, valorTotal: 500, dataHora: DATA, moeda: 'USD', taxaCambioNaOperacao: 5, lucroRealizado: -20 },
];

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const parametros = (chamada: Chamada) => Object.fromEntries(url(chamada).searchParams);
const doExtrato = (chamadas: Chamada[]) => chamadas.filter((chamada) => url(chamada).pathname === '/operacoes');

function abrir(endereco: string, identidade: Identidade = INVESTIDOR, especial?: (chamada: Chamada) => Response | undefined) {
  sessao.iniciar({ token: 't', tipo: 'Bearer', expiraEm: new Date(Date.now() + 36e5).toISOString() }, 'lucas@exemplo.com', identidade);
  const servidor = simularServidor((chamada) => {
    const resposta = especial?.(chamada);
    if (resposta) return resposta;
    const rota = url(chamada).pathname;
    if (rota === '/carteiras') return json({ content: CARTEIRAS, totalElements: 1, totalPages: 1, number: 0, size: 20 });
    if (rota === '/operacoes') {
      const { size = '20', page = '0' } = parametros(chamada);
      if (size === '200') return json({ content: page === '0' ? PAGINA_1 : PAGINA_2, totalElements: 3, totalPages: 2, number: Number(page), size: 200 });
      return json({ content: [...PAGINA_1, ...PAGINA_2], totalElements: 3, totalPages: 1, number: 0, size: 20 });
    }
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
  const roteador = createMemoryRouter(rotas, { initialEntries: [endereco] });
  render(<RouterProvider router={roteador} />);
  return { servidor, roteador };
}

const esperar = <T,>(buscar: () => T | null | undefined) =>
  waitFor(() => {
    const achado = buscar();
    if (!achado) throw new Error('ainda não apareceu');
    return achado;
  });
const filtros = () => esperar(() => document.querySelector('[data-filtros-extrato]') as HTMLFormElement | null);
const preencher = (form: Element, campo: string, valor: string) => fireEvent.change(form.querySelector(`[name="${campo}"]`)!, { target: { value: valor } });
const apoioDo = (form: Element, campo: string) => {
  const id = form.querySelector(`[name="${campo}"]`)?.getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? '') : '';
};
const total = (nome: string) => document.querySelector(`[data-total-recorte="${nome}"]`)?.textContent?.replace(/\s+/g, ' ') ?? '';
const areasDoMenu = () => [...document.querySelectorAll('[data-area]')].map((area) => area.getAttribute('data-area'));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Relatórios do investidor', () => {
  it('@spec:AC-394 o investidor vê Relatórios no menu; o ADMIN não, e o endereço o leva aos usuários', async () => {
    abrir('/relatorios');
    await filtros();
    expect(areasDoMenu()).toContain('/relatorios');
    cleanup();
    vi.unstubAllGlobals();

    const { servidor, roteador } = abrir('/relatorios', ADMIN);
    await waitFor(() => expect(roteador.state.location.pathname).toBe('/admin/usuarios'));
    await waitFor(() => expect(areasDoMenu().length).toBeGreaterThan(0));
    expect(areasDoMenu()).not.toContain('/relatorios');
    expect(doExtrato(servidor.chamadas)).toEqual([]);
  });

  it('@spec:AC-395 os filtros vão ao servidor, se combinam, moram no endereço e o resultado explica que só vendas entram', async () => {
    const { servidor, roteador } = abrir('/relatorios');
    const form = await filtros();
    await waitFor(() => expect(form.querySelector('select[name="carteiraId"] option[value="9"]')).not.toBeNull());

    preencher(form, 'dataInicio', '2026-11-01');
    preencher(form, 'dataFim', '2026-11-30');
    preencher(form, 'ticker', 'petr4');
    preencher(form, 'carteiraId', '9');
    preencher(form, 'tipoOperacao', 'VENDA');
    preencher(form, 'resultado', 'LUCRO');
    fireEvent.submit(form);

    await waitFor(() =>
      expect(parametros(doExtrato(servidor.chamadas).filter((c) => parametros(c).size === '20').at(-1)!)).toEqual({
        page: '0', size: '20', dataInicio: '2026-11-01', dataFim: '2026-11-30', ticker: 'PETR4', carteiraId: '9', tipo: 'VENDA', resultado: 'LUCRO',
      }),
    );
    expect(roteador.state.location.search).toContain('resultado=LUCRO');
    expect(apoioDo(await filtros(), 'resultado')).toMatch(/lucro realizado.*só vendas/i);
  });

  it('@spec:AC-396 data final antes da inicial não sai; OPE-006 do servidor diz o mesmo no campo', async () => {
    const { servidor } = abrir('/relatorios');
    const form = await filtros();
    await waitFor(() => expect(doExtrato(servidor.chamadas).length).toBeGreaterThan(0));
    const antes = doExtrato(servidor.chamadas).length;

    preencher(form, 'dataInicio', '2026-11-30');
    preencher(form, 'dataFim', '2026-11-01');
    fireEvent.submit(form);
    await waitFor(() => expect(apoioDo(form, 'dataFim')).toContain('não pode ser anterior à data inicial'));
    expect(doExtrato(servidor.chamadas)).toHaveLength(antes);
    cleanup();
    vi.unstubAllGlobals();

    abrir('/relatorios?dataFim=2026-11-02', INVESTIDOR, (chamada) => (url(chamada).pathname === '/operacoes' ? erroPadrao('OPE-006', 422) : undefined));
    const recusado = await filtros();
    await waitFor(() => expect(apoioDo(recusado, 'dataFim')).toContain('não pode ser anterior à data inicial'));
  });

  it('@spec:AC-397 os totais somam todas as páginas do recorte, em real', async () => {
    const { servidor } = abrir('/relatorios?carteiraId=9');

    await waitFor(() => expect(total('compras')).toContain('1 compra'));
    const leiturasDeTotais = doExtrato(servidor.chamadas).filter((c) => parametros(c).size === '200');
    expect(leiturasDeTotais.map((c) => parametros(c).page)).toEqual(['0', '1']);
    expect(leiturasDeTotais.every((c) => parametros(c).carteiraId === '9')).toBe(true);
    expect(total('compras')).toContain('R$ 1.000,00');
    expect(total('vendas')).toContain('2 vendas');
    expect(total('lucro')).toContain('R$ 100,00');
  });

  it('@spec:AC-398 a venda em dólar entra convertida pela taxa dela', async () => {
    abrir('/relatorios');

    // 600 em real + 500 dólares a taxa 5 = R$ 3.100,00; prejuízo de 20 dólares a taxa 5 = R$ 100,00.
    await waitFor(() => expect(total('vendas')).toContain('R$ 3.100,00'));
    expect(total('prejuizo')).toContain('R$ 100,00');
    expect(document.querySelector('[data-totais-recorte]')!.textContent).not.toContain('US$');
  });

  it('@spec:AC-399 a tabela do recorte não oferece editar nem excluir; sem operações, estado vazio com Limpar filtros', async () => {
    abrir('/relatorios');
    await esperar(() => document.querySelector('[data-operacao="1"]'));
    expect(document.querySelector('[data-editar]')).toBeNull();
    expect(document.querySelector('[data-excluir]')).toBeNull();
    cleanup();
    vi.unstubAllGlobals();

    const { roteador } = abrir('/relatorios?ticker=XXXX3', INVESTIDOR, (chamada) =>
      url(chamada).pathname === '/operacoes' ? json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }) : undefined,
    );
    const vazio = await esperar(() => document.querySelector('[data-extrato-vazio-recorte]'));
    fireEvent.click([...vazio.querySelectorAll('button')].find((b) => b.textContent?.includes('Limpar filtros'))!);
    await waitFor(() => expect(roteador.state.location.search).toBe(''));
  });

  it('@spec:AC-400 Operações não tem barra de filtros e leva aos Relatórios', async () => {
    abrir('/operacoes');
    await esperar(() => document.querySelector('[data-extrato]'));

    expect(document.querySelector('[data-filtros-extrato]')).toBeNull();
    expect(document.querySelector('[data-extrato] a[href="/relatorios"]')).not.toBeNull();
  });
});
