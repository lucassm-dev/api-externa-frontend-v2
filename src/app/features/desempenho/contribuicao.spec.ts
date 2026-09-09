import { Posicao } from '../carteiras/carteiras.model';
import { contribuicaoPorAtivo } from './contribuicao';
import { MapaDeMoedas } from './moeda-das-posicoes';

function posicao(ticker: string, rentabilidadeNaoRealizada: number): Posicao {
  return {
    id: ticker.length,
    ticker,
    nomeEmpresa: `Empresa ${ticker}`,
    quantidade: 10,
    precoMedio: 10,
    cotacaoAtual: 12,
    dataHoraCotacao: new Date().toISOString(),
    rentabilidadeNaoRealizada,
  };
}

const mapa: MapaDeMoedas = { PETR4: 'BRL', VALE3: 'BRL', AAPL: 'USD' };

describe('Contribuição por ativo', () => {
  it('@spec:AC-198 ordena do maior ganho à maior perda', () => {
    const barras = contribuicaoPorAtivo(
      [posicao('VALE3', -300), posicao('PETR4', 500), posicao('AAPL', 0)],
      { ...mapa, AAPL: 'BRL' },
      5,
    );

    expect(barras.map((barra) => barra.ticker)).toEqual(['PETR4', 'AAPL', 'VALE3']);
    expect(barras[0].valor).toBe(500);
    expect(barras[2].valor).toBe(-300);
  });

  it('@spec:AC-199 o resultado em dólar entra convertido pela taxa do consolidado', () => {
    const barras = contribuicaoPorAtivo([posicao('AAPL', 40)], mapa, 5);

    expect(barras[0].valor).toBe(200);
    expect(barras[0].convertido).toBe(true);
  });

  it('@spec:AC-199 sem conversão a ordem das barras sairia trocada', () => {
    const posicoes = [posicao('PETR4', 150), posicao('AAPL', 40)];

    const certa = contribuicaoPorAtivo(posicoes, mapa, 5);
    const errada = contribuicaoPorAtivo(posicoes, { ...mapa, AAPL: 'BRL' }, 5);

    expect(certa.map((barra) => barra.ticker)).toEqual(['AAPL', 'PETR4']);
    expect(errada.map((barra) => barra.ticker)).toEqual(['PETR4', 'AAPL']);
  });
});
