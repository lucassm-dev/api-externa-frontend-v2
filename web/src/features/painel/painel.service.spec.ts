import { Pagina } from '@/core/api/pagina';
import { json, simularServidor } from '@/test/servidor';
import { painelService } from './painel.service';

function pagina<T>(itens: T[], total = itens.length): Pagina<T> {
  return { content: itens, totalElements: total, totalPages: 1, number: 0, size: itens.length };
}

const parametros = (url: string) => new URL(url, 'http://localhost').searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('Leituras do painel', () => {
  it('@spec:AC-050 a barra de mercado vem inteira, com itens, horário e avisos', async () => {
    const corpo = {
      itens: [{ simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.2, logoUrl: null }],
      atualizadoEm: '2026-09-08T13:00:00Z',
      avisos: ['Cotação do dólar indisponível.'],
    };
    const servidor = simularServidor(() => json(corpo));

    const barra = await painelService.barraDeMercado();

    expect(servidor.para('/mercado/barra-cotacoes')[0].metodo).toBe('GET');
    expect(barra).toEqual(corpo);
  });

  it('@spec:AC-051 a barra fora do ar vira ausência de barra, não erro propagado', async () => {
    simularServidor(() => json(null, 503));

    await expect(painelService.barraDeMercado()).resolves.toBeNull();
  });

  it('@spec:AC-057 as carteiras são pedidas ordenadas por identificador decrescente', async () => {
    const servidor = simularServidor(() => json(pagina([{ id: 9, nome: 'Longo prazo' }, { id: 2, nome: 'Primeira' }])));

    const carteiras = await painelService.carteiras();

    const busca = parametros(servidor.para('/carteiras')[0].url);
    expect(busca.get('sort')).toBe('id,desc');
    expect(busca.get('page')).toBe('0');
    expect(carteiras.map((carteira) => carteira.id)).toEqual([9, 2]);
  });

  it('@spec:AC-053 o consolidado é pedido de uma carteira por vez, pelo identificador dela', async () => {
    const servidor = simularServidor(() =>
      json({ valorInvestido: 1000, valorDeMercado: 1100, lucroNaoRealizado: 100, taxaCambioAtual: 5.4, dataHoraTaxaCambio: '2026-09-08T13:00:00Z', avisos: [] }),
    );

    await painelService.consolidado(7);

    expect(servidor.chamadas.map((chamada) => [chamada.metodo, chamada.url])).toEqual([['GET', '/carteiras/7/consolidado']]);
  });

  it('@spec:AC-059 o painel pede cinco movimentações e nunca exibe mais que isso', async () => {
    const seis = Array.from({ length: 6 }, (_, indice) => ({ id: indice + 1, dataHora: '2026-09-08T13:00:00Z', tipo: 'COMPRA' }));
    const servidor = simularServidor(() => json(pagina(seis, 42)));

    const movimentacoes = await painelService.ultimasMovimentacoes();

    expect(parametros(servidor.para('/operacoes')[0].url).get('size')).toBe('5');
    expect(movimentacoes).toHaveLength(5);
  });

  it('@spec:AC-060 a sonda do catálogo pergunta se existe alguma corretora, sem trazer a lista', async () => {
    let resposta = json(pagina([], 0));
    const servidor = simularServidor(() => resposta);

    expect(await painelService.catalogoTemCorretora()).toBe(false);
    expect(parametros(servidor.para('/corretoras')[0].url).get('size')).toBe('1');

    resposta = json(pagina([{ id: 1 }], 1));
    expect(await painelService.catalogoTemCorretora()).toBe(true);
  });
});
