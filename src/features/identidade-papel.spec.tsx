import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { http } from '@/core/api/http';
import { CATALOGO_ERROS, MENSAGEM_GENERICA } from '@/core/erros/catalogo-erros';
import { traduzirErro } from '@/core/erros/tradutor-erro';
import { definirNavegacao } from '@/core/navegacao';
import { Identidade } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const EMAIL = 'lucas@exemplo.com';
const TOKEN = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const INVESTIDOR: Identidade = { papel: 'INVESTIDOR', nome: 'Lucas Mendes', fotoUrl: null };
const ADMIN: Identidade = { papel: 'ADMIN', nome: null, fotoUrl: null };
const pagina = <T,>(content: T[]) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 20 });
const CORRETORA = {
  id: 1, cnpj: '02332886000104', razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.', nomeFantasia: 'XP Investimentos', email: 'contato@xp.com.br', telefone: '1130000000', cep: '04538133',
  logradouro: 'Avenida Brigadeiro Faria Lima', numero: '3600', complemento: '10 andar', bairro: 'Itaim Bibi', cidade: 'São Paulo', uf: 'SP',
  situacaoCadastral: 'ATIVA', validadaNaCvm: true, dataBaseCvm: '2026-09-08', dataCadastro: '2026-09-09T10:00:00',
};
const PETR4 = { id: 12, ticker: 'PETR4', nomeEmpresa: 'Petróleo Brasileiro S.A.', mercado: 'BR', moeda: 'BRL', cotacaoAtual: 38.42, dataHoraCotacao: '2026-09-09T13:55:00' };

function responder({ url }: Chamada, eu: Identidade = INVESTIDOR): Response {
  if (url === '/auth/login') return json(TOKEN());
  if (url === '/auth/me') return json({ ...eu, email: EMAIL });
  if (url.startsWith('/corretoras/cnpj/')) return erroPadrao('COR-001', 404);
  if (url.startsWith('/corretoras/1')) return json(CORRETORA);
  if (url.startsWith('/acoes/ticker/PETR4')) return json(PETR4);
  return json(pagina([]));
}

function conectar(identidade: Identidade) {
  sessao.iniciar(TOKEN(), EMAIL, identidade);
}

function abrir(url: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
  render(<RouterProvider router={roteador} />);
  return { roteador, caminho: () => roteador.state.location.pathname };
}

async function entrarPeloFormulario(url = '/entrar') {
  const tela = abrir(url);
  const form = await waitFor(() => {
    const encontrado = document.querySelector('form');
    if (!encontrado) throw new Error('sem formulário');
    return encontrado;
  });
  fireEvent.change(form.querySelector('input[name="email"]')!, { target: { value: EMAIL } });
  fireEvent.change(form.querySelector('input[name="senha"]')!, { target: { value: 'segura123' } });
  fireEvent.submit(form);
  return tela;
}

const areasDoMenu = () => [...document.querySelectorAll('[data-area]')].map((area) => area.getAttribute('data-area'));
const identidadeNoTopo = () => document.querySelector('[data-identidade-investidor]')?.textContent ?? '';
const casca = () => waitFor(() => expect(document.querySelector('[data-casca]')).not.toBeNull());

