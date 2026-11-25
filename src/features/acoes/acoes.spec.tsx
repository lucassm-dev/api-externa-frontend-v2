import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { feedback } from '@/core/feedback/feedback.service';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { montarEm } from '@/test/rotas';
import { erroPadrao, esperarElemento, json, simularServidor, type Chamada } from '@/test/servidor';
import { classesDe, gerarCss } from '@/test/tailwind';
import { Acao } from './acoes.model';
import { acoesService } from './acoes.service';
import { CadastroAcao } from './cadastro-acao';
import { DetalheAcao } from './detalhe-acao';
import { ListaAcoes } from './lista-acoes';

const AGORA = new Date('2026-09-09T14:00:00');
const PETR4: Acao = { id: 12, ticker: 'PETR4', nomeEmpresa: 'Petróleo Brasileiro S.A.', mercado: 'BR', moeda: 'BRL', cotacaoAtual: 38.42, dataHoraCotacao: '2026-09-09T13:55:00' };
const AAPL: Acao = { id: 13, ticker: 'AAPL', nomeEmpresa: 'Apple Inc.', mercado: 'US', moeda: 'USD', cotacaoAtual: 231.5, dataHoraCotacao: '2026-09-09T13:00:00' };

const pagina = <T,>(content: T[], extra: Record<string, number> = {}) => ({ content, totalElements: content.length, totalPages: 1, number: 0, size: 20, ...extra });
const busca = (url: string) => new URL(url, 'http://localhost').searchParams;
const atualizacoes = (chamadas: Chamada[]) => chamadas.filter((c) => c.url.includes('atualizar-cotacao'));

/** Só a data é fixada: parar os timers travaria a espera dos testes. */
function fixarRelogio() {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(AGORA);
}

/** Com o relógio adiantado 20 minutos, qualquer atualização agendada já teria saído. */
function adiantarVinteMinutos() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] });
  vi.setSystemTime(new Date(AGORA.getTime() + 20 * 60_000));
  vi.advanceTimersByTime(20 * 60_000);
  vi.useRealTimers();
}

beforeEach(() => feedback.limpar());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Serviço do catálogo de ações', () => {
  it('@spec:AC-122 o cadastro envia só ticker e mercado, e devolve a ação com cotação datada', async () => {
    const servidor = simularServidor(() => json(PETR4));

    const acao = await acoesService.cadastrar({ ticker: ' petr4 ', mercado: 'BR' });

    // Sem cadastro no servidor: a pesquisa com o mercado inclui no catálogo (identidade-papel, AC-319).
    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'GET', url: '/acoes/ticker/PETR4?mercado=BR' });
    expect(acao.dataHoraCotacao).toBe(PETR4.dataHoraCotacao);
  });

  it('@spec:AC-132 a listagem pede a página que a tela pediu', async () => {
    const servidor = simularServidor(() => json(pagina([PETR4], { number: 2, totalPages: 3 })));

    await acoesService.listar(2);

    expect(busca(servidor.chamadas[0].url).get('page')).toBe('2');
    expect(busca(servidor.chamadas[0].url).get('size')).toBe('20');
  });

  it('@spec:AC-133 buscar ticker que não existe devolve vazio, não erro', async () => {
    const servidor = simularServidor(() => erroPadrao('ACA-001', 404));

    await expect(acoesService.porTicker('vale3')).resolves.toBeNull();
    expect(servidor.chamadas[0].url).toBe('/acoes/ticker/VALE3');
  });

  it('@spec:AC-136 a atualização de cotação só sai quando é pedida, e sem forçar por padrão', async () => {
    const servidor = simularServidor(() => json(PETR4));

    await acoesService.atualizarCotacao(12);

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'PUT', url: '/acoes/12/atualizar-cotacao' });
  });

  it('@spec:AC-142 forçar manda o pedido explícito de ignorar o cache', async () => {
    const servidor = simularServidor(() => json(PETR4));

    await acoesService.atualizarCotacao(12, true);

    expect(busca(servidor.chamadas[0].url).get('forcar')).toBe('true');
  });

});

