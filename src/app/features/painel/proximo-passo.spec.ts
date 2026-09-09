import { decidirProximoPasso } from './proximo-passo';

describe('O próximo passo único do painel', () => {
  it('@spec:AC-060 catálogo de corretoras vazio pede o cadastro de corretora', () => {
    const passo = decidirProximoPasso({
      catalogoTemCorretora: false,
      temCarteira: false,
      temOperacao: false,
    });

    expect(passo?.id).toBe('cadastrar-corretora');
    expect(passo?.rota).toBe('/corretoras');
  });

  it('@spec:AC-060 a pergunta é do catálogo, não do investidor: com carteira e sem corretora no catálogo o passo continua sendo cadastrar corretora', () => {
    const passo = decidirProximoPasso({
      catalogoTemCorretora: false,
      temCarteira: true,
      temOperacao: true,
    });

    expect(passo?.id).toBe('cadastrar-corretora');
  });

  it('@spec:AC-061 com corretora no catálogo e sem carteira, o passo é criar carteira', () => {
    const passo = decidirProximoPasso({
      catalogoTemCorretora: true,
      temCarteira: false,
      temOperacao: false,
    });

    expect(passo?.id).toBe('criar-carteira');
  });

  it('@spec:AC-062 com carteira e sem operação, o passo é registrar a primeira compra', () => {
    const passo = decidirProximoPasso({
      catalogoTemCorretora: true,
      temCarteira: true,
      temOperacao: false,
    });

    expect(passo?.id).toBe('registrar-compra');
  });

  it('@spec:AC-063 com corretora, carteira e operação não sobra passo nenhum', () => {
    const passo = decidirProximoPasso({
      catalogoTemCorretora: true,
      temCarteira: true,
      temOperacao: true,
    });

    expect(passo).toBeNull();
  });

  it('@spec:AC-063 estado desconhecido não vira passo inventado', () => {
    expect(
      decidirProximoPasso({ catalogoTemCorretora: null, temCarteira: false, temOperacao: false }),
    ).toBeNull();
    expect(
      decidirProximoPasso({ catalogoTemCorretora: true, temCarteira: null, temOperacao: false }),
    ).toBeNull();
  });
});
