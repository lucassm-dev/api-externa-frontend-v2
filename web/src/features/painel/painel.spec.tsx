import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Pagina } from '@/core/api/pagina';
import { json, simularServidor } from '@/test/servidor';
import { carteiraPreferida } from './carteira-preferida';
import { Painel } from './painel';
import { CarteiraResumida } from './painel.model';

function pagina<T>(itens: T[], total = itens.length): Pagina<T> {
  return { content: itens, totalElements: total, totalPages: 1, number: 0, size: 20 };
}

function carteira(id: number, nome: string): CarteiraResumida {
  return { id, investidorId: 1, corretoraId: 1, nomeCorretora: 'XP', mercado: 'BR', moeda: 'BRL', nome, ativa: true };
}

const BARRA = {
  itens: [{ simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.2, logoUrl: null }],
  atualizadoEm: new Date().toISOString(),
  avisos: [],
};

const CONSOLIDADO = {
  valorInvestido: 10_000,
  valorDeMercado: 11_000,
  lucroNaoRealizado: 1000,
  taxaCambioAtual: 5.4,
  dataHoraTaxaCambio: new Date().toISOString(),
  avisos: [],
};

interface Cenario {
  barraFalha?: boolean;
  temCorretora?: boolean;
  carteiras?: CarteiraResumida[];
  operacoes?: number;
}

/** Responde às cinco leituras do painel como o backend faria. */
function servidorDoPainel({ barraFalha = false, temCorretora = true, carteiras = [], operacoes = 0 }: Cenario) {
  return simularServidor(({ url }) => {
    if (url.startsWith('/mercado/barra-cotacoes')) return barraFalha ? json(null, 503) : json(BARRA);
    if (url.startsWith('/corretoras')) return json(pagina(temCorretora ? [{ id: 1 }] : [], temCorretora ? 1 : 0));
    if (/^\/carteiras\/\d+\/consolidado/.test(url)) return json(CONSOLIDADO);
    if (url.startsWith('/carteiras')) return json(pagina(carteiras));
    if (url.startsWith('/operacoes')) {
      return json(pagina(Array.from({ length: operacoes }, (_, i) => ({ id: i + 1, dataHora: new Date().toISOString(), tipo: 'COMPRA' }))));
    }
    return json(null, 404);
  });
}

function abrir() {
  return render(
    <MemoryRouter>
      <Painel />
    </MemoryRouter>,
  ).container;
}

async function abrirPronto(cenario: Cenario) {
  const servidor = servidorDoPainel(cenario);
  const elemento = abrir();
  await waitFor(() => expect(elemento.querySelector('[data-esqueleto-carteiras], [data-esqueleto-movimentacoes]')).toBeNull());
  if ((cenario.carteiras ?? []).length > 0) {
    await waitFor(() => expect(elemento.querySelector('[data-valor-investido]')).not.toBeNull());
  }
  return { elemento, servidor };
}

beforeEach(() => {
  // Cada teste é uma primeira visita: nenhuma carteira lembrada que exista.
  carteiraPreferida.lembrar(-1);
  localStorage.clear();
});
afterEach(() => vi.unstubAllGlobals());