describe('Rotas das ações', () => {
  function abrirComSessao(url: string) {
    sessao.iniciar({ token: 'jwt', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() }, 'lucas@exemplo.com');
    const servidor = simularServidor(({ url: endereco }) => (endereco === '/acoes/ticker/PETR4' ? json(PETR4) : json(pagina([]))));
    const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
    render(<RouterProvider router={roteador} />);
    return { servidor, caminho: () => roteador.state.location.pathname };
  }

  afterEach(() => sessao.encerrar());

  it('@spec:AC-133 a área de ações tem lista e cadastro com endereço próprio', async () => {
    const lista = abrirComSessao('/acoes');
    await waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Ações'));
    expect(lista.caminho()).toBe('/acoes');
    expect(document.querySelector('[data-em-migracao]')).toBeNull();
    cleanup();

    const cadastro = abrirComSessao('/acoes/nova');
    await waitFor(() => expect(document.querySelector('h1')?.textContent).toBe('Cadastrar ação'));
    expect(cadastro.caminho()).toBe('/acoes/nova');
  });

  it('@spec:AC-147 o detalhe abre pelo ticker na URL', async () => {
    const { servidor, caminho } = abrirComSessao('/acoes/PETR4');

    await waitFor(() => expect(document.querySelector('[data-empresa]')?.textContent).toContain('Petróleo Brasileiro S.A.'));
    expect(caminho()).toBe('/acoes/PETR4');
    expect(servidor.para('/acoes/ticker/PETR4')[0].metodo).toBe('GET');
  });
});

async function abrirLista(responder: (chamada: Chamada) => Response = () => json(pagina([PETR4, AAPL]))) {
  const servidor = simularServidor((chamada) => (chamada.url.startsWith('/acoes/ticker/') ? (chamada.url.endsWith('PETR4') ? json(PETR4) : erroPadrao('ACA-001', 404)) : responder(chamada)));
  const tela = montarEm({ '/acoes': <ListaAcoes />, '/acoes/nova': <p data-tela-nova />, '/acoes/:ticker': <p data-tela-detalhe /> }, '/acoes');
  await esperarElemento(() => tela.raiz.querySelector('[data-acao], [data-proximo-passo]'));
  return { ...tela, servidor };
}

function buscarTicker(raiz: HTMLElement, termo: string) {
  fireEvent.change(raiz.querySelector('input[name="termo"]')!, { target: { value: termo } });
  fireEvent.submit(raiz.querySelector('form')!);
}

