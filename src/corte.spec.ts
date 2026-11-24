import { readFileSync } from 'node:fs';

describe('Corte final da migração', () => {
  it('@spec:AC-305 o package.json da raiz não traz nenhum pacote do Angular', () => {
    const pacote = JSON.parse(readFileSync('package.json', 'utf8')) as Record<string, Record<string, string> | undefined>;
    const nomes = Object.keys({ ...pacote.dependencies, ...pacote.devDependencies, ...pacote.peerDependencies });

    expect(nomes.length).toBeGreaterThan(0);
    expect(
      nomes.filter(
        (nome) =>
          nome.startsWith('@angular/') || ['@lucide/angular', '@tanstack/angular-table', 'ngx-oneforall'].includes(nome),
      ),
    ).toEqual([]);
  });
});