afterEach(() => {
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Identidade de quem entrou', () => {
  it('@spec:AC-311 depois do login o topo mostra o nome e o papel vindos de "quem sou eu"', async () => {
    const servidor = simularServidor((chamada) => responder(chamada));
    const { caminho } = await entrarPeloFormulario();

    await casca();
    await waitFor(() => expect(identidadeNoTopo()).toContain('Lucas Mendes'));
    expect(identidadeNoTopo()).toContain('Investidor');
    expect(identidadeNoTopo()).not.toContain(EMAIL);
    expect(servidor.para('/auth/me')[0].cabecalhos.get('Authorization')).toBe('Bearer jwt-abc');
    expect(caminho()).toBe('/painel');
  });

  it('@spec:AC-312 administrador sem nome aparece pelo e-mail, com o papel Administrador', async () => {
    simularServidor((chamada) => responder(chamada, ADMIN));
    await entrarPeloFormulario();

    await casca();
    await waitFor(() => expect(identidadeNoTopo()).toContain(EMAIL));
    expect(identidadeNoTopo()).toContain('Administrador');
  });

  it('@spec:AC-313 se "quem sou eu" falha, a sessão é encerrada e o login continua na tela', async () => {
    simularServidor((chamada) => (chamada.url === '/auth/me' ? json({ message: 'fora do ar' }, 500) : responder(chamada)));
    const { caminho } = await entrarPeloFormulario();

    await waitFor(() => expect(document.querySelector('[data-nivel="erro"]')).not.toBeNull());
    expect(caminho()).toBe('/entrar');
    expect(sessao.ativa()).toBe(false);
    expect(document.querySelector('[data-casca]')).toBeNull();
  });
});

