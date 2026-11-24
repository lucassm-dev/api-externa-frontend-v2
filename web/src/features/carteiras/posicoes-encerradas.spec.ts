import { posicoesEncerradas } from './posicoes-encerradas';

describe('Posições encerradas', () => {
  it('@spec:AC-109 lista os tickers com resultado realizado que não têm posição aberta', () => {
    const encerradas = posicoesEncerradas(
      { PETR4: 120.5, VALE3: -40, MGLU3: 12.34 },
      [{ ticker: 'PETR4' }],
    );

    expect(encerradas).toEqual([
      { ticker: 'VALE3', resultadoRealizado: -40 },
      { ticker: 'MGLU3', resultadoRealizado: 12.34 },
    ]);
  });

  it('@spec:AC-110 nenhum ticker encerrado quando todos ainda têm posição aberta', () => {
    expect(posicoesEncerradas({ PETR4: 10 }, [{ ticker: 'PETR4' }])).toEqual([]);
  });

  it('@spec:AC-110 resultado realizado ausente não inventa encerradas', () => {
    expect(posicoesEncerradas(undefined, [])).toEqual([]);
    expect(posicoesEncerradas({}, [])).toEqual([]);
  });

  it('@spec:AC-111 cada encerrada leva só ticker e resultado realizado', () => {
    const [encerrada] = posicoesEncerradas({ VALE3: 55 }, []);

    expect(Object.keys(encerrada).sort()).toEqual(['resultadoRealizado', 'ticker']);
  });
});