describe('Lista de ações', () => {
  beforeEach(fixarRelogio);

  it('@spec:AC-130 o título é "Ações" e o catálogo é declarado compartilhado', async () => {
    const { raiz } = await abrirLista();

    expect(raiz.querySelector('h1')?.textContent?.trim()).toBe('Ações');
    expect(raiz.querySelector('[data-catalogo-compartilhado]')?.textContent).toContain('compartilhado');
    expect((raiz.textContent ?? '').toLowerCase()).not.toContain('minhas ações');
  });

  it('@spec:AC-131 cada linha traz ticker, empresa, mercado, moeda e cotação com horário', async () => {
    const { raiz } = await abrirLista();

    const linhas = raiz.querySelectorAll('[data-acao]');
    expect(linhas).toHaveLength(2);
    const brasileira = linhas[0];
    expect(brasileira.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
    expect(brasileira.querySelector('[data-empresa]')?.textContent).toContain('Petróleo Brasileiro S.A.');
    expect(brasileira.querySelector('[data-mercado]')?.textContent).toContain('Brasil');
    expect(brasileira.querySelector('[data-moeda]')?.textContent).toContain('BRL');
    expect(brasileira.querySelector('[data-horario]')?.textContent).toContain('13:55');
    // Nenhuma cotação sem horário: cada preço exibido tem o seu (ADR-005).
    expect(raiz.querySelectorAll('[data-numero]').length).toBe(raiz.querySelectorAll('[data-horario]').length);
  });

  it('@spec:AC-135 cotação com mais de 15 minutos aparece marcada, a recente não', async () => {
    const { raiz } = await abrirLista();

    const [recente, velha] = raiz.querySelectorAll('[data-valor-com-horario]');
    expect(recente.getAttribute('data-defasado')).toBe('false');
    expect(velha.getAttribute('data-defasado')).toBe('true');
    expect(velha.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });

  it('@spec:AC-132 avançar de página busca a página pedida e mantém a ordem do servidor', async () => {
    const { raiz, servidor } = await abrirLista(({ url }) =>
      busca(url).get('page') === '1' ? json(pagina([AAPL, PETR4], { number: 1, totalPages: 2, totalElements: 40 })) : json(pagina([PETR4, AAPL], { totalPages: 2, totalElements: 40 })),
    );

    fireEvent.click(raiz.querySelector('[data-proxima]')!);

    await waitFor(() => expect([...raiz.querySelectorAll('[data-ticker]')].map((t) => t.textContent?.trim())).toEqual(['AAPL', 'PETR4']));
    expect(busca(servidor.chamadas.at(-1)!.url).get('page')).toBe('1');
  });

  it('@spec:AC-133 buscar ticker existente abre a ação', async () => {
    const { raiz, caminho, servidor } = await abrirLista();

    buscarTicker(raiz, 'petr4');

    await waitFor(() => expect(caminho()).toBe('/acoes/PETR4'));
    expect(servidor.para('/acoes/ticker/PETR4')).toHaveLength(1);
  });

  it('@spec:AC-133 buscar ticker inexistente vira estado vazio com oferta de cadastrar', async () => {
    const { raiz } = await abrirLista();

    buscarTicker(raiz, 'VALE3');

    const vazio = await esperarElemento(() => raiz.querySelector('[data-busca-vazia]'));
    expect(vazio.textContent).toContain('VALE3');
    const atalho = raiz.querySelector('[data-cadastrar-buscado]')!.getAttribute('href')!;
    expect(atalho).toContain('/acoes/nova');
    expect(atalho).toContain('ticker=VALE3');
    expect(raiz.textContent).not.toContain('Ação não encontrada.');
  });

  it('@spec:AC-134 a lista não marca posse nem consulta posições do investidor', async () => {
    const { raiz, servidor } = await abrirLista();

    expect(servidor.chamadas.map((c) => c.url).filter((url) => /posicoes|consolidado|^\/carteiras/.test(url))).toEqual([]);
    expect(raiz.querySelector('[data-selo]')).toBeNull();
    expect((raiz.textContent ?? '').toLowerCase()).not.toContain('você possui');
  });

  it('@spec:AC-136 nenhuma atualização de cotação parte da lista, e nada fica agendado', async () => {
    const { servidor } = await abrirLista();

    adiantarVinteMinutos();

    expect(atualizacoes(servidor.chamadas)).toEqual([]);
    expect(servidor.chamadas).toHaveLength(1);
  });

  it('@spec:AC-247 cada linha traz o monograma do ativo junto ao ticker', async () => {
    const { raiz } = await abrirLista();

    const primeira = raiz.querySelector('[data-acao]')!;
    expect(primeira.querySelector('[data-monograma]')?.getAttribute('aria-label')).toContain('PETR4');
    expect(primeira.querySelector('[data-ticker]')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-245 a linha se destaca sob o ponteiro, e o destaque não é a única pista', async () => {
    const { raiz } = await abrirLista();
    const css = await gerarCss(classesDe(raiz.querySelector('[data-acao]')!));

    expect(css).toMatch(/:hover[\s\S]*?background-color:/);
    expect(css).toMatch(/border-(style|width):/);
  });

  it('@spec:AC-249 o paginador informa página, total e faixa, desabilitando as pontas', async () => {
    const { raiz } = await abrirLista(({ url }) => {
      const numero = Number(busca(url).get('page'));
      return json(pagina([PETR4, AAPL], { number: numero, totalPages: 3, totalElements: 50 }));
    });

    expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 1 de 3/);
    expect(raiz.querySelector('[data-faixa]')?.textContent).toMatch(/1.*20.*50/);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(false);

    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 2 de 3/));
    fireEvent.click(raiz.querySelector('[data-proxima]')!);
    await waitFor(() => expect(raiz.querySelector('[data-pagina]')?.textContent).toMatch(/Página 3 de 3/));
    expect(raiz.querySelector('[data-proxima]')?.hasAttribute('disabled')).toBe(true);
    expect(raiz.querySelector('[data-anterior]')?.hasAttribute('disabled')).toBe(false);
  });

  it('@spec:AC-250 carregando mostra esqueleto; catálogo vazio mostra estado vazio com próximo passo', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = montarEm({ '/acoes': <ListaAcoes /> }, '/acoes');

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).not.toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')).toBeNull();
    servidor.liberar(json(pagina([])));

    await waitFor(() => expect(raiz.querySelector('[data-esqueleto]')).toBeNull());
    expect(raiz.querySelector('[data-proximo-passo]')?.textContent).toMatch(/cadastrar/i);
  });
});

