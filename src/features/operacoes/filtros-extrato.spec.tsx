import { fireEvent, waitFor } from '@testing-library/react';
import { montarEm } from '@/test/rotas';
import { erroPadrao, json, simularServidor, type Chamada } from '@/test/servidor';
import { OperacaoDoExtrato } from './operacoes.model';
import { Operacoes } from './operacoes';

const CARTEIRAS = [{ id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true }];
const VENDA: OperacaoDoExtrato = { id: 1, carteiraId: 9, ticker: 'PETR4', tipo: 'VENDA', quantidade: 10, precoUnitario: 40, valorTotal: 400, dataHora: '2026-09-10T10:00:00', moeda: 'BRL', lucroRealizado: 50 };

const url = (chamada: Chamada) => new URL(chamada.url, 'http://localhost');
const leiturasDoExtrato = (chamadas: Chamada[]) => chamadas.filter((chamada) => url(chamada).pathname === '/operacoes' && chamada.metodo === 'GET');
const parametros = (chamada: Chamada) => Object.fromEntries(url(chamada).searchParams);

function servidor(responder?: (chamada: Chamada) => Response | undefined) {
  return simularServidor((chamada) => {
    const rota = url(chamada).pathname;
    if (rota === '/carteiras') return json({ content: CARTEIRAS, totalElements: 1, totalPages: 1, number: 0, size: 20 });
    if (rota === '/operacoes') {
      const especial = responder?.(chamada);
      if (especial) return especial;
      const numero = Number(url(chamada).searchParams.get('page'));
      return json({ content: [VENDA], totalElements: 41, totalPages: 3, number: numero, size: 20 });
    }
    return json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
  });
}

async function abrir(endereco = '/operacoes', responder?: (chamada: Chamada) => Response | undefined) {
  const simulado = servidor(responder);
  const tela = montarEm({ '/operacoes': <Operacoes /> }, endereco);
  const form = await waitFor(() => {
    const encontrado = tela.raiz.querySelector('[data-filtros-extrato]');
    if (!encontrado?.querySelector('select[name="carteiraId"] option[value="9"]')) throw new Error('sem filtros');
    return encontrado as HTMLFormElement;
  });
  await waitFor(() => expect(leiturasDoExtrato(simulado.chamadas).length).toBeGreaterThan(0));
  return { ...tela, simulado, form };
}

const preencher = (form: Element, campo: string, valor: string) =>
  fireEvent.change(form.querySelector(`[name="${campo}"]`)!, { target: { value: valor } });
const ultimaLeitura = (chamadas: Chamada[]) => parametros(leiturasDoExtrato(chamadas).at(-1)!);
const apoioDo = (form: Element, campo: string) => {
  const id = form.querySelector(`[name="${campo}"]`)?.getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? '') : '';
};

