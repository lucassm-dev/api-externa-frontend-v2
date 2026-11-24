import { setoresDaRosca } from './setores-da-rosca';

describe('Geometria dos setores da rosca', () => {
  it('@spec:AC-259 desenha uma fatia única de 100% como volta completa, sem arco degenerado', () => {
    const [setor] = setoresDaRosca([100]);

    expect(setor.participacaoNormalizada).toBe(100);
    expect(setor.caminho.match(/\bA\b/g)).toHaveLength(4);
    expect(setor.caminho).not.toMatch(/NaN|Infinity/);
  });

  it('@spec:AC-259 preserva fatias muito pequenas como setores válidos', () => {
    const setores = setoresDaRosca([99.999, 0.001]);

    expect(setores).toHaveLength(2);
    expect(setores[1].participacaoNormalizada).toBeCloseTo(0.001, 6);
    expect(setores[1].caminho).toMatch(/^M .* A .* L .* A .* Z$/);
    expect(setores[1].caminho).not.toMatch(/NaN|Infinity/);
  });

  it('@spec:AC-259 normaliza a geometria quando a soma informada não fecha em 100%', () => {
    const setores = setoresDaRosca([40, 40]);

    expect(setores.map((setor) => setor.participacaoNormalizada)).toEqual([50, 50]);
    expect(setores[1].caminho).toContain('60 8');
  });

  it('@spec:AC-259 ignora participações inválidas ou não positivas sem contaminar o SVG', () => {
    const setores = setoresDaRosca([0, -5, Number.NaN, 25]);

    expect(setores).toHaveLength(1);
    expect(setores[0].indice).toBe(3);
    expect(setores[0].caminho).not.toMatch(/NaN|Infinity/);
  });
});
