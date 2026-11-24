import { globSync, readFileSync } from 'node:fs';

/**
 * AC-303: as telas montam botão, campo, tabela, confirmação e aviso flutuante
 * só pelo kit (components/ui, core/feedback). A varredura cobre toda tela que
 * já existe em features/ e layout/ — e cresce sozinha a cada tela portada.
 */
const TELAS = globSync('src/{features,layout}/**/*.tsx')
  .filter((caminho) => !/\.spec\.tsx$/.test(caminho))
  .sort();

const CRUS: Array<[string, RegExp]> = [
  ['<button> cru (use Botao ou BotaoIcone)', /<button\b/],
  ['<input> cru (use Campo)', /<input\b/],
  ['<table> cru (use Tabela)', /<table\b/],
  ['HTML injetado', /dangerouslySetInnerHTML/],
  ['aviso flutuante fora do kit (use notificacao)', /from ['"]sonner['"]/],
  ['diálogo fora do kit (use DialogoConfirmacao)', /from ['"]radix-ui['"]/],
];

describe('Telas sobre o kit', () => {
  it('@spec:AC-303 nenhuma tela monta botão, campo ou tabela cru, nem aviso ou diálogo fora do kit', () => {
    expect(TELAS.length).toBeGreaterThan(0);

    const infracoes = TELAS.flatMap((caminho) => {
      const fonte = readFileSync(caminho, 'utf8');
      return CRUS.filter(([, padrao]) => padrao.test(fonte)).map(([motivo]) => `${caminho}: ${motivo}`);
    });

    expect(infracoes, infracoes.join('\n')).toEqual([]);
  });

  it('@spec:AC-303 as telas de fato usam o kit para o que mostram', () => {
    const fonte = (caminho: string) => readFileSync(caminho, 'utf8');

    for (const caminho of ['src/features/acesso/login.tsx', 'src/features/acesso/cadastro.tsx']) {
      expect(fonte(caminho), caminho).toMatch(/from '@\/components\/ui\/botao'/);
      expect(fonte(caminho), caminho).toMatch(/from '@\/components\/ui\/campo'/);
    }
    expect(fonte('src/layout/casca.tsx')).toMatch(/from '@\/components\/ui\/botao-icone'/);
  });
});
