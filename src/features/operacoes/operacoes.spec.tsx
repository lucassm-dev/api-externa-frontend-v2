import { fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { feedback } from '@/core/feedback/feedback.service';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { montarEm } from '@/test/rotas';
import { erroPadrao, esperarElemento, json, simularServidor, type Chamada } from '@/test/servidor';
import { OperacaoDoExtrato } from './operacoes.model';
import { Operacoes } from './operacoes';

const AGORA = new Date().toISOString();
const paginaDe = (content: unknown[], number = 0, totalPages = 1) => ({ content, totalElements: content.length, totalPages, number, size: 20 });

const CARTEIRAS = [{ id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true }];
const CATALOGO = [{ id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', mercado: 'BR', moeda: 'BRL', cotacaoAtual: 32.5, dataHoraCotacao: AGORA }];
const POSICAO = { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', quantidade: 100, precoMedio: 30, cotacaoAtual: 32.5, dataHoraCotacao: AGORA, rentabilidadeNaoRealizada: 250 };

const NO_EXTRATO: OperacaoDoExtrato = { id: 1, carteiraId: 9, ticker: 'PETR4', tipo: 'COMPRA', quantidade: 100, precoUnitario: 32.5, valorTotal: 3250, dataHora: '2026-09-09T10:00:00', moeda: 'BRL' };
const DA_COMPRA = { ...NO_EXTRATO, id: 2, precoUnitario: 33.1, valorTotal: 3310, dataHora: '2026-09-09T12:00:00', avisos: [] as string[] };

interface Cenario {
  /** Páginas do extrato, na ordem do servidor. */
  extrato: OperacaoDoExtrato[][];
  posicoes?: unknown[];
  registro?: () => Response;
  alteracao?: () => Response;
  exclusao?: () => Response;
}

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;

function servidorDe(cenario: Cenario) {
  return simularServidor((chamada) => {
    const rota = caminho(chamada);
    if (rota === '/carteiras') return json(paginaDe(CARTEIRAS));
    if (rota === '/acoes') return json(paginaDe(CATALOGO));
    if (rota.endsWith('/posicoes')) return json(cenario.posicoes ?? [POSICAO]);
    if (rota === '/operacoes') {
      const numero = Number(new URL(chamada.url, 'http://localhost').searchParams.get('page'));
      return json(paginaDe(cenario.extrato[numero] ?? [], numero, cenario.extrato.length));
    }
    if (chamada.metodo === 'POST') return cenario.registro?.() ?? json(DA_COMPRA);
    if (chamada.metodo === 'PUT') return cenario.alteracao?.() ?? json({ ...DA_COMPRA, id: 1, quantidade: 50 });
    if (chamada.metodo === 'DELETE') return cenario.exclusao?.() ?? json(undefined, 204);
    return json(null, 404);
  });
}

async function abrir(cenario: Cenario, url = '/operacoes') {
  const servidor = servidorDe(cenario);
  const tela = montarEm({ '/operacoes': <Operacoes />, '/carteiras': <p data-tela-carteiras /> }, url);
  await waitFor(() => expect(tela.raiz.querySelector('[data-extrato-carregando]')).toBeNull());
  await waitFor(() => expect(tela.raiz.querySelectorAll('[data-campo-acao] option').length).toBeGreaterThan(1));
  const leiturasDoExtrato = () => servidor.chamadas.filter((chamada) => caminho(chamada) === '/operacoes' && chamada.metodo === 'GET').length;
  const ids = () => [...tela.raiz.querySelectorAll('[data-operacao]')].map((linha) => linha.getAttribute('data-operacao'));
  return { ...tela, servidor, leiturasDoExtrato, ids };
}

const mudar = (raiz: HTMLElement, seletor: string, valor: string) => fireEvent.change(raiz.querySelector(seletor)!, { target: { value: valor } });
const confirmarNoDialogo = async () => fireEvent.click(await esperarElemento(() => document.querySelector('[role="alertdialog"] [data-confirmar], [role="dialog"] [data-confirmar]')));

async function registrarCompra(raiz: HTMLElement) {
  mudar(raiz, '[data-campo-carteira]', '9');
  await waitFor(() => expect((raiz.querySelector('[data-campo-acao]') as HTMLSelectElement).options.length).toBeGreaterThan(1));
  mudar(raiz, '[data-campo-acao]', 'PETR4');
  mudar(raiz, '[data-campo-quantidade]', '100');
  fireEvent.click(raiz.querySelector('form [data-confirmar]')!);
  await esperarElemento(() => raiz.querySelector('[data-resultado]'));
}

afterEach(() => {
  vi.unstubAllGlobals();
  feedback.limpar();
  sessao.encerrar();
});

describe('Tela de operações', () => {
  it('@spec:AC-153 a tela tem um formulário e o extrato na mesma página', async () => {
    const { raiz } = await abrir({ extrato: [[NO_EXTRATO]] });

    expect(raiz.querySelector('form [data-seletor-tipo]')).toBeTruthy();
    expect(raiz.querySelector('[data-extrato] [data-operacao="1"]')).toBeTruthy();
  });

  it('@spec:AC-153 os parâmetros da carteira abrem o formulário já no tipo pedido', async () => {
    const { raiz } = await abrir({ extrato: [[NO_EXTRATO]] }, '/operacoes?carteira=9&tipo=VENDA');

    expect(raiz.querySelector('[data-tipo="VENDA"][data-marcada="sim"]')).toBeTruthy();
    expect((raiz.querySelector('[data-campo-carteira]') as HTMLSelectElement).value).toBe('9');
    expect(raiz.querySelector('[data-confirmar]')!.textContent).toContain('Registrar venda');
  });

  it('@spec:AC-156 depois de registrar, o formulário continua na tela e há volta à carteira', async () => {
    const { raiz } = await abrir({ extrato: [[NO_EXTRATO]] });

    await registrarCompra(raiz);

    expect(raiz.querySelector('form [data-seletor-tipo]')).toBeTruthy();
    expect(raiz.querySelector('[data-voltar-carteiras]')?.getAttribute('href')).toBe('/carteiras');
  });

  it('@spec:AC-173 a operação registrada aparece no extrato sem recarga manual', async () => {
    const cenario: Cenario = { extrato: [[NO_EXTRATO]] };
    const tela = await abrir(cenario);
    expect(tela.ids()).toEqual(['1']);
    cenario.extrato = [[DA_COMPRA, NO_EXTRATO]];

    await registrarCompra(tela.raiz);

    await waitFor(() => expect(tela.ids()).toEqual(['2', '1']));
  });

  it('@spec:AC-166 uma compra com avisos é apresentada como registrada, sem erro na tela', async () => {
    const { raiz } = await abrir({
      extrato: [[NO_EXTRATO]],
      registro: () => json({ ...DA_COMPRA, avisos: ['O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.'] }),
    });

    await registrarCompra(raiz);

    expect(raiz.querySelector('[data-confirmacao]')!.textContent).toContain('registrada');
    expect(raiz.querySelectorAll('[data-nivel="aviso"]')).toHaveLength(1);
    expect(raiz.querySelectorAll('[data-nivel="erro"]')).toHaveLength(0);
  });

  it('@spec:AC-306 a venda recusada por OPE-004 mostra a quantidade relida da carteira', async () => {
    const cenario: Cenario = { extrato: [[NO_EXTRATO]], registro: () => erroPadrao('OPE-004', 422) };
    const { raiz } = await abrir(cenario, '/operacoes?carteira=9&tipo=VENDA');
    await waitFor(() => expect((raiz.querySelector('[data-campo-acao]') as HTMLSelectElement).options.length).toBe(2));
    mudar(raiz, '[data-campo-acao]', 'PETR4');
    mudar(raiz, '[data-campo-quantidade]', '90');
    cenario.posicoes = [{ ...POSICAO, quantidade: 80 }];

    fireEvent.click(raiz.querySelector('form [data-confirmar]')!);

    const destaque = await esperarElemento(() => raiz.querySelector('[data-erro-quantidade]'));
    expect(destaque.textContent).toBe('Você tem apenas 80 unidades desta ação.');
    expect(raiz.querySelectorAll('[data-nivel="erro"]')).toHaveLength(0);
  });

  it('@spec:AC-177 depois de editar, o extrato é relido e mostra os valores novos', async () => {
    const cenario: Cenario = { extrato: [[NO_EXTRATO]] };
    const tela = await abrir(cenario);

    fireEvent.click(tela.raiz.querySelector('[data-operacao="1"] [data-editar] button')!);
    mudar(tela.raiz, '[data-edicao] [data-campo-quantidade]', '50');
    fireEvent.click(tela.raiz.querySelector('[data-salvar]')!);
    cenario.extrato = [[{ ...NO_EXTRATO, quantidade: 50 }]];
    await confirmarNoDialogo();

    await waitFor(() => expect(tela.raiz.querySelector('[data-operacao="1"] [data-quantidade]')!.textContent).toContain('50'));
    expect(tela.servidor.chamadas.find((chamada) => chamada.metodo === 'PUT')).toMatchObject({ url: '/operacoes/1', corpo: { quantidade: 50 } });
    expect(tela.raiz.querySelector('[data-edicao]')).toBeNull();
  });

  it('@spec:AC-180 depois de excluir, a operação sai do extrato sem recarga manual', async () => {
    const cenario: Cenario = { extrato: [[NO_EXTRATO]] };
    const tela = await abrir(cenario);

    fireEvent.click(tela.raiz.querySelector('[data-operacao="1"] [data-excluir] button')!);
    cenario.extrato = [[]];
    await confirmarNoDialogo();

    await esperarElemento(() => tela.raiz.querySelector('[data-extrato-vazio]'));
    expect(tela.raiz.querySelector('[data-operacao="1"]')).toBeNull();
    expect(feedback.mensagens().map((mensagem) => mensagem.texto)).toContain('Operação removida do extrato.');
  });

  it('@spec:AC-182 OPE-001 relê o extrato em vez de insistir na operação que sumiu', async () => {
    const cenario: Cenario = { extrato: [[NO_EXTRATO]], exclusao: () => erroPadrao('OPE-001', 404) };
    const tela = await abrir(cenario);
    const leiturasAntes = tela.leiturasDoExtrato();

    fireEvent.click(tela.raiz.querySelector('[data-operacao="1"] [data-excluir] button')!);
    cenario.extrato = [[]];
    await confirmarNoDialogo();

    await waitFor(() => expect(tela.leiturasDoExtrato()).toBe(leiturasAntes + 1));
    await waitFor(() => expect(tela.raiz.querySelector('[data-operacao="1"]')).toBeNull());
    expect(tela.raiz.querySelector('[data-nivel="erro"]')!.textContent).toContain('Operação não encontrada.');
  });

  it('@spec:AC-307 excluir o único item da última página volta à página anterior, sem esvaziar o extrato', async () => {
    const primeira = Array.from({ length: 20 }, (_, indice) => ({ ...NO_EXTRATO, id: 100 + indice }));
    const cenario: Cenario = { extrato: [primeira, [NO_EXTRATO]] };
    const tela = await abrir(cenario);
    fireEvent.click(tela.raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(tela.ids()).toEqual(['1']));

    fireEvent.click(tela.raiz.querySelector('[data-operacao="1"] [data-excluir] button')!);
    cenario.extrato = [primeira];
    await confirmarNoDialogo();

    await waitFor(() => expect(tela.ids()).toHaveLength(20));
    expect(tela.raiz.querySelector('[data-extrato-vazio]')).toBeNull();
  });
});

describe('Rotas das operações', () => {
  function abrirComSessao(url: string) {
    sessao.iniciar({ token: 'jwt', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() }, 'lucas@exemplo.com');
    servidorDe({ extrato: [[]], posicoes: [] });
    const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
    render(<RouterProvider router={roteador} />);
    return roteador;
  }

  it('@spec:AC-150 /operacoes abre a tela real, com o seletor de tipo à vista', async () => {
    const roteador = abrirComSessao('/operacoes');

    await esperarElemento(() => document.querySelector('[data-seletor-tipo]'));
    expect(roteador.state.location.pathname).toBe('/operacoes');
    expect(document.querySelector('[data-em-migracao]')).toBeNull();
  });

});

describe('Resumo ao vivo da operação', () => {
  const resumo = (raiz: HTMLElement) => raiz.querySelector('[data-resumo-operacao]')?.textContent?.replace(/\s+/g, ' ') ?? '';

  it('@spec:AC-402 sem carteira e ação, o cartão ao lado diz o que vai aparecer', async () => {
    const { raiz } = await abrir({ extrato: [[]] });

    expect(raiz.querySelector('[data-resumo-vazio]')).toBeTruthy();
    expect(resumo(raiz)).toMatch(/cotação.*posição.*total estimado/i);
  });

  it('@spec:AC-403 a ação escolhida aparece com logo, nome e cotação com horário', async () => {
    const { raiz } = await abrir({ extrato: [[]] });
    mudar(raiz, '[data-campo-acao]', 'PETR4');

    const cartao = await esperarElemento(() => raiz.querySelector('[data-resumo-operacao] [data-resumo-acao]'));
    expect(cartao.querySelector('img, [data-monograma]')).toBeTruthy();
    expect(resumo(raiz)).toContain('Petrobras');
    expect(cartao.closest('[data-resumo-operacao]')!.querySelector('[data-valor-com-horario]')!.textContent).toContain('32,50');
  });

  it('@spec:AC-404 mostra a posição na carteira; na venda, como disponível; sem posição, diz que não tem', async () => {
    const { raiz } = await abrir({ extrato: [[]] });
    mudar(raiz, '[data-campo-carteira]', '9');
    await waitFor(() => expect((raiz.querySelector('[data-campo-acao]') as HTMLSelectElement).options.length).toBeGreaterThan(1));
    mudar(raiz, '[data-campo-acao]', 'PETR4');

    const posicao = await esperarElemento(() => raiz.querySelector('[data-resumo-posicao]'));
    await waitFor(() => expect(posicao.textContent).toContain('100'));
    expect(posicao.textContent).toContain('30,00');

    fireEvent.click(raiz.querySelector('[data-tipo="VENDA"] input')!);
    mudar(raiz, '[data-campo-acao]', 'PETR4');
    await waitFor(() => expect(raiz.querySelector('[data-resumo-posicao]')!.textContent).toMatch(/disponível para venda/i));
  });

  it('@spec:AC-404 carteira sem a ação: o resumo diz que ela ainda não tem', async () => {
    const { raiz } = await abrir({ extrato: [[]], posicoes: [] });
    mudar(raiz, '[data-campo-carteira]', '9');
    mudar(raiz, '[data-campo-acao]', 'PETR4');

    await waitFor(() => expect(raiz.querySelector('[data-resumo-posicao]')!.textContent).toMatch(/ainda não tem/i));
  });

  it('@spec:AC-405 depois de registrar o comprovante ocupa o lugar do resumo; mexer no formulário traz o resumo de volta', async () => {
    const { raiz } = await abrir({ extrato: [[]] });
    await registrarCompra(raiz);

    expect(raiz.querySelector('[data-resumo-operacao]')).toBeNull();
    mudar(raiz, '[data-campo-quantidade]', '5');
    await waitFor(() => expect(raiz.querySelector('[data-resultado]')).toBeNull());
    expect(raiz.querySelector('[data-resumo-operacao]')).toBeTruthy();
  });
});
