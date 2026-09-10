import { BlocoDoMapa, blocosDoMapa } from './blocos-do-mapa';

function area(bloco: BlocoDoMapa): number {
  return bloco.retangulo.largura * bloco.retangulo.altura;
}

function coordenadas(blocos: BlocoDoMapa[]): number[] {
  return blocos.flatMap(({ retangulo }) => [
    retangulo.x,
    retangulo.y,
    retangulo.largura,
    retangulo.altura,
  ]);
}

describe('Geometria do mapa de blocos', () => {
  it('@spec:AC-276 uma posição única ocupa a área inteira', () => {
    const blocos = blocosDoMapa([1234.56]);

    expect(blocos).toHaveLength(1);
    expect(blocos[0].retangulo).toEqual({ x: 0, y: 0, largura: 100, altura: 100 });
    expect(blocos[0].indice).toBe(0);
  });

  it('@spec:AC-276 a área de cada bloco é proporcional ao valor de mercado', () => {
    const blocos = blocosDoMapa([6000, 3000, 1000]);
    const areaTotal = blocos.reduce((soma, bloco) => soma + area(bloco), 0);

    expect(areaTotal).toBeCloseTo(10_000, 6);
    expect(area(blocos.find((b) => b.indice === 0)!) / areaTotal).toBeCloseTo(0.6, 6);
    expect(area(blocos.find((b) => b.indice === 1)!) / areaTotal).toBeCloseTo(0.3, 6);
    expect(area(blocos.find((b) => b.indice === 2)!) / areaTotal).toBeCloseTo(0.1, 6);
  });

  it('@spec:AC-276 os blocos ladrilham a área sem sobra nem estouro', () => {
    const blocos = blocosDoMapa([50, 25, 15, 7, 3]);

    for (const { retangulo } of blocos) {
      expect(retangulo.x).toBeGreaterThanOrEqual(0);
      expect(retangulo.y).toBeGreaterThanOrEqual(0);
      expect(retangulo.x + retangulo.largura).toBeLessThanOrEqual(100 + 1e-6);
      expect(retangulo.y + retangulo.altura).toBeLessThanOrEqual(100 + 1e-6);
      expect(retangulo.largura).toBeGreaterThan(0);
      expect(retangulo.altura).toBeGreaterThan(0);
    }

    const areaTotal = blocos.reduce((soma, bloco) => soma + area(bloco), 0);
    expect(areaTotal).toBeCloseTo(10_000, 4);
  });

  it('@spec:AC-276 o maior valor recebe o maior bloco', () => {
    const blocos = blocosDoMapa([10, 80, 10]);
    const maior = [...blocos].sort((a, b) => area(b) - area(a))[0];

    expect(maior.indice).toBe(1);
    expect(area(maior) / 10_000).toBeCloseTo(0.8, 6);
  });

  it('@spec:AC-281 pesos não positivos ou não finitos não viram bloco nem coordenada inválida', () => {
    const blocos = blocosDoMapa([0, -5, Number.NaN, Number.POSITIVE_INFINITY, 40, 60]);

    expect(blocos.map((b) => b.indice).sort()).toEqual([4, 5]);
    expect(coordenadas(blocos).every((valor) => Number.isFinite(valor))).toBe(true);
  });

  it('@spec:AC-276 sem peso positivo nenhum não há bloco', () => {
    expect(blocosDoMapa([])).toEqual([]);
    expect(blocosDoMapa([0, -1, Number.NaN])).toEqual([]);
  });

  it('@spec:AC-276 respeita a área recebida', () => {
    const blocos = blocosDoMapa([1, 1], { x: 10, y: 20, largura: 40, altura: 80 });
    const areaTotal = blocos.reduce((soma, bloco) => soma + area(bloco), 0);

    expect(areaTotal).toBeCloseTo(40 * 80, 6);
    for (const { retangulo } of blocos) {
      expect(retangulo.x).toBeGreaterThanOrEqual(10);
      expect(retangulo.y).toBeGreaterThanOrEqual(20);
      expect(retangulo.x + retangulo.largura).toBeLessThanOrEqual(50 + 1e-6);
      expect(retangulo.y + retangulo.altura).toBeLessThanOrEqual(100 + 1e-6);
    }
  });
});
