import { contarCarteirasPorCorretora, rotuloDoSelo } from './selo-de-uso';

describe('Selo de uso', () => {
  it('@spec:AC-081 conta as carteiras do investidor por corretora', () => {
    const contagem = contarCarteirasPorCorretora([
      { corretoraId: 1 },
      { corretoraId: 1 },
      { corretoraId: 2 },
    ]);

    expect(contagem.get(1)).toBe(2);
    expect(contagem.get(2)).toBe(1);
    expect(contagem.get(3)).toBeUndefined();
  });

  it('@spec:AC-081 o rótulo concorda em número e some quando não há carteira', () => {
    expect(rotuloDoSelo(2)).toBe('2 carteiras suas');
    expect(rotuloDoSelo(1)).toBe('1 carteira sua');
    expect(rotuloDoSelo(0)).toBeNull();
    expect(rotuloDoSelo(undefined)).toBeNull();
  });
});