interface CenarioDoCadastro {
  cadastrar?: () => Response | Promise<Response>;
}

async function abrirCadastro({ cadastrar = () => json(PETR4) }: CenarioDoCadastro = {}) {
  const servidor = simularServidor(({ url }) => (url.startsWith('/acoes/ticker/') ? cadastrar() : json(PETR4)));
  const tela = montarEm({ '/acoes/nova': <CadastroAcao />, '/acoes/:ticker': <p data-tela-detalhe /> }, '/acoes/nova');
  await esperarElemento(() => tela.raiz.querySelector('form'));
  return { ...tela, servidor };
}

function enviarCadastro(raiz: HTMLElement, ticker = 'PETR4') {
  fireEvent.change(raiz.querySelector('[data-campo-ticker]')!, { target: { value: ticker } });
  fireEvent.submit(raiz.querySelector('form')!);
}

const banner = (raiz: HTMLElement) => raiz.querySelector('[data-nivel="erro"] [data-mensagem]')?.textContent;
const cadastros = (chamadas: Chamada[]) => chamadas.filter((c) => c.url.startsWith('/acoes/ticker/'));

describe('Cadastro de ação', () => {
  it('@spec:AC-121 o formulário tem exatamente dois campos, ticker e mercado', async () => {
    const { raiz } = await abrirCadastro();

    expect(raiz.querySelectorAll('input, select, textarea')).toHaveLength(2);
    // Nenhum rótulo de campo pede o que a fonte traz: empresa, moeda ou cotação.
    const rotulos = [...raiz.querySelectorAll('form label')].map((rotulo) => (rotulo.textContent ?? '').toLowerCase()).join(' ');
    expect(rotulos).toContain('ticker');
    expect(rotulos).toContain('mercado');
    for (const daFonte of ['empresa', 'moeda', 'cotação']) expect(rotulos).not.toContain(daFonte);
  });

  it('@spec:AC-122 cadastro aceito leva à ação com nome, moeda e cotação datada', async () => {
    const { raiz, servidor, caminho } = await abrirCadastro();

    enviarCadastro(raiz);

    await waitFor(() => expect(caminho()).toBe('/acoes/PETR4'));
    expect(cadastros(servidor.chamadas)[0].url).toBe('/acoes/ticker/PETR4?mercado=BR');
  });

  it('@spec:AC-123 clicar de novo durante a consulta não dispara requisição extra', async () => {
    let liberar: (resposta: Response) => void = () => undefined;
    const { raiz, servidor, caminho } = await abrirCadastro({ cadastrar: () => new Promise((resolver) => (liberar = resolver)) });

    enviarCadastro(raiz);
    await esperarElemento(() => raiz.querySelector('[data-consultando]'));
    fireEvent.submit(raiz.querySelector('form')!);
    fireEvent.submit(raiz.querySelector('form')!);

    expect(cadastros(servidor.chamadas)).toHaveLength(1);
    liberar(json(PETR4));
    await waitFor(() => expect(caminho()).toBe('/acoes/PETR4'));
    expect(cadastros(servidor.chamadas)).toHaveLength(1);
  });

  it('@spec:AC-124 EXT-008 mantém ticker e mercado no formulário, sem criar ação', async () => {
    const { raiz, servidor } = await abrirCadastro({ cadastrar: () => erroPadrao('EXT-008', 404) });

    enviarCadastro(raiz);

    await waitFor(() => expect(banner(raiz)).toBe('Não encontramos este ticker no mercado selecionado. Confira o código e o mercado.'));
    expect((raiz.querySelector('[data-campo-ticker]') as HTMLInputElement).value).toBe('PETR4');
    expect((raiz.querySelector('[data-campo-mercado]') as HTMLSelectElement).value).toBe('BR');
    expect(raiz.querySelector('[data-campo="ticker"] [data-erro]')).not.toBeNull();
    expect(cadastros(servidor.chamadas)).toHaveLength(1);
  });

});

