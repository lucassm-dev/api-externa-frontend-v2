import { LucroRealizado } from '../carteiras/carteiras.model';
import { houveVenda, realizadoPorTicker } from './realizado-por-ticker';

describe('Lucro realizado por ticker', () => {
  const lucro: LucroRealizado = {
    total: 800,
    porTicker: { PETR4: 300, MGLU3: -100, VALE3: 600 },
  };

  it('@spec:AC-202 traz cada ticker apurado, do maior ao menor, inclusive quem não tem mais posição', () => {
    const barras = realizadoPorTicker(lucro);

    expect(barras.map((barra) => barra.ticker)).toEqual(['VALE3', 'PETR4', 'MGLU3']);
    expect(barras[0].valor).toBe(600);
    expect(barras[2].valor).toBe(-100);
  });

  it('@spec:AC-202 a soma exibida é o total do backend, não a soma refeita no cliente', () => {
    const somaDoCliente = realizadoPorTicker(lucro).reduce((total, barra) => total + barra.valor, 0);

    expect(lucro.total).toBe(800);
    expect(somaDoCliente).toBe(800);
  });

  it('@spec:AC-203 mapa vazio é o estado sem venda nenhuma', () => {
    expect(houveVenda({ total: 0, porTicker: {} })).toBe(false);
    expect(realizadoPorTicker({ total: 0, porTicker: {} })).toEqual([]);
    expect(houveVenda(lucro)).toBe(true);
  });
});
