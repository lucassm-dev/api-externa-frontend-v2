import { globSync, readFileSync } from 'node:fs';

/**
 * AC-266: uma única origem para todo botão. Varre as telas e os componentes que
 * montam botões e falha se sobrar botão cru ou botão de outra biblioteca.
 * As primitivas que SÃO botões (botão, botão-ícone, visibilidade da senha e o
 * fechar do aviso flutuante) ficam fora, como no Angular.
 */
const PRIMITIVAS_DE_BOTAO = new Set([
  'src/components/ui/botao.tsx',
  'src/components/ui/botao-icone.tsx',
  'src/shared/visibilidade-senha.tsx',
  'src/core/feedback/notificacao.tsx',
]);

const TELAS = globSync('src/**/*.tsx')
  .filter((caminho) => !/\.spec\.tsx$/.test(caminho))
  .filter((caminho) => !PRIMITIVAS_DE_BOTAO.has(caminho))
  .sort();

describe('Botão único do produto', () => {
  it('@spec:AC-266 nenhuma tela usa botão de outra biblioteca', () => {
    const pacote = readFileSync('package.json', 'utf8');
    expect(pacote).not.toMatch(/@angular\/material|@mui\/|@heroui\/|antd/);

    const infratores = TELAS.filter((caminho) =>
      /from ['"](?:@angular\/material|@mui\/|@heroui\/|antd)|components\/ui\/button['"]/.test(readFileSync(caminho, 'utf8')),
    );
    expect(infratores).toEqual([]);
  });

  it('@spec:AC-266 todo <button> de tela passa pelo Botao compartilhado', () => {
    expect(TELAS.length).toBeGreaterThan(0);

    const crus = TELAS.flatMap((caminho) => {
      const tags = readFileSync(caminho, 'utf8').match(/<button\b[\s\S]*?>/g) ?? [];
      return tags.map((tag) => `${caminho}: ${tag.replace(/\s+/g, ' ').trim()}`);
    });

    expect(crus).toEqual([]);
  });

  it('@spec:AC-266 o componente compartilhado é um só e mora em components/ui/botao', () => {
    const declaracoes = globSync('src/**/*.tsx').filter((caminho) =>
      /export function Botao\b/.test(readFileSync(caminho, 'utf8')),
    );
    expect(declaracoes).toEqual(['src/components/ui/botao.tsx']);
  });
});