describe('Painel inicial', () => {
  it('@spec:AC-065 enquanto as leituras não voltam a tela mostra esqueleto dos blocos, nunca um indicador de tela inteira', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const elemento = abrir();

    expect(elemento.querySelector('[data-esqueleto-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-esqueleto-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelector('[role="progressbar"]')).toBeNull();
    expect(elemento.querySelector('[data-proximo-passo]')).toBeNull();
  });

  it('@spec:AC-063 com corretora, carteira e operação o painel mostra consolidado, carteiras e movimentações, sem convite', async () => {
    const { elemento } = await abrirPronto({ carteiras: [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')], operacoes: 3 });

    expect(elemento.querySelector('[data-proximo-passo]')).toBeNull();
    expect(elemento.querySelector('[data-consolidado]')).not.toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelectorAll('[data-movimentacao]')).toHaveLength(3);
  });

  it('@spec:AC-064 com um próximo passo ativo o convite ocupa o corpo da tela e a barra de mercado continua', async () => {
    const { elemento } = await abrirPronto({ temCorretora: false, carteiras: [], operacoes: 0 });

    await waitFor(() => expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe('cadastrar-corretora'));
    expect(elemento.querySelector('[data-consolidado]')).toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).toBeNull();
    expect(elemento.querySelector('[data-barra-mercado]')).not.toBeNull();
  });

  it('@spec:AC-051 barra de mercado fora do ar não derruba o painel', async () => {
    const { elemento } = await abrirPronto({ barraFalha: true, carteiras: [carteira(9, 'Longo prazo')], operacoes: 2 });

    expect(elemento.querySelector('[data-barra-mercado]')).toBeNull();
    expect(elemento.querySelector('[data-consolidado]')).not.toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
  });

  it('@spec:AC-238 na composição da tela, o consolidado entra com o rótulo pequeno acima e o valor em destaque, com selo de variação no resultado', async () => {
    const { elemento } = await abrirPronto({ carteiras: [carteira(9, 'Longo prazo')], operacoes: 3 });

    const indicadores = [...elemento.querySelectorAll('[data-consolidado] [data-indicador]')];
    expect(indicadores).toHaveLength(3);
    for (const indicador of indicadores) {
      const rotulo = indicador.querySelector('[data-indicador-rotulo]')!;
      const valor = indicador.querySelector('[data-indicador-valor]')!;
      expect(rotulo.compareDocumentPosition(valor) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const resultado = elemento.querySelector('[data-consolidado] [data-lucro-nao-realizado]')!;
    expect(resultado.matches('[data-indicador-valor]')).toBe(true);
    expect(resultado.querySelector('[data-variacao]')).not.toBeNull();
    expect(elemento.querySelector('[data-consolidado] [data-selo-resultado] [data-selo]')).not.toBeNull();
  });

  it('@spec:AC-053 o consolidado é pedido só da carteira escolhida, uma por vez, sem somar nada', async () => {
    const { elemento, servidor } = await abrirPronto({ carteiras: [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')], operacoes: 1 });

    expect(servidor.chamadas.filter((c) => c.url.includes('/consolidado')).map((c) => c.url)).toEqual(['/carteiras/9/consolidado']);

    fireEvent.change(elemento.querySelector('[data-seletor-carteira]')!, { target: { value: '4' } });

    await waitFor(() => expect(servidor.para('/carteiras/4/consolidado')).toHaveLength(1));
    expect(servidor.chamadas.filter((c) => c.url.includes('/consolidado'))).toHaveLength(2);
  });

  it('@spec:AC-054 a carteira escolhida numa visita é a consolidada na visita seguinte', async () => {
    const carteiras = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')];
    const primeira = await abrirPronto({ carteiras, operacoes: 1 });
    fireEvent.change(primeira.elemento.querySelector('[data-seletor-carteira]')!, { target: { value: '4' } });
    await waitFor(() => expect(primeira.servidor.para('/carteiras/4/consolidado')).toHaveLength(1));
    cleanup();
    vi.unstubAllGlobals();

    // visita seguinte: o painel abre de novo, sem ninguém escolher nada
    const segunda = servidorDoPainel({ carteiras, operacoes: 0 });
    abrir();
    await waitFor(() => expect(segunda.chamadas.some((c) => c.url.includes('/consolidado'))).toBe(true));
    expect(segunda.chamadas.filter((c) => c.url.includes('/consolidado')).map((c) => c.url)).toEqual(['/carteiras/4/consolidado']);
  });

  it('@spec:AC-053 @spec:AC-309 trocar de carteira rápido nunca mostra o consolidado da anterior com o nome da nova (painel)', async () => {
    const carteiras = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')];
    const lento = { valorInvestido: 999, valorDeMercado: 999, lucroNaoRealizado: 0, taxaCambioAtual: 5, dataHoraTaxaCambio: new Date().toISOString(), avisos: [] };
    const servidor = simularServidor(({ url }) => {
      if (url === '/carteiras/9/consolidado') return servidor.segurar();
      if (url === '/carteiras/4/consolidado') return json(CONSOLIDADO);
      if (url.startsWith('/mercado')) return json(BARRA);
      if (url.startsWith('/corretoras')) return json(pagina([{ id: 1 }], 1));
      if (url.startsWith('/carteiras')) return json(pagina(carteiras));
      return json(pagina([{ id: 1, dataHora: new Date().toISOString(), tipo: 'COMPRA' }]));
    });
    const elemento = abrir();
    await waitFor(() => expect(servidor.para('/carteiras/9/consolidado')).toHaveLength(1));

    fireEvent.change(elemento.querySelector('[data-seletor-carteira]')!, { target: { value: '4' } });
    await waitFor(() => expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('10.000,00'));

    // a resposta atrasada da carteira 9 chega depois: a tela não muda
    servidor.liberar(json(lento));
    await new Promise((resolver) => setTimeout(resolver, 20));
    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('10.000,00');
  });
});
