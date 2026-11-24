import { fireEvent, waitFor } from '@testing-library/react';
import { feedback } from '@/core/feedback/feedback.service';
import { montarEm } from '@/test/rotas';
import { erroPadrao, esperarElemento, json, simularServidor, type Chamada } from '@/test/servidor';
import { Carteira, ExtratoBuscado, Posicao } from './carteiras.model';
import { DetalheCarteira } from './detalhe-carteira';
import { MovimentacoesCarteira } from './movimentacoes-carteira';
import { PosicoesCarteira } from './posicoes-carteira';

const CARTEIRA: Carteira = { id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP Investimentos', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true };
const CONSOLIDADO = { valorInvestido: 10_000, valorDeMercado: 11_500.5, lucroNaoRealizado: 1_500.5, taxaCambioAtual: 5.42, dataHoraTaxaCambio: new Date().toISOString(), avisos: [] as string[] };
const PETR4: Posicao = { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petróleo Brasileiro S.A.', quantidade: 100, precoMedio: 10, cotacaoAtual: 12.5, dataHoraCotacao: new Date().toISOString(), rentabilidadeNaoRealizada: 250 };
const MOVIMENTACAO = { id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA', ticker: 'PETR4', quantidade: 100 };
const NAO_REVELA = /outro investidor|de outra pessoa|permiss|inativ|dono/i;

const pagina = (conteudo: unknown[]) => json({ content: conteudo, totalElements: conteudo.length, totalPages: 1, number: 0, size: 200 });

interface Cenario {
  carteiras?: Carteira[];
  consolidado?: typeof CONSOLIDADO;
  posicoes?: Posicao[];
  lucro?: { total: number; porTicker: Record<string, number> };
  itens?: Array<typeof MOVIMENTACAO>;
  /** Resposta das três leituras da carteira no lugar dos dados. */
  falhaDoConteudo?: () => Response;
  /** Escritas (PATCH, PUT, DELETE). */
  escrever?: (chamada: Chamada) => Response;
}

/** O backend do detalhe. O cenário é lido a cada chamada: mudar o objeto muda as releituras. */
function servidorDoDetalhe(cenario: Cenario) {
  return simularServidor((chamada) => {
    const { url, metodo } = chamada;
    if (metodo !== 'GET') return cenario.escrever?.(chamada) ?? json(undefined, 204);
    if (url.startsWith('/carteiras?')) return pagina(cenario.carteiras ?? [CARTEIRA]);
    if (url.startsWith('/operacoes?')) return pagina(cenario.itens ?? [MOVIMENTACAO]);
    if (cenario.falhaDoConteudo) return cenario.falhaDoConteudo();
    if (url === '/carteiras/9/posicoes') return json(cenario.posicoes ?? [PETR4]);
    if (url === '/carteiras/9/consolidado') return json(cenario.consolidado ?? CONSOLIDADO);
    if (url === '/carteiras/9/lucro-realizado') return json(cenario.lucro ?? { total: 320.75, porTicker: { PETR4: 200, VALE3: 120.75 } });
    return json('', 500);
  });
}

async function abrirDetalhe(cenario: Cenario = {}, esperar = true) {
  const servidor = servidorDoDetalhe(cenario);
  const tela = montarEm(
    { '/carteiras/:id': <DetalheCarteira />, '/carteiras': <p data-tela-lista />, '/operacoes': <p data-tela-operacoes /> },
    '/carteiras/9',
  );
  if (esperar) {
    await esperarElemento(() => tela.raiz.querySelector('[data-realizado]'));
    await esperarElemento(() => tela.raiz.querySelector('[data-movimentacoes]'));
  }
  return { ...tela, servidor };
}

const dialogo = () => document.querySelector('[role="alertdialog"]') as HTMLElement | null;

beforeEach(() => feedback.limpar());
afterEach(() => vi.unstubAllGlobals());

describe('Detalhe da carteira', () => {
  it('@spec:AC-101 o cabeçalho traz identificação e os quatro totais', async () => {
    const { raiz } = await abrirDetalhe();

    const cabecalho = raiz.querySelector('[data-cabecalho]') as HTMLElement;
    expect(cabecalho.textContent).toContain('Dividendos');
    expect(cabecalho.textContent).toContain('XP Investimentos');
    expect(cabecalho.textContent).toContain('Brasil');
    expect(cabecalho.querySelector('[data-investido]')?.textContent).toContain('10.000,00');
    expect(cabecalho.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(cabecalho.querySelector('[data-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(cabecalho.querySelector('[data-realizado]')?.textContent).toContain('320,75');
  });

  it('@spec:AC-102 os totais saem em real, com a taxa de câmbio e o horário dela', async () => {
    const { raiz } = await abrirDetalhe();

    expect(raiz.querySelector('[data-investido]')?.textContent).toContain('R$');
    const cambio = raiz.querySelector('[data-taxa-cambio] [data-valor-com-horario]') as HTMLElement;
    expect(cambio.querySelector('[data-numero]')?.textContent).toContain('5,42');
    expect(cambio.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-103 realizado e não realizado aparecem separados e nunca somados', async () => {
    const { raiz } = await abrirDetalhe();

    const cabecalho = raiz.querySelector('[data-cabecalho]') as HTMLElement;
    expect(cabecalho.querySelector('[data-nao-realizado]')).toBeTruthy();
    expect(cabecalho.querySelector('[data-realizado]')).toBeTruthy();
    expect(cabecalho.textContent).toMatch(/não realizado/i);
    // 1.500,50 + 320,75 = 1.821,25 — esse número não pode existir em lugar nenhum.
    expect(raiz.textContent).not.toContain('1.821,25');
  });

  it('@spec:AC-104 aviso do consolidado é aviso e não bloqueia os totais', async () => {
    const { raiz } = await abrirDetalhe({ consolidado: { ...CONSOLIDADO, avisos: ['A cotação do dólar está indisponível.'] } });

    expect(raiz.querySelector('[data-aviso-consolidado]')?.textContent).toContain('A cotação do dólar está indisponível.');
    expect(raiz.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(raiz.querySelector('[data-nivel="erro"]')).toBeNull();
  });

  it('@spec:AC-105 a tela oferece registrar compra e venda identificando esta carteira', async () => {
    const { raiz } = await abrirDetalhe();

    const compra = raiz.querySelector('[data-registrar-compra]')!.getAttribute('href')!;
    const venda = raiz.querySelector('[data-registrar-venda]')!.getAttribute('href')!;
    expect(compra).toContain('/operacoes');
    expect(compra).toContain('carteira=9');
    expect(venda).toContain('carteira=9');
    expect(venda).toContain('VENDA');
  });

  it('@spec:AC-115 a edição alcança só o nome', async () => {
    const { raiz } = await abrirDetalhe();

    fireEvent.click(raiz.querySelector('[data-renomear]')!);

    const edicao = raiz.querySelector('[data-edicao-nome]') as HTMLElement;
    expect(edicao.querySelectorAll('input, select, textarea').length).toBe(1);
    expect(edicao.querySelector('[data-campo-nome]')).toBeTruthy();
  });

  it('@spec:AC-116 renomear troca o nome e preserva totais, posições e movimentações', async () => {
    const { raiz, servidor } = await abrirDetalhe({ escrever: () => json({ ...CARTEIRA, nome: 'Longo prazo' }) });

    fireEvent.click(raiz.querySelector('[data-renomear]')!);
    fireEvent.change(raiz.querySelector('[data-campo-nome]')!, { target: { value: 'Longo prazo' } });
    fireEvent.click(raiz.querySelector('[data-salvar-nome]')!);

    await waitFor(() => expect(raiz.querySelector('h1')?.textContent).toBe('Longo prazo'));
    const [renomeacao] = servidor.para('/carteiras/9').filter((c) => c.metodo !== 'GET');
    expect(renomeacao.metodo).toBe('PATCH');
    expect(renomeacao.corpo).toEqual({ nome: 'Longo prazo' });
    expect(raiz.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(raiz.querySelector('[data-realizado]')?.textContent).toContain('320,75');
    expect(raiz.querySelector('[data-posicao="PETR4"]')).toBeTruthy();
    expect(raiz.querySelector('[data-encerrada="VALE3"]')).toBeTruthy();
    expect(raiz.querySelector('[data-movimentacao="1"]')).toBeTruthy();
    // Nada foi relido: renomear não mexe nos números.
    expect(servidor.para('/posicoes')).toHaveLength(1);
  });

  it('@spec:AC-117 excluir pede confirmação simples com a consequência descrita', async () => {
    const { raiz, servidor } = await abrirDetalhe();

    fireEvent.click(raiz.querySelector('[data-excluir-carteira]')!);

    const caixa = await esperarElemento(dialogo);
    expect(caixa.textContent).toMatch(/não há como desfazer/i);
    expect(caixa.querySelectorAll('button')).toHaveLength(2);
    expect(caixa.querySelectorAll('input')).toHaveLength(0);
    expect(servidor.chamadas.some((c) => c.metodo === 'DELETE')).toBe(false);
  });

  async function recusarExclusaoComCar002() {
    const tela = await abrirDetalhe({ escrever: () => erroPadrao('CAR-002', 409) });
    fireEvent.click(tela.raiz.querySelector('[data-excluir-carteira]')!);
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));
    await esperarElemento(() => tela.raiz.querySelector('[data-nivel="erro"]'));
    return tela;
  }

  it('@spec:AC-118 CAR-002 cancela a exclusão com a mensagem acionável', async () => {
    const { raiz } = await recusarExclusaoComCar002();

    expect(raiz.querySelector('[data-nivel="erro"]')?.textContent).toContain(
      'Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la.',
    );
    expect(raiz.querySelector('[data-cabecalho]')?.textContent).toContain('Dividendos');
    await waitFor(() => expect(dialogo()).toBeNull());
  });

  it('@spec:AC-120 CAR-002 não sugere que a carteira seja de outro investidor', async () => {
    const { raiz } = await recusarExclusaoComCar002();
    expect(raiz.textContent).not.toMatch(NAO_REVELA);
  });

  it('@spec:AC-120 carteira que não aparece na listagem devolve à lista com "Carteira não encontrada."', async () => {
    const { caminho } = await abrirDetalhe({ carteiras: [] }, false);

    await waitFor(() => expect(caminho()).toBe('/carteiras'));
    const mensagens = feedback.mensagens().map((m) => m.texto);
    expect(mensagens).toContain('Carteira não encontrada.');
    expect(mensagens.join(' ')).not.toMatch(NAO_REVELA);
  });

  it('@spec:AC-120 CAR-001 vindo do servidor devolve à lista sem revelar de quem é a carteira', async () => {
    const { caminho } = await abrirDetalhe({ falhaDoConteudo: () => erroPadrao('CAR-001', 404) }, false);

    await waitFor(() => expect(caminho()).toBe('/carteiras'));
    const mensagens = feedback.mensagens().map((m) => m.texto);
    // Três leituras recusaram ao mesmo tempo, e a saída é uma só.
    expect(mensagens.filter((texto) => texto === 'Carteira não encontrada.')).toHaveLength(1);
    expect(mensagens.join(' ')).not.toMatch(NAO_REVELA);
  });
});

describe('Correção de operações pelo detalhe da carteira', () => {
  const botaoDa = (raiz: HTMLElement, acao: string) => raiz.querySelector(`[data-movimentacoes] [data-movimentacao="1"] [data-${acao}] button`)!;

  it('@spec:AC-178 editar pela carteira relê posições, consolidado, resultado e movimentações', async () => {
    const cenario: Cenario = { escrever: () => json({ id: 1, quantidade: 50, avisos: [] }) };
    const { raiz, servidor } = await abrirDetalhe(cenario);

    fireEvent.click(botaoDa(raiz, 'editar'));
    expect(raiz.querySelector('[data-edicao]')).toBeTruthy();
    fireEvent.change(raiz.querySelector('[data-campo-quantidade]')!, { target: { value: '50' } });
    fireEvent.click(raiz.querySelector('[data-salvar]')!);
    Object.assign(cenario, {
      posicoes: [{ ...PETR4, quantidade: 50, rentabilidadeNaoRealizada: 125 }],
      lucro: { total: 999, porTicker: { PETR4: 999 } },
      itens: [{ ...MOVIMENTACAO, quantidade: 50 }],
    });
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));

    await waitFor(() => expect(raiz.querySelector('[data-realizado]')?.textContent).toContain('999,00'));
    const [alteracao] = servidor.para('/operacoes/1');
    expect(alteracao.metodo).toBe('PUT');
    expect(alteracao.corpo).toEqual({ quantidade: 50 });
    await waitFor(() => expect(raiz.querySelector('[data-movimentacao="1"]')?.textContent).toContain('50'));
    expect(raiz.querySelector('[data-posicao="PETR4"] [data-quantidade]')?.textContent).toBe('50');
    expect(raiz.querySelector('[data-edicao]')).toBeNull();
    expect(servidor.para('/consolidado')).toHaveLength(2);
  });

  it('@spec:AC-181 excluir pela carteira relê os números recalculados sem recarga manual', async () => {
    const cenario: Cenario = {};
    const { raiz, servidor } = await abrirDetalhe(cenario);

    fireEvent.click(botaoDa(raiz, 'excluir'));
    Object.assign(cenario, { posicoes: [], lucro: { total: 0, porTicker: {} }, itens: [] });
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));

    await waitFor(() => expect(raiz.querySelector('[data-movimentacao="1"]')).toBeNull());
    expect(servidor.para('/operacoes/1')[0].metodo).toBe('DELETE');
    await waitFor(() => expect(raiz.querySelector('[data-sem-posicao]')).toBeTruthy());
    expect(raiz.querySelector('[data-realizado]')?.textContent).toContain('0,00');
  });

  it('@spec:AC-181 a exclusão pela carteira pede confirmação com o aviso de recálculo', async () => {
    const { raiz, servidor } = await abrirDetalhe();

    fireEvent.click(botaoDa(raiz, 'excluir'));

    const caixa = await esperarElemento(dialogo);
    expect(caixa.textContent).toContain('recalcular a posição e o resultado da carteira');
    expect(caixa.textContent).toContain('Não há como desfazer');
    expect(servidor.para('/operacoes/1')).toHaveLength(0);
  });
});

const minutosAtras = (minutos: number) => new Date(Date.now() - minutos * 60_000).toISOString();

function montarPosicoes(posicoes: Posicao[], porTicker: Record<string, number> = {}, carregando = false) {
  return montarEm({ '/': <PosicoesCarteira posicoes={posicoes} lucroPorTicker={porTicker} carregando={carregando} /> }, '/').raiz;
}

describe('Posições da carteira', () => {
  const recente = { ...PETR4, dataHoraCotacao: minutosAtras(2) };

  it('@spec:AC-106 cada posição traz ticker, empresa, quantidade, preço médio e cotação com horário', () => {
    const linha = montarPosicoes([recente]).querySelector('[data-posicao="PETR4"]') as HTMLElement;

    expect(linha.textContent).toContain('PETR4');
    expect(linha.textContent).toContain('Petróleo Brasileiro S.A.');
    expect(linha.querySelector('[data-quantidade]')?.textContent).toContain('100');
    expect(linha.querySelector('[data-preco-medio]')?.textContent).toContain('10,00');
    const cotacao = linha.querySelector('[data-cotacao] [data-valor-com-horario]') as HTMLElement;
    expect(cotacao.querySelector('[data-numero]')?.textContent).toContain('12,50');
    expect(cotacao.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-107 a rentabilidade não realizada aparece em valor e em percentual', () => {
    const linha = montarPosicoes([recente]).querySelector('[data-posicao="PETR4"]') as HTMLElement;

    expect(linha.querySelector('[data-rentabilidade-valor]')?.textContent).toContain('250,00');
    expect(linha.querySelector('[data-rentabilidade-percentual]')?.textContent).toContain('25,00%');
    expect(linha.querySelector('[data-rentabilidade-valor] [data-sinal]')?.textContent).toBe('▲');
  });

  it('@spec:AC-107 custo zero não inventa percentual', () => {
    const linha = montarPosicoes([{ ...recente, precoMedio: 0 }]).querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(linha.querySelector('[data-rentabilidade-percentual]')).toBeNull();
  });

  it('@spec:AC-108 só a cotação com mais de 15 minutos aparece marcada', () => {
    const raiz = montarPosicoes([recente, { ...PETR4, id: 2, ticker: 'VALE3', dataHoraCotacao: minutosAtras(40) }]);

    const nova = raiz.querySelector('[data-posicao="PETR4"] [data-valor-com-horario]');
    const velha = raiz.querySelector('[data-posicao="VALE3"] [data-valor-com-horario]');
    expect(nova?.getAttribute('data-defasado')).toBe('false');
    expect(nova?.querySelector('[data-marcacao-defasado]')).toBeNull();
    expect(velha?.getAttribute('data-defasado')).toBe('true');
    expect(velha?.querySelector('[data-marcacao-defasado]')?.textContent?.trim()).toBeTruthy();
  });

  it('@spec:AC-109 a seção "Encerradas" lista os tickers com resultado realizado e sem posição aberta', () => {
    const raiz = montarPosicoes([recente], { PETR4: 120.5, VALE3: -40, MGLU3: 12.34 });

    const tickers = [...raiz.querySelectorAll('[data-encerradas] [data-encerrada]')].map((l) => l.getAttribute('data-encerrada'));
    expect(tickers).toEqual(['VALE3', 'MGLU3']);
  });

  it('@spec:AC-110 sem ativo encerrado a seção não aparece', () => {
    const raiz = montarPosicoes([recente], { PETR4: 120.5 });

    expect(raiz.querySelector('[data-encerradas]')).toBeNull();
    expect(raiz.textContent).not.toMatch(/encerrada/i);
  });

  it('@spec:AC-111 a encerrada mostra ticker e resultado, e nada de posição', () => {
    const linha = montarPosicoes([], { VALE3: -40 }).querySelector('[data-encerrada="VALE3"]') as HTMLElement;

    expect(linha.textContent).toContain('VALE3');
    expect(linha.querySelector('[data-resultado-realizado]')?.textContent).toContain('40,00');
    for (const seletor of ['[data-quantidade]', '[data-preco-medio]', '[data-cotacao]']) expect(linha.querySelector(seletor)).toBeNull();
  });

  it('@spec:AC-244 as colunas numéricas ficam à direita, em fonte de largura fixa e com dígitos de mesma largura', () => {
    const linha = montarPosicoes([recente]).querySelector('[data-posicao="PETR4"]') as HTMLElement;

    // A regra visual mora na folha da tabela do kit (tabela.spec.tsx); aqui, que cada célula numérica a recebe.
    expect(linha.closest('table')?.classList.contains('tabela')).toBe(true);
    for (const seletor of ['[data-quantidade]', '[data-preco-medio]', '[data-cotacao]', '[data-rentabilidade-valor]', '[data-rentabilidade-percentual]']) {
      const celula = linha.querySelector(seletor) as HTMLElement;
      expect(celula.tagName).toBe('TD');
      expect(celula.hasAttribute('data-numero')).toBe(true);
    }
  });

  it('@spec:AC-246 o resultado de uma encerrada vira selo com texto e símbolo, nunca só cor', () => {
    const raiz = montarPosicoes([], { VALE3: -40, MGLU3: 12.34 });

    const perda = raiz.querySelector('[data-encerrada="VALE3"] [data-resultado-realizado] [data-selo]') as HTMLElement;
    expect(perda.textContent).toContain('40,00');
    expect(perda.getAttribute('data-variante')).toBe('baixa');
    expect(perda.querySelector('svg[data-icone]')).toBeTruthy();
    expect(raiz.querySelector('[data-encerrada="MGLU3"] [data-selo]')?.getAttribute('data-variante')).toBe('alta');
  });

  it('@spec:AC-247 cada linha de ativo traz o monograma junto do ticker', () => {
    const raiz = montarPosicoes([recente], { VALE3: -40 });

    const aberta = raiz.querySelector('[data-posicao="PETR4"]') as HTMLElement;
    expect(aberta.querySelector('[data-monograma]')?.getAttribute('aria-label')).toContain('PETR4');
    expect(aberta.querySelector('strong')?.textContent).toContain('PETR4');
    expect(raiz.querySelector('[data-encerrada="VALE3"] [data-monograma]')?.getAttribute('aria-label')).toContain('VALE3');
  });

  it('@spec:AC-250 sem posições a tabela dá lugar a um estado vazio com próximo passo', () => {
    const raiz = montarPosicoes([]);

    expect(raiz.querySelector('table')).toBeNull();
    const vazio = raiz.querySelector('[data-sem-posicao]') as HTMLElement;
    expect(vazio.textContent?.trim()).toBeTruthy();
    expect(vazio.querySelector('[data-proximo-passo]')?.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-250 enquanto carrega a tabela mostra o esqueleto com a silhueta das linhas', () => {
    const raiz = montarPosicoes([], {}, true);

    expect(raiz.querySelector('[data-sem-posicao]')).toBeNull();
    const esqueleto = raiz.querySelector('[data-carregando-posicoes] [data-esqueleto]') as HTMLElement;
    expect(esqueleto.getAttribute('data-formato')).toBe('tabela');
    expect(esqueleto.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(esqueleto.getAttribute('aria-hidden')).toBe('true');
  });
});

const ITENS = [
  { id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA', ticker: 'PETR4', quantidade: 100, precoUnitario: 10, valorTotal: 1000, moeda: 'BRL' as const },
  { id: 2, carteiraId: 4, dataHora: '2026-09-08T10:00:00', tipo: 'VENDA', ticker: 'VALE3' },
  { id: 3, carteiraId: 9, dataHora: '2026-09-07T10:00:00', tipo: 'VENDA', ticker: 'MGLU3' },
];
const COMPLETO: ExtratoBuscado = { itens: ITENS, totalNoServidor: 3, buscadas: 3 };

function montarMovimentacoes(extrato: ExtratoBuscado, carregando = false) {
  const nada = () => undefined;
  return montarEm({ '/': <MovimentacoesCarteira extrato={extrato} carteiraId={9} carregando={carregando} aoEditar={nada} aoExcluir={nada} /> }, '/').raiz;
}

describe('Movimentações da carteira na tela', () => {
  it('@spec:AC-112 mostra apenas as operações desta carteira', () => {
    const raiz = montarMovimentacoes(COMPLETO);

    expect([...raiz.querySelectorAll('[data-movimentacao]')].map((l) => l.getAttribute('data-movimentacao'))).toEqual(['1', '3']);
    expect(raiz.textContent).not.toContain('VALE3');
  });

  it('@spec:AC-113 extrato maior do que o buscado é declarado como recorte parcial', () => {
    const aviso = montarMovimentacoes({ itens: ITENS, totalNoServidor: 640, buscadas: 200 }).querySelector('[data-recorte-parcial]') as HTMLElement;

    expect(aviso.textContent).toContain('200');
    expect(aviso.textContent).toMatch(/mais recentes/i);
    expect(aviso.querySelector('a')?.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-114 extrato que coube inteiro não recebe aviso de recorte', () => {
    const raiz = montarMovimentacoes(COMPLETO);

    expect(raiz.querySelector('[data-recorte-parcial]')).toBeNull();
    expect(raiz.textContent).not.toMatch(/mais recentes/i);
  });

  it('@spec:AC-244 quantidade e total ficam à direita, em fonte de largura fixa e com dígitos de mesma largura', () => {
    const linha = montarMovimentacoes(COMPLETO).querySelector('[data-movimentacao="1"]') as HTMLElement;

    expect(linha.closest('table')?.classList.contains('tabela')).toBe(true);
    const numericas = [...linha.querySelectorAll('td[data-numero]')].map((td) => td.textContent);
    expect(numericas).toHaveLength(2);
    expect(numericas.some((texto) => texto?.includes('100'))).toBe(true);
    expect(numericas.some((texto) => texto?.includes('1.000,00'))).toBe(true);
  });

  it('@spec:AC-246 o tipo da operação vira selo com texto e símbolo, nunca só cor', () => {
    const raiz = montarMovimentacoes(COMPLETO);

    const compra = raiz.querySelector('[data-movimentacao="1"] [data-selo]') as HTMLElement;
    expect(compra.getAttribute('data-variante')).toBe('alta');
    expect(compra.textContent).toContain('COMPRA');
    expect(compra.querySelector('svg[data-icone]')).toBeTruthy();
    const venda = raiz.querySelector('[data-movimentacao="3"] [data-selo]') as HTMLElement;
    expect(venda.getAttribute('data-variante')).toBe('baixa');
    expect(venda.textContent).toContain('VENDA');
  });

  it('@spec:AC-247 a linha com ativo traz o monograma junto do ticker', () => {
    const linha = montarMovimentacoes(COMPLETO).querySelector('[data-movimentacao="1"]') as HTMLElement;

    expect(linha.querySelector('[data-monograma]')?.getAttribute('aria-label')).toContain('PETR4');
    expect(linha.querySelector('strong')?.textContent).toContain('PETR4');
  });

  it('@spec:AC-250 sem movimentações a tabela dá lugar a um estado vazio com próximo passo', () => {
    const raiz = montarMovimentacoes({ itens: [], totalNoServidor: 0, buscadas: 0 });

    expect(raiz.querySelector('table')).toBeNull();
    expect(raiz.querySelector('[data-sem-movimentacao] [data-proximo-passo]')?.getAttribute('href')).toContain('/operacoes');
  });

  it('@spec:AC-250 enquanto carrega mostra o esqueleto com a silhueta das linhas', () => {
    const raiz = montarMovimentacoes({ itens: [], totalNoServidor: 0, buscadas: 0 }, true);

    expect(raiz.querySelector('[data-sem-movimentacao]')).toBeNull();
    const esqueleto = raiz.querySelector('[data-carregando-movimentacoes] [data-esqueleto]') as HTMLElement;
    expect(esqueleto.getAttribute('data-formato')).toBe('tabela');
    expect(esqueleto.querySelectorAll('[data-linha]').length).toBeGreaterThan(1);
    expect(esqueleto.getAttribute('aria-hidden')).toBe('true');
  });
});
