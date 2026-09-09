import { percentualNaoRealizado } from './rentabilidade';

describe('Rentabilidade da posição', () => {
  it('@spec:AC-107 o percentual sai sobre o custo da posição', () => {
    expect(
      percentualNaoRealizado({ precoMedio: 10, quantidade: 100, rentabilidadeNaoRealizada: 250 }),
    ).toBeCloseTo(25);
  });

  it('@spec:AC-107 perda produz percentual negativo', () => {
    expect(
      percentualNaoRealizado({ precoMedio: 10, quantidade: 100, rentabilidadeNaoRealizada: -150 }),
    ).toBeCloseTo(-15);
  });

  it('@spec:AC-107 custo zero não produz percentual', () => {
    expect(
      percentualNaoRealizado({ precoMedio: 0, quantidade: 100, rentabilidadeNaoRealizada: 50 }),
    ).toBeNull();
  });
});
