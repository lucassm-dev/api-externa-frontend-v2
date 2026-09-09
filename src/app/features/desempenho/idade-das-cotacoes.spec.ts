import { Posicao } from '../carteiras/carteiras.model';
import { idadeDasCotacoes } from './idade-das-cotacoes';

const agora = new Date('2026-09-09T12:00:00Z');

function posicao(ticker: string, minutosAtras: number): Posicao {
  return {
    id: ticker.length,
    ticker,
    nomeEmpresa: `Empresa ${ticker}`,
    quantidade: 10,
    precoMedio: 10,
    cotacaoAtual: 12,
    dataHoraCotacao: new Date(agora.getTime() - minutosAtras * 60_000).toISOString(),
    rentabilidadeNaoRealizada: 0,
  };
}

describe('Idade das cotações da carteira', () => {
  it('@spec:AC-206 o horário exibido é o mais antigo entre as posições', () => {
    const idade = idadeDasCotacoes([posicao('PETR4', 2), posicao('VALE3', 40), posicao('AAPL', 9)], agora);

    expect(idade.maisAntiga).toBe(new Date(agora.getTime() - 40 * 60_000).toISOString());
  });

  it('@spec:AC-207 lista os tickers cuja cotação passou do limite de defasagem', () => {
    const idade = idadeDasCotacoes([posicao('PETR4', 2), posicao('VALE3', 40)], agora);

    expect(idade.tickersDefasados).toEqual(['VALE3']);
  });

  it('@spec:AC-206 sem posição não há horário: nulo, nunca a data de hoje', () => {
    const idade = idadeDasCotacoes([], agora);

    expect(idade.maisAntiga).toBeNull();
    expect(idade.tickersDefasados).toEqual([]);
  });
});