interface CenarioDoDetalhe {
  acao?: Acao | null;
  /** Respostas da atualização de cotação, na ordem dos pedidos. */
  atualizacoes?: Array<() => Response>;
}

async function abrirDetalhe({ acao = PETR4, atualizacoes: respostas = [] }: CenarioDoDetalhe = {}) {
  const servidor = simularServidor(({ metodo }) => {
    if (metodo === 'PUT') return respostas.shift()!();
    return acao ? json(acao) : erroPadrao('ACA-001', 404);
  });
  const tela = montarEm({ '/acoes/:ticker': <DetalheAcao />, '/acoes': <p data-tela-lista /> }, '/acoes/PETR4');
  if (acao) await esperarElemento(() => tela.raiz.querySelector('[data-atualizar]'));
  return { ...tela, servidor };
}

const precoNaTela = (raiz: HTMLElement) => raiz.querySelector('[data-valor-com-horario] [data-numero]')?.textContent ?? '';
const aviso = (raiz: HTMLElement) => raiz.querySelector('[data-nivel] [data-mensagem]')?.textContent;

async function atualizar(raiz: HTMLElement, botao = '[data-atualizar]') {
  fireEvent.click(raiz.querySelector(botao)!);
  await waitFor(() => expect(raiz.querySelector('[data-atualizar]')?.textContent).toContain('Atualizar cotação'));
}

