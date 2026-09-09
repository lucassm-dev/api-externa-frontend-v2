import { OrdenacaoTabela } from './ordenacao';

interface Operacao {
  data: string;
  ticker: string;
  quantidade: number;
  resultado: number | null;
}

const pagina: readonly Operacao[] = [
  { data: '2026-02-10', ticker: 'PETR4', quantidade: 100, resultado: 250.5 },
  { data: '2026-01-05', ticker: 'VALE3', quantidade: 30, resultado: null },
  { data: '2026-03-01', ticker: 'ITUB4', quantidade: 100, resultado: -80 },
];

function ordenacao() {
  return new OrdenacaoTabela<Operacao>([
    { id: 'data', valor: (o) => o.data },
    { id: 'ticker', valor: (o) => o.ticker },
    { id: 'quantidade', valor: (o) => o.quantidade },
    { id: 'resultado', valor: (o) => o.resultado },
  ]);
}

describe('OrdenacaoTabela', () => {
  it('@spec:AC-242 uma coluna de dado se anuncia como ordenável e a coluna de ações não', () => {
    const ord = ordenacao();
    expect(ord.ordenavel('data')).toBe(true);
    expect(ord.ordenavel('quantidade')).toBe(true);
    expect(ord.ordenavel('acoes')).toBe(false);
  });

  it('@spec:AC-242 acionar o cabeçalho reordena as linhas da página e alterna crescente/decrescente', () => {
    const ord = ordenacao();

    ord.alternar('quantidade');
    expect(ord.estado()).toEqual({ coluna: 'quantidade', sentido: 'asc' });
    expect(ord.ordenar(pagina).map((o) => o.quantidade)).toEqual([30, 100, 100]);

    ord.alternar('quantidade');
    expect(ord.estado()).toEqual({ coluna: 'quantidade', sentido: 'desc' });
    expect(ord.ordenar(pagina).map((o) => o.quantidade)).toEqual([100, 100, 30]);

    ord.alternar('quantidade');
    expect(ord.estado().sentido).toBe('asc');
  });

  it('@spec:AC-242 o cabeçalho informa o sentido atual via aria-sort, inclusive ao trocar de coluna', () => {
    const ord = ordenacao();
    expect(ord.ariaSort('ticker')).toBe('none');

    ord.alternar('ticker');
    expect(ord.ariaSort('ticker')).toBe('ascending');

    ord.alternar('ticker');
    expect(ord.ariaSort('ticker')).toBe('descending');

    ord.alternar('data');
    expect(ord.ariaSort('data')).toBe('ascending');
    expect(ord.ariaSort('ticker')).toBe('none');
  });

  it('@spec:AC-243 ordena sobre os itens já carregados sem mutar o array da página', () => {
    const ord = ordenacao();
    const carregados: Operacao[] = [...pagina];
    const antes = carregados.slice();

    ord.alternar('data');
    const ordenados = ord.ordenar(carregados);

    expect(ordenados).not.toBe(carregados);
    expect(carregados).toEqual(antes);
    expect(ordenados.map((o) => o.data)).toEqual(['2026-01-05', '2026-02-10', '2026-03-01']);
  });

  it('@spec:AC-243 reordenar não busca de novo: mesmo conjunto de itens, só a ordem muda', () => {
    const ord = ordenacao();

    ord.alternar('ticker');
    const asc = ord.ordenar(pagina);
    ord.alternar('ticker');
    const desc = ord.ordenar(pagina);

    const tickersEmOrdem = pagina.map((o) => o.ticker).slice().sort();
    expect(asc.map((o) => o.ticker).slice().sort()).toEqual(tickersEmOrdem);
    expect(asc.length).toBe(pagina.length);
    expect(desc.length).toBe(pagina.length);
    expect(desc.map((o) => o.ticker)).toEqual(asc.map((o) => o.ticker).reverse());
  });
});
