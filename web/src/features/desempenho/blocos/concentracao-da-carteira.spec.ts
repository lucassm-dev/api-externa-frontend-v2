import { concentracaoDaCarteira } from './concentracao-da-carteira';

describe('Concentração da carteira', () => {
  it('@spec:AC-279 a fatia dos três maiores ativos é a soma deles sobre o total', () => {
    const c = concentracaoDaCarteira([50, 30, 10, 5, 5])!;

    expect(c.ativosNoTopo).toBe(3);
    expect(c.totalAtivos).toBe(5);
    expect(c.percentualTopo).toBeCloseTo(90, 6);
    expect(c.fracaoTopo).toBeCloseTo(0.9, 6);
  });

  it('@spec:AC-279 os três maiores são escolhidos por valor, não pela ordem de entrada', () => {
    const c = concentracaoDaCarteira([5, 100, 5, 80, 60, 5])!;

    // 100 + 80 + 60 = 240 sobre 255
    expect(c.percentualTopo).toBeCloseTo((240 / 255) * 100, 6);
    expect(c.ativosNoTopo).toBe(3);
  });

  it('@spec:AC-279 carteira com três ativos ou menos tem 100% no topo', () => {
    expect(concentracaoDaCarteira([10, 20, 30])!.percentualTopo).toBeCloseTo(100, 6);
    expect(concentracaoDaCarteira([42])!.percentualTopo).toBeCloseTo(100, 6);
  });

  it('@spec:AC-279 a faixa classifica a fatia do topo por limiares fixos', () => {
    // dez ativos iguais: topo = 30/100 => dispersa
    expect(
      concentracaoDaCarteira([10, 10, 10, 10, 10, 10, 10, 10, 10, 10])!.faixa,
    ).toBe('dispersa');
    // topo = 65/100 => media
    expect(concentracaoDaCarteira([30, 20, 15, 15, 10, 10])!.faixa).toBe('media');
    // topo = 85/100 => concentrada
    expect(concentracaoDaCarteira([40, 25, 15, 20])!.faixa).toBe('concentrada');
  });

  it('@spec:AC-279 valores não positivos ou não finitos não entram na conta', () => {
    const c = concentracaoDaCarteira([0, -5, Number.NaN, Number.POSITIVE_INFINITY, 60, 40])!;

    expect(c.totalAtivos).toBe(2);
    expect(c.percentualTopo).toBeCloseTo(100, 6);
  });

  it('@spec:AC-279 sem nenhum valor positivo não há o que medir', () => {
    expect(concentracaoDaCarteira([])).toBeNull();
    expect(concentracaoDaCarteira([0, -1, Number.NaN])).toBeNull();
  });
});
