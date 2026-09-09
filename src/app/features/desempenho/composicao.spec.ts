import { ConsolidadoDaCarteira, Posicao } from '../carteiras/carteiras.model';
import { composicaoDaCarteira } from './composicao';
import { MapaDeMoedas } from './moeda-das-posicoes';

function posicao(ticker: string, quantidade: number, cotacaoAtual: number): Posicao {
  return {
    id: ticker.length,
    ticker,
    nomeEmpresa: `Empresa ${ticker}`,
    quantidade,
    precoMedio: cotacaoAtual,
    cotacaoAtual,
    dataHoraCotacao: new Date().toISOString(),
    rentabilidadeNaoRealizada: 0,
  };
}

const mapa: MapaDeMoedas = { PETR4: 'BRL', VALE3: 'BRL', AAPL: 'USD' };

function consolidado(valorDeMercado: number): ConsolidadoDaCarteira {
  return {
    valorInvestido: valorDeMercado,
    valorDeMercado,
    lucroNaoRealizado: 0,
    taxaCambioAtual: 5,
    dataHoraTaxaCambio: new Date().toISOString(),
    avisos: [],
  };
}

describe('Composição da carteira', () => {
  it('@spec:AC-192 distribui o valor de mercado por ativo, da maior fatia à menor', () => {
    const posicoes = [posicao('VALE3', 10, 50), posicao('PETR4', 100, 30)];

    const composicao = composicaoDaCarteira(posicoes, mapa, consolidado(3500));

    expect(composicao.fatias.map((fatia) => fatia.ticker)).toEqual(['PETR4', 'VALE3']);
    expect(composicao.fatias[0].valor).toBe(3000);
    expect(composicao.fatias[0].participacao).toBeCloseTo(85.714, 2);
    expect(composicao.fatias[1].participacao).toBeCloseTo(14.286, 2);
  });

  it('@spec:AC-193 a posição em dólar entra convertida, nunca pelo número em dólar', () => {
    // 10 × US$ 20 = US$ 200 → R$ 1.000 à taxa 5.
    const composicao = composicaoDaCarteira([posicao('AAPL', 10, 20)], mapa, consolidado(1000));

    expect(composicao.fatias[0].valor).toBe(1000);
    expect(composicao.fatias[0].moedaOriginal).toBe('USD');
    expect(composicao.fatias[0].convertido).toBe(true);
  });

  it('@spec:AC-194 a soma das fatias bate com o valor de mercado, com moedas diferentes na mesma carteira', () => {
    // R$ 3.000 em PETR4 + US$ 200 × 5 = R$ 1.000 em AAPL → R$ 4.000.
    const posicoes = [posicao('PETR4', 100, 30), posicao('AAPL', 10, 20)];

    const composicao = composicaoDaCarteira(posicoes, mapa, consolidado(4000));

    expect(composicao.soma).toBeCloseTo(4000, 6);
    expect(composicao.diferenca).toBeCloseTo(0, 6);
    expect(composicao.fecha).toBe(true);
  });

  it('@spec:AC-194 ignorar a conversão faria a soma não bater — é o que a conferência pega', () => {
    const posicoes = [posicao('PETR4', 100, 30), posicao('AAPL', 10, 20)];
    const semConversao = { ...mapa, AAPL: 'BRL' as const };

    const errada = composicaoDaCarteira(posicoes, semConversao, consolidado(4000));

    expect(errada.soma).toBe(3200);
    expect(errada.fecha).toBe(false);
  });

  it('@spec:AC-195 moeda desconhecida não é convertida no escuro e a composição deixa de fechar', () => {
    const posicoes = [posicao('PETR4', 100, 30), posicao('XPTO3', 10, 20)];

    const composicao = composicaoDaCarteira(posicoes, mapa, consolidado(4000));

    const desconhecida = composicao.fatias.find((fatia) => fatia.ticker === 'XPTO3');
    expect(desconhecida?.moedaOriginal).toBe('desconhecida');
    expect(desconhecida?.convertido).toBe(false);
    expect(composicao.fecha).toBe(false);
    expect(composicao.diferenca).toBeCloseTo(-800, 6);
  });

  it('@spec:AC-196 ticker sem posição aberta não vira fatia nenhuma', () => {
    const composicao = composicaoDaCarteira(
      [posicao('PETR4', 100, 30), posicao('VALE3', 0, 50)],
      mapa,
      consolidado(3000),
    );

    expect(composicao.fatias.map((fatia) => fatia.ticker)).toEqual(['PETR4']);
  });
});
