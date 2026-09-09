import { ConsolidadoDaCarteira, LucroRealizado } from '../carteiras/carteiras.model';
import { resultadosDaCarteira } from './resultados';

const consolidado: ConsolidadoDaCarteira = {
  valorInvestido: 10_000,
  valorDeMercado: 12_000,
  lucroNaoRealizado: 2000,
  taxaCambioAtual: 5.4,
  dataHoraTaxaCambio: new Date().toISOString(),
  avisos: [],
};

const realizado: LucroRealizado = { total: 500, porTicker: { PETR4: 500 } };

describe('Os quatro números da carteira', () => {
  it('@spec:AC-183 traz investido, valor de mercado, não realizado e realizado', () => {
    const numeros = resultadosDaCarteira(consolidado, realizado);

    expect(numeros.valorInvestido).toBe(10_000);
    expect(numeros.valorDeMercado).toBe(12_000);
    expect(numeros.naoRealizado).toBe(2000);
    expect(numeros.realizado).toBe(500);
  });

  it('@spec:AC-184 realizado e não realizado ficam separados e nenhum campo os soma', () => {
    const numeros = resultadosDaCarteira(consolidado, realizado);
    const somaProibida = numeros.naoRealizado + (numeros.realizado ?? 0);

    expect(numeros.naoRealizado).not.toBe(somaProibida);
    expect(Object.values(numeros)).not.toContain(somaProibida);
  });

  it('@spec:AC-185 cada resultado traz o percentual sobre o investido', () => {
    const numeros = resultadosDaCarteira(consolidado, realizado);

    expect(numeros.naoRealizadoPercentual).toBeCloseTo(20, 6);
    expect(numeros.realizadoPercentual).toBeCloseTo(5, 6);
  });

  it('@spec:AC-186 investido zero não produz percentual, infinito nem NaN', () => {
    const numeros = resultadosDaCarteira(
      { ...consolidado, valorInvestido: 0, valorDeMercado: 0, lucroNaoRealizado: 0 },
      { total: 0, porTicker: {} },
    );

    expect(numeros.naoRealizadoPercentual).toBeNull();
    expect(numeros.realizadoPercentual).toBeNull();
  });

  it('@spec:AC-184 leitura do realizado que falhou é nula, nunca zero apurado', () => {
    const numeros = resultadosDaCarteira(consolidado, null);

    expect(numeros.realizado).toBeNull();
    expect(numeros.realizadoPercentual).toBeNull();
  });
});
