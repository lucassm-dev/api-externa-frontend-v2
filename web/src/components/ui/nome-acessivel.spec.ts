import { globSync, readFileSync } from 'node:fs';

/** O texto da tag JSX a partir de `<input`/`<select`, até o `>` que a fecha (fora de `{…}`). */
function tagEm(fonte: string, inicio: number): string {
  let chaves = 0;
  for (let i = inicio; i < fonte.length; i++) {
    if (fonte[i] === '{') chaves++;
    else if (fonte[i] === '}') chaves--;
    else if (fonte[i] === '>' && chaves === 0) return fonte.slice(inicio, i + 1);
  }
  return fonte.slice(inicio);
}

/**
 * AC-231 no React: lido do código, sem montar tela. Pelo AC-303, campo só existe
 * no kit — então a varredura cobre todo .tsx, e o que ela acha mora no kit.
 */
describe('Nomes acessíveis declarados no código', () => {
  it('@spec:AC-231 todo input e select tem nome acessível verificável sem executar a tela', () => {
    const semNome: string[] = [];
    const arquivos = globSync('src/**/*.tsx').filter((caminho) => !caminho.endsWith('.spec.tsx'));

    for (const caminho of arquivos) {
      // Sem comentários: documentação que cita `<select>` não é campo.
      const fonte = readFileSync(caminho, 'utf8').replace(/\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm, '');
      for (const achado of fonte.matchAll(/<(input|select)\b/g)) {
        const tag = tagEm(fonte, achado.index);
        const antes = fonte.slice(0, achado.index);
        const dentroDeLabel = (antes.match(/<label\b/g)?.length ?? 0) > (antes.match(/<\/label>/g)?.length ?? 0);
        const id = tag.match(/\bid=\{([^}]+)\}/)?.[1];
        const nomeDeclarado =
          /\baria-label(ledby)?=/.test(tag) || dentroDeLabel || (id !== undefined && fonte.includes(`htmlFor={${id}}`));

        if (!nomeDeclarado) semNome.push(`${caminho}: <${achado[1]}>`);
      }
    }

    expect(arquivos.length).toBeGreaterThan(0);
    expect(semNome, semNome.join('\n')).toEqual([]);
  });
});
