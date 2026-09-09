import { readFileSync } from 'node:fs';

describe('Estilo base de tabela', () => {
  const estilo = readFileSync('src/app/shared/tabela/tabela.scss', 'utf8');

  it('@spec:AC-244 alinha as colunas numéricas à direita, em fonte de largura fixa e com dígitos de mesma largura', () => {
    const numerica = estilo.match(/td\[data-numero\][\s\S]*?\}/)?.[0] ?? '';
    expect(numerica).not.toBe('');
    expect(numerica).toMatch(/text-align:\s*right/);
    expect(numerica).toMatch(/font-family:\s*var\(--fonte-numero\)/);
    expect(numerica).toMatch(/font-variant-numeric:\s*[^;]*tabular-nums/);
  });

  it('@spec:AC-245 destaca a linha sob o ponteiro sem que o destaque seja a única forma de distingui-la', () => {
    const hover = estilo.match(/tbody tr:hover\s*\{[^}]*\}/)?.[0] ?? '';
    expect(hover).not.toBe('');
    expect(hover).toMatch(/(background|outline):/);

    // A zebra separa as linhas independentemente do ponteiro.
    expect(estilo).toMatch(/tbody tr:nth-child\((?:even|odd)\)\s*\{[^}]*background:/);
  });
});