describe('Detalhe da ação', () => {
  beforeEach(fixarRelogio);

  it('@spec:AC-136 abrir o detalhe não dispara atualização de cotação nenhuma', async () => {
    const { servidor } = await abrirDetalhe();
    expect(atualizacoes(servidor.chamadas)).toEqual([]);

    adiantarVinteMinutos();

    expect(atualizacoes(servidor.chamadas)).toEqual([]);
  });

  it('@spec:AC-135 cotação com mais de 15 minutos aparece marcada como defasada', async () => {
    const { raiz } = await abrirDetalhe({ acao: { ...PETR4, dataHoraCotacao: '2026-09-09T13:00:00' } });

    const valor = raiz.querySelector('[data-valor-com-horario]');
    expect(valor?.getAttribute('data-defasado')).toBe('true');
    expect(valor?.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });

  it('@spec:AC-137 preço novo troca número e horário na tela', async () => {
    const { raiz } = await abrirDetalhe({ atualizacoes: [() => json({ ...PETR4, cotacaoAtual: 39.9, dataHoraCotacao: '2026-09-09T14:00:00' })] });

    await atualizar(raiz);

    expect(precoNaTela(raiz)).toContain('39,90');
    expect(raiz.querySelector('[data-horario]')?.textContent).toContain('14:00');
    const resultado = raiz.querySelector('[data-resultado-atualizacao]');
    expect(resultado?.getAttribute('data-desfecho')).toBe('preco-novo');
    expect(resultado?.textContent).toContain('atualizada');
  });

  it('@spec:AC-138 mesmo preço por cache válido é comunicado como "continua atual"', async () => {
    const { raiz } = await abrirDetalhe({ atualizacoes: [() => json(PETR4)] });

    await atualizar(raiz);

    const resultado = raiz.querySelector('[data-resultado-atualizacao]');
    expect(resultado?.getAttribute('data-desfecho')).toBe('continua-atual');
    expect(resultado?.textContent).toContain('continua atual');
    expect(resultado?.textContent).toContain('13:55');
    expect((resultado?.textContent ?? '').toLowerCase()).not.toContain('erro');
    expect(precoNaTela(raiz)).toContain('38,42');
  });

  it('@spec:AC-139 EXT-009 mantém o último preço e nomeia o horário dele', async () => {
    const { raiz } = await abrirDetalhe({ atualizacoes: [() => erroPadrao('EXT-009', 429)] });

    await atualizar(raiz);

    expect(aviso(raiz)).toBe('O limite de consultas da fonte foi atingido. O preço exibido é de 13:55.');
    expect(precoNaTela(raiz)).toContain('38,42');
    expect(raiz.querySelector('[data-horario]')?.textContent).toContain('13:55');
  });

  it('@spec:AC-140 EXT-010 mantém o preço com mensagem diferente da de EXT-009', async () => {
    const { raiz } = await abrirDetalhe({ atualizacoes: [() => erroPadrao('EXT-010', 503)] });

    await atualizar(raiz);

    expect(aviso(raiz)).toBe('A fonte de cotação está indisponível. O preço exibido é de 13:55.');
    expect(aviso(raiz)).not.toContain('limite de consultas');
    expect(precoNaTela(raiz)).toContain('38,42');
  });

  it('@spec:AC-141 forçar só aparece depois de o cache ter sido reaproveitado', async () => {
    const { raiz } = await abrirDetalhe({ atualizacoes: [() => erroPadrao('EXT-009', 429), () => json(PETR4)] });
    expect(raiz.querySelector('[data-forcar]')).toBeNull();

    await atualizar(raiz);
    expect(raiz.querySelector('[data-forcar]')).toBeNull();

    await atualizar(raiz);
    expect(raiz.querySelector('[data-forcar]')).not.toBeNull();
    expect(raiz.querySelector('[data-aviso-cota]')?.textContent).toContain('cota');
  });

  it('@spec:AC-142 forçar envia o pedido de ignorar o cache, e só então', async () => {
    const { raiz, servidor } = await abrirDetalhe({
      atualizacoes: [() => json(PETR4), () => json({ ...PETR4, cotacaoAtual: 40.1, dataHoraCotacao: '2026-09-09T14:00:00' })],
    });

    await atualizar(raiz);
    await atualizar(raiz, '[data-forcar]');

    const [comum, forcada] = atualizacoes(servidor.chamadas);
    expect(busca(comum.url).has('forcar')).toBe(false);
    expect(busca(forcada.url).get('forcar')).toBe('true');
    expect(precoNaTela(raiz)).toContain('40,10');
  });

  it('@spec:AC-147 ticker que não existe devolve o investidor à lista', async () => {
    const { caminho } = await abrirDetalhe({ acao: null });

    await waitFor(() => expect(caminho()).toBe('/acoes'));
    expect(feedback.mensagens().some((m) => m.texto === 'Ação não encontrada.')).toBe(true);
  });
});