describe('Recortar o extrato', () => {
  it('@spec:AC-340 os filtros vão ao servidor, combinados, a partir da primeira página', async () => {
    const { form, simulado } = await abrir();

    preencher(form, 'dataInicio', '2026-09-01');
    preencher(form, 'dataFim', '2026-09-30');
    preencher(form, 'ticker', ' petr4 ');
    preencher(form, 'carteiraId', '9');
    preencher(form, 'tipoOperacao', 'VENDA');
    fireEvent.submit(form);

    await waitFor(() =>
      expect(ultimaLeitura(simulado.chamadas)).toEqual({
        page: '0',
        size: '20',
        dataInicio: '2026-09-01',
        dataFim: '2026-09-30',
        ticker: 'PETR4',
        carteiraId: '9',
        tipo: 'VENDA',
      }),
    );
  });

  it('@spec:AC-341 sem filtro, a leitura leva só page e size', async () => {
    const { simulado } = await abrir();

    expect(Object.keys(ultimaLeitura(simulado.chamadas)).sort()).toEqual(['page', 'size']);
  });

  it('@spec:AC-342 data final antes da inicial não sai; OPE-006 do servidor diz o mesmo', async () => {
    const { form, simulado } = await abrir();
    const antes = leiturasDoExtrato(simulado.chamadas).length;

    preencher(form, 'dataInicio', '2026-09-30');
    preencher(form, 'dataFim', '2026-09-01');
    fireEvent.submit(form);

    await waitFor(() => expect(apoioDo(form, 'dataFim')).toContain('não pode ser anterior à data inicial'));
    expect(leiturasDoExtrato(simulado.chamadas)).toHaveLength(antes);

    const recusado = await abrir('/operacoes?dataFim=2026-09-02', (chamada) =>
      url(chamada).searchParams.get('dataFim') ? erroPadrao('OPE-006', 422) : undefined,
    );
    await waitFor(() => expect(apoioDo(recusado.form, 'dataFim')).toContain('não pode ser anterior à data inicial'));
  });

  it('@spec:AC-343 o recorte vem do endereço, preenche os campos e acompanha a troca de página', async () => {
    const { form, simulado, raiz, roteador } = await abrir('/operacoes?ticker=PETR4&dataInicio=2026-09-01&resultado=LUCRO');

    expect((form.querySelector('[name="ticker"]') as HTMLInputElement).value).toBe('PETR4');
    expect((form.querySelector('[name="dataInicio"]') as HTMLInputElement).value).toBe('2026-09-01');
    expect(ultimaLeitura(simulado.chamadas)).toMatchObject({ page: '0', ticker: 'PETR4', dataInicio: '2026-09-01', resultado: 'LUCRO' });

    fireEvent.click(await waitFor(() => raiz.querySelector('[data-proxima]')!));
    await waitFor(() => expect(ultimaLeitura(simulado.chamadas)).toMatchObject({ page: '1', ticker: 'PETR4', resultado: 'LUCRO' }));

    preencher(form, 'ticker', 'VALE3');
    fireEvent.submit(form);
    await waitFor(() => expect(roteador.state.location.search).toContain('ticker=VALE3'));
  });

  it('@spec:AC-344 o recorte diz quantas achou; sem nada, "Limpar filtros" volta ao extrato completo', async () => {
    const { form, simulado, raiz, roteador } = await abrir('/operacoes?ticker=PETR4', (chamada) =>
      url(chamada).searchParams.get('ticker') === 'XXXX3' ? json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }) : undefined,
    );
    await waitFor(() => expect(raiz.querySelector('[data-contagem-recorte]')?.textContent).toContain('41 operações'));

    preencher(form, 'ticker', 'XXXX3');
    fireEvent.submit(form);
    const vazio = await waitFor(() => {
      const encontrado = raiz.querySelector('[data-extrato-vazio-recorte]');
      if (!encontrado) throw new Error('sem estado vazio do recorte');
      return encontrado;
    });
    fireEvent.click([...vazio.querySelectorAll('button')].find((botao) => botao.textContent?.includes('Limpar filtros'))!);

    await waitFor(() => expect(Object.keys(ultimaLeitura(simulado.chamadas)).sort()).toEqual(['page', 'size']));
    expect(roteador.state.location.search).toBe('');
  });

  it('@spec:AC-345 o link do detalhe da carteira preenche o formulário e não filtra o extrato', async () => {
    const { simulado, raiz } = await abrir('/operacoes?carteira=9&tipo=VENDA');

    expect(Object.keys(ultimaLeitura(simulado.chamadas)).sort()).toEqual(['page', 'size']);
    expect(raiz.querySelector('[data-seletor-tipo] [data-tipo="VENDA"]')?.getAttribute('data-marcada')).toBe('sim');
    expect((raiz.querySelector('[data-campo-carteira] select, select[data-campo-carteira]') as HTMLSelectElement).value).toBe('9');
    expect(raiz.querySelector('[data-contagem-recorte]')).toBeNull();
  });
});

describe('Lucro ou prejuízo', () => {
  it('@spec:AC-346 o resultado sai junto com os outros filtros', async () => {
    const { form, simulado } = await abrir();

    preencher(form, 'resultado', 'PREJUIZO');
    preencher(form, 'ticker', 'PETR4');
    fireEvent.submit(form);

    await waitFor(() => expect(ultimaLeitura(simulado.chamadas)).toMatchObject({ page: '0', resultado: 'PREJUIZO', ticker: 'PETR4' }));
  });

  it('@spec:AC-347 a dica do resultado explica que só vendas entram', async () => {
    const { form } = await abrir();

    expect(apoioDo(form, 'resultado')).toMatch(/lucro realizado.*só vendas/i);
  });
});
