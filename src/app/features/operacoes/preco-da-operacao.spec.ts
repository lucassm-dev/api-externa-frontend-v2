import { estimarOperacao, precoManualTemCasasDemais } from './preco-da-operacao';

const AGORA = '2026-09-09T10:00:00';

describe('Preço da operação', () => {
  it('@spec:AC-165 a estimativa traz preço, total e o horário da cotação usada', () => {
    expect(estimarOperacao(32.5, AGORA, 100)).toEqual({
      precoUnitario: 32.5,
      valorTotal: 3250,
      obtidoEm: AGORA,
    });
  });

  it('@spec:AC-165 sem cotação, sem horário ou sem quantidade não há estimativa alguma', () => {
    expect(estimarOperacao(null, AGORA, 100)).toBeNull();
    expect(estimarOperacao(32.5, null, 100)).toBeNull();
    expect(estimarOperacao(32.5, AGORA, null)).toBeNull();
    expect(estimarOperacao(32.5, AGORA, 0)).toBeNull();
  });

  it('@spec:AC-164 preço com até duas casas decimais é aceito', () => {
    expect(precoManualTemCasasDemais(32)).toBe(false);
    expect(precoManualTemCasasDemais(32.5)).toBe(false);
    expect(precoManualTemCasasDemais(32.55)).toBe(false);
  });

  it('@spec:AC-164 preço com três casas ou mais é recusado antes de sair da tela', () => {
    expect(precoManualTemCasasDemais(32.555)).toBe(true);
    expect(precoManualTemCasasDemais(0.001)).toBe(true);
  });

  it('@spec:AC-164 preço ausente não é problema de casas decimais', () => {
    expect(precoManualTemCasasDemais(null)).toBe(false);
    expect(precoManualTemCasasDemais(undefined)).toBe(false);
  });
});
