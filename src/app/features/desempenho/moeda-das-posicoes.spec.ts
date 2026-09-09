import { Acao } from '../acoes/acoes.model';
import { mapaDeMoedas, moedaDe, paraReal } from './moeda-das-posicoes';

function acao(ticker: string, moeda: 'BRL' | 'USD'): Acao {
  return {
    id: 1,
    ticker,
    nomeEmpresa: ticker,
    mercado: moeda === 'BRL' ? 'BR' : 'US',
    moeda,
    cotacaoAtual: 10,
    dataHoraCotacao: new Date().toISOString(),
  };
}

describe('Moeda de cada posição', () => {
  const mapa = mapaDeMoedas([acao('PETR4', 'BRL'), acao('AAPL', 'USD')]);

  it('@spec:AC-193 converte a posição em dólar pela taxa de câmbio do consolidado', () => {
    const convertido = paraReal(100, moedaDe('AAPL', mapa), 5.4);

    expect(convertido.valor).toBeCloseTo(540, 6);
    expect(convertido.moedaOriginal).toBe('USD');
    expect(convertido.convertido).toBe(true);
  });

  it('@spec:AC-193 posição em real passa sem conversão nenhuma', () => {
    const convertido = paraReal(100, moedaDe('PETR4', mapa), 5.4);

    expect(convertido.valor).toBe(100);
    expect(convertido.convertido).toBe(true);
  });

  it('@spec:AC-193 ticker fora do catálogo fica com moeda desconhecida e não é convertido no escuro', () => {
    expect(moedaDe('XPTO3', mapa)).toBe('desconhecida');

    const convertido = paraReal(100, 'desconhecida', 5.4);
    expect(convertido.valor).toBe(100);
    expect(convertido.convertido).toBe(false);
  });

  it('@spec:AC-193 sem taxa utilizável o dólar não vira real fingido', () => {
    const convertido = paraReal(100, 'USD', 0);

    expect(convertido.valor).toBe(100);
    expect(convertido.convertido).toBe(false);
  });

  it('@spec:AC-199 o resultado não realizado em dólar também passa pela taxa', () => {
    const convertido = paraReal(-25, moedaDe('AAPL', mapa), 5.2);

    expect(convertido.valor).toBeCloseTo(-130, 6);
    expect(convertido.convertido).toBe(true);
  });
});
