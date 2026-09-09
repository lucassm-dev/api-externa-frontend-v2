import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function templatesEm(diretorio: string): string[] {
  return readdirSync(diretorio, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(diretorio, entrada.name);
    if (entrada.isDirectory()) return templatesEm(caminho);
    return entrada.isFile() && entrada.name.endsWith('.html') ? [caminho] : [];
  });
}

describe('Nomes acessíveis declarados nos templates', () => {
  it('@spec:AC-231 todo input e select tem nome acessível verificável sem executar o Angular', () => {
    const semNome: string[] = [];

    for (const caminho of templatesEm('src/app')) {
      const recipiente = document.createElement('div');
      recipiente.innerHTML = readFileSync(caminho, 'utf8');

      for (const campo of recipiente.querySelectorAll('input, select')) {
        const id = campo.getAttribute('id');
        const rotuloPorId = id ? recipiente.querySelector(`label[for="${id}"]`) : null;
        const nomeDeclarado =
          campo.hasAttribute('aria-label') ||
          campo.hasAttribute('aria-labelledby') ||
          campo.closest('label') !== null ||
          rotuloPorId !== null;

        if (!nomeDeclarado) semNome.push(`${caminho}: <${campo.tagName.toLowerCase()}>`);
      }
    }

    expect(semNome, semNome.join('\n')).toEqual([]);
  });
});
