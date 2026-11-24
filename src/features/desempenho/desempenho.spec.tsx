import { fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sessao } from '@/core/sessao/sessao.service';
import { CHAVE_CARTEIRA_PREFERIDA, carteiraPreferida } from '@/features/painel/carteira-preferida';
import { rotas } from '@/rotas';
import { montarEm } from '@/test/rotas';
import { esperarElemento, erroPadrao, json, simularServidor, type Chamada } from '@/test/servidor';
import { classesDe, gerarCss } from '@/test/tailwind';
import { Desempenho } from './desempenho';

const AGORA = new Date().toISOString();
const pagina = <T,>(itens: T[]) => ({ content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: 200 });
const carteira = (id: number, nome: string) => ({ id, investidorId: 1, corretoraId: 1, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome, ativa: true });

const CONSOLIDADO = { valorInvestido: 3500, valorDeMercado: 4000, lucroNaoRealizado: 500, taxaCambioAtual: 5, dataHoraTaxaCambio: AGORA, avisos: [] as string[] };
const PETR4 = { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', quantidade: 100, precoMedio: 28, cotacaoAtual: 30, dataHoraCotacao: AGORA, rentabilidadeNaoRealizada: 200 };
const AAPL = { id: 2, ticker: 'AAPL', nomeEmpresa: 'Apple', quantidade: 10, precoMedio: 18, cotacaoAtual: 20, dataHoraCotacao: AGORA, rentabilidadeNaoRealizada: 20 };
const ACOES = [
  { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', mercado: 'BR', moeda: 'BRL', cotacaoAtual: 30, dataHoraCotacao: AGORA },
  { id: 2, ticker: 'AAPL', nomeEmpresa: 'Apple', mercado: 'US', moeda: 'USD', cotacaoAtual: 20, dataHoraCotacao: AGORA },
];

interface DadosFalsos {
  consolidado?: unknown | null;
  posicoes?: unknown[] | null;
  lucro?: { total: number; porTicker: Record<string, number> } | null;
}

interface Cenario {
  carteiras: ReturnType<typeof carteira>[];
  porCarteira?: Record<number, DadosFalsos>;
  /** Segura a leitura do consolidado desta carteira até o teste liberar. */
  segurar?: number;
}

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;
const falha = () => erroPadrao('GEN-001', 500);

function servidorDe(cenario: Cenario) {
  const servidor = simularServidor((chamada) => {
    const rota = caminho(chamada);
    if (rota === '/carteiras') return json(pagina(cenario.carteiras));
    if (rota === '/acoes') return json(pagina(ACOES));
    const [, , id, recurso] = rota.split('/');
    const dados = { consolidado: CONSOLIDADO, posicoes: [PETR4, AAPL], lucro: { total: 0, porTicker: {} }, ...cenario.porCarteira?.[Number(id)] };
    if (recurso === 'consolidado') return Number(id) === cenario.segurar ? servidor.segurar() : dados.consolidado ? json(dados.consolidado) : falha();
    if (recurso === 'posicoes') return dados.posicoes ? json(dados.posicoes) : falha();
    if (recurso === 'lucro-realizado') return dados.lucro ? json(dados.lucro) : falha();
    return json(null, 404);
  });
  return servidor;
}

async function abrir(cenario: Cenario) {
  const servidor = servidorDe(cenario);
  const tela = montarEm({ '/desempenho': <Desempenho />, '/operacoes': <p data-tela-operacoes />, '/carteiras/nova': <p data-tela-nova-carteira /> }, '/desempenho');
  await waitFor(() => expect(tela.raiz.querySelector('[data-esqueleto-desempenho]')).toBeNull());
  return { ...tela, servidor };
}

const escolher = (raiz: HTMLElement, id: string) => fireEvent.change(raiz.querySelector('[data-seletor-carteira]')!, { target: { value: id } });
const DUAS = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')];

beforeEach(() => carteiraPreferida.lembrar(-1));
afterEach(() => {
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Tela de desempenho', () => {
  it('@spec:AC-189 o seletor lista as carteiras e a escolha troca os dados da tela', async () => {
    const { raiz, servidor } = await abrir({ carteiras: DUAS });
    const seletor = raiz.querySelector('[data-seletor-carteira]') as HTMLSelectElement;

    expect([...seletor.options].map((opcao) => opcao.textContent?.trim())).toEqual(['Longo prazo', 'Dividendos']);
    escolher(raiz, '4');

    await waitFor(() => expect(servidor.para('/carteiras/4/consolidado')).toHaveLength(1));
    await esperarElemento(() => raiz.querySelector('[data-numeros-desempenho]'));
  });

  it('@spec:AC-190 a carteira escolhida numa visita anterior é a que abre', async () => {
    carteiraPreferida.lembrar(4);
    const { raiz, servidor } = await abrir({ carteiras: DUAS });

    expect((raiz.querySelector('[data-seletor-carteira]') as HTMLSelectElement).value).toBe('4');
    expect(servidor.para('/carteiras/9/')).toHaveLength(0);
  });

  it('@spec:AC-190 escolher uma carteira guarda a escolha para a próxima visita', async () => {
    const { raiz } = await abrir({ carteiras: DUAS });

    escolher(raiz, '4');

    expect(localStorage.getItem(CHAVE_CARTEIRA_PREFERIDA)).toBe('4');
  });

  it('@spec:AC-191 todas as opções são carteiras concretas: não há visão somada de todas', async () => {
    const { raiz } = await abrir({ carteiras: DUAS });
    const opcoes = [...raiz.querySelectorAll('[data-seletor-carteira] option')];

    expect(opcoes.map((opcao) => opcao.getAttribute('value'))).toEqual(['9', '4']);
    expect(raiz.textContent ?? '').not.toMatch(/todas as carteiras|carteiras somadas|consolidado geral/i);
  });

  it('@spec:AC-209 carteira sem posição e sem venda convida a registrar a primeira compra, sem gráficos', async () => {
    const { raiz } = await abrir({
      carteiras: [carteira(9, 'Longo prazo')],
      porCarteira: { 9: { consolidado: { ...CONSOLIDADO, valorInvestido: 0, valorDeMercado: 0, lucroNaoRealizado: 0 }, posicoes: [] } },
    });

    const convite = raiz.querySelector('[data-convite-primeira-compra]')!;
    expect(convite.textContent).toContain('Registre sua primeira compra');
    expect(convite.querySelector('a')?.getAttribute('href')).toBe('/operacoes?carteira=9&tipo=COMPRA');
    for (const grafico of ['[data-grafico-composicao]', '[data-grafico-contribuicao]', '[data-grafico-realizado]']) {
      expect(raiz.querySelector(grafico), grafico).toBeNull();
    }
  });

  it('@spec:AC-210 investidor sem carteira nenhuma é convidado a criar a primeira', async () => {
    const { raiz } = await abrir({ carteiras: [] });

    expect(raiz.querySelector('[data-convite-carteira]')?.textContent).toContain('Crie sua primeira carteira');
    expect(raiz.querySelector('[data-seletor-carteira]')).toBeNull();
  });

  it('@spec:AC-211 leitura do realizado que falha não derruba os outros blocos', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')], porCarteira: { 9: { lucro: null } } });

    expect(raiz.querySelector('[data-numeros-desempenho]')).not.toBeNull();
    expect(raiz.querySelector('[data-grafico-composicao]')).not.toBeNull();
    expect(raiz.querySelector('[data-realizado-indisponivel]')?.textContent).toContain('Não foi possível ler');
  });

  it('@spec:AC-193 a posição em dólar entra nos gráficos convertida, e a composição fecha com o valor de mercado', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')] });

    // PETR4: 100 × R$ 30 = R$ 3.000. AAPL: 10 × US$ 20 × 5 = R$ 1.000. Total R$ 4.000.
    expect(raiz.querySelector('[data-fatia="AAPL"] [data-fatia-valor]')?.textContent).toContain('1.000,00');
    expect(raiz.querySelector('[data-soma-composicao]')?.textContent).toContain('4.000,00');
    expect(raiz.querySelector('[data-ressalva-composicao]')).toBeNull();
    // Contribuição: AAPL US$ 20 × 5 = R$ 100, abaixo de PETR4 (R$ 200).
    expect([...raiz.querySelectorAll('[data-contribuicao-ticker]')].map((no) => no.textContent?.trim())).toEqual(['PETR4', 'AAPL']);
  });

  it('@spec:AC-273 a grade dos gráficos vira coluna única na tela estreita', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')] });
    const grade = raiz.querySelector('[data-graficos]')!;
    const classes = classesDe(grade);
    const css = await gerarCss(classes);

    expect(classes).toContain('grid-cols-1');
    // o ponto de virada precisa alcançar o piso de tela de 360px (US-076): 72rem
    const virada = css.match(/@media \(width >= ([\d.]+)rem\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
    expect(virada).not.toBeNull();
    expect(parseFloat(virada![1]) * 16).toBeGreaterThanOrEqual(360);
    // a composição ocupa a linha inteira só na tela larga; na estreita volta a uma coluna
    expect(classes.find((classe) => classe.includes('data-grafico-composicao'))).toMatch(/^min-\[72rem\]:.*col-span-full$/);
  });

  it('@spec:AC-273 os quatro blocos novos chegam à tela, e não só ao repositório', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')], porCarteira: { 9: { lucro: { total: 150, porTicker: { PETR4: 150 } } } } });

    for (const seletor of ['[data-grafico-mapa]', '[data-grafico-concentracao]', '[data-grafico-investido-mercado]', '[data-grafico-quadrante]']) {
      expect(raiz.querySelector(seletor), seletor).not.toBeNull();
    }
  });

  it('@spec:AC-273 nenhum gráfico estoura ou é cortado na horizontal', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')] });
    const grade = raiz.querySelector('[data-graficos]')!;
    const css = await gerarCss(classesDe(grade));

    // colunas com piso zero: o conteúdo intrínseco (SVG, legenda) não empurra a largura
    expect(css).toMatch(/grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    // cada gráfico pode encolher abaixo do próprio conteúdo
    expect(css).toMatch(/> \*[\s\S]*?min-width: 0/);
    // nada na grade recorta a legenda
    expect(css).not.toMatch(/overflow(-x)?: hidden/);
  });

  it('@spec:AC-273 em repouso cada gráfico fica na mesma grade, com legenda e valores em texto legível', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')], porCarteira: { 9: { lucro: { total: 150, porTicker: { PETR4: 150 } } } } });
    const grade = raiz.querySelector('[data-graficos]') as HTMLElement;

    for (const seletor of ['[data-grafico-composicao]', '[data-grafico-contribuicao]', '[data-grafico-realizado]']) {
      expect(grade.querySelector(seletor)?.parentElement, seletor).toBe(grade);
    }
    const fatia = grade.querySelector('[data-fatia="PETR4"]') as HTMLElement;
    expect(fatia.querySelector('[data-fatia-ticker]')?.textContent).toContain('PETR4');
    expect(fatia.querySelector('[data-fatia-valor]')?.textContent).toMatch(/\d/);
    expect(fatia.querySelector('[data-fatia-participacao]')?.textContent).toMatch(/\d/);
    expect(grade.querySelector('[data-contribuicao-ticker]')?.textContent?.trim()).toBeTruthy();
    expect(grade.querySelector('[data-contribuicao-valor]')?.textContent).toMatch(/\d/);
    expect(grade.querySelector('[data-realizado-ticker]')?.textContent).toContain('PETR4');
    expect(grade.querySelector('[data-realizado-valor]')?.textContent).toMatch(/\d/);
  });

  it('@spec:AC-205 os avisos de dividendos e de snapshot estão sempre visíveis na tela', async () => {
    const { raiz } = await abrir({ carteiras: [carteira(9, 'Longo prazo')] });

    expect(raiz.querySelector('[data-aviso-dividendos]')?.textContent).toContain('não inclui dividendos nem JCP');
    expect(raiz.querySelector('[data-aviso-snapshot]')?.textContent).toContain('snapshots');
  });

  it('@spec:AC-309 trocar de carteira antes de a leitura terminar descarta a resposta atrasada', async () => {
    const servidor = servidorDe({ carteiras: DUAS, segurar: 9, porCarteira: { 4: { posicoes: [PETR4] } } });
    const { raiz } = montarEm({ '/desempenho': <Desempenho /> }, '/desempenho');
    await waitFor(() => expect(servidor.para('/carteiras/9/consolidado')).toHaveLength(1));

    escolher(raiz, '4');
    await esperarElemento(() => raiz.querySelector('[data-fatia="PETR4"]'));
    servidor.liberar(json(CONSOLIDADO));
    await new Promise((resolver) => setTimeout(resolver, 20));

    expect((raiz.querySelector('[data-seletor-carteira]') as HTMLSelectElement).value).toBe('4');
    expect(raiz.querySelector('[data-fatia="AAPL"]')).toBeNull();
  });
});

describe('Rota do desempenho', () => {
  it('@spec:AC-210 a área de desempenho tem tela própria, e não mais o destino de área em construção', async () => {
    sessao.iniciar({ token: 'jwt', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() }, 'lucas@exemplo.com');
    servidorDe({ carteiras: [] });
    const roteador = createMemoryRouter(rotas, { initialEntries: ['/desempenho'] });
    render(<RouterProvider router={roteador} />);

    const titulo = await esperarElemento(() => document.querySelector('main h1, h1'));
    expect(roteador.state.location.pathname).toBe('/desempenho');
    expect(titulo.textContent).toContain('Desempenho');
    expect(document.body.textContent).not.toMatch(/ainda (vai ser construída|está sendo migrada)/i);
  });
});
