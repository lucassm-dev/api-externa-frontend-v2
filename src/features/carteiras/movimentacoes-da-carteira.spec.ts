import { ExtratoBuscado } from './carteiras.model';
import { recortarPorCarteira } from './movimentacoes-da-carteira';

function extrato(parcial: boolean): ExtratoBuscado {
  const itens = [
    { id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA' },
    { id: 2, carteiraId: 4, dataHora: '2026-09-08T10:00:00', tipo: 'VENDA' },
    { id: 3, carteiraId: 9, dataHora: '2026-09-07T10:00:00', tipo: 'VENDA' },
  ];
  return { itens, totalNoServidor: parcial ? 640 : itens.length, buscadas: itens.length };
}

describe('Movimentações da carteira', () => {
  it('@spec:AC-112 devolve apenas as operações da carteira aberta', () => {
    const recorte = recortarPorCarteira(extrato(false), 9);

    expect(recorte.movimentacoes.map((m) => m.id)).toEqual([1, 3]);
  });

  it('@spec:AC-113 extrato maior do que o buscado é marcado como recorte parcial', () => {
    const recorte = recortarPorCarteira(extrato(true), 9);

    expect(recorte.parcial).toBe(true);
    expect(recorte.buscadas).toBe(3);
  });

  it('@spec:AC-114 extrato que coube inteiro não é parcial', () => {
    expect(recortarPorCarteira(extrato(false), 9).parcial).toBe(false);
  });
});
