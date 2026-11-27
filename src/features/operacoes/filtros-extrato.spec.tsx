import { waitFor } from '@testing-library/react';
import { montarEm } from '@/test/rotas';
import { json, simularServidor, type Chamada } from '@/test/servidor';
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
  // Os filtros saíram de Operações para os Relatórios (AC-400): aqui só o extrato recente.
  await waitFor(() => expect(tela.raiz.querySelector('[data-extrato]')).not.toBeNull());
  await waitFor(() => expect(leiturasDoExtrato(simulado.chamadas).length).toBeGreaterThan(0));
  return { ...tela, simulado };
}

const ultimaLeitura = (chamadas: Chamada[]) => parametros(leiturasDoExtrato(chamadas).at(-1)!);

describe('Recortar o extrato', () => {

  it('@spec:AC-341 sem filtro, a leitura leva só page e size', async () => {
    const { simulado } = await abrir();

    expect(Object.keys(ultimaLeitura(simulado.chamadas)).sort()).toEqual(['page', 'size']);
  });

  it('@spec:AC-345 o link do detalhe da carteira preenche o formulário e não filtra o extrato', async () => {
    const { simulado, raiz } = await abrir('/operacoes?carteira=9&tipo=VENDA');

    expect(Object.keys(ultimaLeitura(simulado.chamadas)).sort()).toEqual(['page', 'size']);
    expect(raiz.querySelector('[data-seletor-tipo] [data-tipo="VENDA"]')?.getAttribute('data-marcada')).toBe('sim');
    expect((raiz.querySelector('[data-campo-carteira] select, select[data-campo-carteira]') as HTMLSelectElement).value).toBe('9');
    expect(raiz.querySelector('[data-contagem-recorte]')).toBeNull();
  });
});