describe('Menu e rotas pelo papel', () => {

  it('@spec:AC-316 o investidor continua com todas as áreas', async () => {
    conectar(INVESTIDOR);
    simularServidor((chamada) => responder(chamada));
    abrir('/painel');

    await casca();
    expect(areasDoMenu()).toEqual(['/painel', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/desempenho']);
  });
});

describe('Corretora pelo papel', () => {
  async function telasDeCorretora(identidade: Identidade) {
    conectar(identidade);
    simularServidor((chamada) => responder(chamada, identidade));

    abrir('/corretoras');
    await waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Corretoras'));
    const temNova = document.querySelector('a[href="/corretoras/nova"]') !== null;
    fireEvent.change(document.querySelector('input[name="termo"]')!, { target: { value: '11.222.333/0001-81' } });
    fireEvent.submit(document.querySelector('form')!);
    const vazio = await waitFor(() => {
      const encontrado = document.querySelector('[data-busca-vazia]');
      if (!encontrado) throw new Error('sem estado vazio');
      return encontrado;
    });
    const temCadastrarBuscado = vazio.querySelector('[data-cadastrar-buscado]') !== null;
    cleanup();

    abrir('/corretoras/1');
    await waitFor(() => expect(document.body.textContent).toContain('XP INVESTIMENTOS'));
    const temRemover = document.querySelector('[data-remover]') !== null;
    cleanup();

    const nova = abrir('/corretoras/nova');
    await casca();
    await waitFor(() => expect(document.querySelector('h1')).not.toBeNull());
    return { temNova, temCadastrarBuscado, temRemover, caminhoDaNova: nova.caminho() };
  }

  it('@spec:AC-317 investidor não vê cadastrar nem remover, e /corretoras/nova volta à lista', async () => {
    const telas = await telasDeCorretora(INVESTIDOR);

    expect(telas).toEqual({ temNova: false, temCadastrarBuscado: false, temRemover: false, caminhoDaNova: '/corretoras' });
  });

  it('@spec:AC-318 administrador cadastra e remove corretora', async () => {
    const telas = await telasDeCorretora(ADMIN);

    expect(telas).toEqual({ temNova: true, temCadastrarBuscado: true, temRemover: true, caminhoDaNova: '/corretoras/nova' });
  });
});

describe('Ação entra pela pesquisa', () => {
  it('@spec:AC-319 incluir pesquisa o ticker no mercado escolhido e abre a ação', async () => {
    conectar(INVESTIDOR);
    const servidor = simularServidor((chamada) => responder(chamada));
    const { caminho } = abrir('/acoes/nova');

    const ticker = await waitFor(() => {
      const campo = document.querySelector('input[name="ticker"]');
      if (!campo) throw new Error('sem campo');
      return campo;
    });
    fireEvent.change(ticker, { target: { value: 'petr4' } });
    fireEvent.change(document.querySelector('select[name="mercado"]')!, { target: { value: 'BR' } });
    fireEvent.submit(ticker.closest('form')!);

    await waitFor(() => expect(caminho()).toBe('/acoes/PETR4'));
    const pesquisa = servidor.para('/acoes/ticker/PETR4')[0];
    expect(pesquisa.metodo).toBe('GET');
    expect(pesquisa.url).toBe('/acoes/ticker/PETR4?mercado=BR');
    expect(servidor.chamadas.filter((c) => c.metodo === 'POST')).toEqual([]);
  });

  it('@spec:AC-320 o formulário abre sem consultar carteiras', async () => {
    conectar(INVESTIDOR);
    const servidor = simularServidor((chamada) => responder(chamada));
    abrir('/acoes/nova');

    await waitFor(() => expect(document.querySelector('input[name="ticker"]')).not.toBeNull());
    expect(document.querySelector('[data-sem-carteira]')).toBeNull();
    expect(servidor.para('/carteiras')).toEqual([]);
  });

  it('@spec:AC-321 o detalhe da ação não oferece remover', async () => {
    conectar(INVESTIDOR);
    simularServidor((chamada) => responder(chamada));
    abrir('/acoes/PETR4');

    await waitFor(() => expect(document.querySelector('[data-empresa]')?.textContent).toContain('Petróleo Brasileiro S.A.'));
    expect(document.querySelector('[data-remover]')).toBeNull();
    expect(document.body.textContent).not.toContain('Remover do catálogo');
  });
});

describe('Recusas novas do servidor', () => {
  it('@spec:AC-322 conta bloqueada no login é dita no formulário e nenhuma sessão começa', async () => {
    simularServidor((chamada) => (chamada.url === '/auth/login' ? erroPadrao('AUT-009', 403) : responder(chamada)));
    const { caminho } = await entrarPeloFormulario();

    const erro = await waitFor(() => {
      const encontrado = document.querySelector('[data-nivel="erro"]');
      if (!encontrado) throw new Error('sem erro');
      return encontrado;
    });
    expect(erro.textContent).toMatch(/bloqueada/i);
    expect(caminho()).toBe('/entrar');
    expect(sessao.ativa()).toBe(false);
  });

  it('@spec:AC-323 conta bloqueada durante o uso encerra a sessão e o login diz o motivo', async () => {
    const navegou = vi.fn();
    definirNavegacao(navegou);
    conectar(INVESTIDOR);
    simularServidor(() => erroPadrao('AUT-010', 401));

    await expect(http.get('/carteiras')).rejects.toMatchObject({ codigo: 'AUT-010' });
    expect(sessao.ativa()).toBe(false);
    expect(navegou).toHaveBeenCalledWith('/entrar?motivo=AUT-010');

    abrir('/entrar?motivo=AUT-010');
    await waitFor(() => expect(document.body.textContent).toMatch(/conta foi bloqueada/i));
  });

  it('@spec:AC-324 os códigos novos do contrato têm texto próprio e os extintos saem do catálogo', () => {
    const novos = [
      'AUT-009', 'AUT-010', 'AUT-011', 'AUT-012', 'AUT-013', 'AUT-014', 'AUT-015', 'AUT-016', 'AUT-017', 'AUT-018',
      'COR-005', 'COR-006', 'OPE-006', 'EXT-012', 'VAL-002',
    ];
    for (const codigo of novos) {
      const traduzido = traduzirErro({ status: 422, error: { timestamp: '2026-09-08T12:00:00Z', status: 422, codigo, error: 'erro', message: 'cru', path: '/' }, url: '/' });
      expect(traduzido.conhecido, `${codigo} caiu no genérico`).toBe(true);
      expect(traduzido.mensagem, `${codigo} sem texto próprio`).not.toBe(MENSAGEM_GENERICA);
      expect(traduzido.mensagem).not.toContain('cru');
    }
    for (const extinto of ['ACA-002', 'ACA-003', 'ACA-004']) expect(CATALOGO_ERROS[extinto]).toBeUndefined();
  });
});
