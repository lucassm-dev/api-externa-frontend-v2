import { situacaoLegivel } from './corretoras.model';

describe('Situação cadastral legível', () => {
  it('@spec:AC-389 o código da Receita aparece pelo nome', () => {
    expect(['1', '2', '3', '4', '8'].map(situacaoLegivel)).toEqual(['Nula', 'Ativa', 'Suspensa', 'Inapta', 'Baixada']);
    expect(situacaoLegivel(' 2 ')).toBe('Ativa');
  });

  it('@spec:AC-390 situação por extenso ou código desconhecido aparece como veio', () => {
    expect(situacaoLegivel('ATIVA')).toBe('ATIVA');
    expect(situacaoLegivel('9')).toBe('9');
    expect(situacaoLegivel(null)).toBeNull();
  });
});
