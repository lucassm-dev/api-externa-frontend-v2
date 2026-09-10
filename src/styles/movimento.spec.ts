import { globSync, readFileSync } from 'node:fs';

// AC-284 governa "qualquer transição ou animação introduzida por esta
// repaginação" — repaginacao-visual. As telas de acesso foram repaginadas pela
// feature irmã `repaginacao-acesso`, que carrega o próprio critério de
// movimento e é auditada em separado; ficam fora deste sentinela.
const FORA_DO_ESCOPO = /(^|\/)src\/app\/features\/acesso\//;

const folhas = globSync('src/**/*.scss')
  .filter((caminho) => !FORA_DO_ESCOPO.test(caminho))
  .sort();

// Propriedades cuja animação força o navegador a recalcular layout (reflow).
// Movimento só pode viver em `transform` e `opacity` — o resto trava a página.
const PROPRIEDADES_DE_LAYOUT = new Set([
  'all',
  'width',
  'min-width',
  'max-width',
  'height',
  'min-height',
  'max-height',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-block',
  'margin-inline',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-block',
  'padding-inline',
  'border',
  'border-width',
  'flex',
  'flex-basis',
  'flex-grow',
  'flex-shrink',
  'gap',
  'row-gap',
  'column-gap',
  'grid-template-columns',
  'grid-template-rows',
  'font-size',
  'line-height',
  'letter-spacing',
]);

function blocos(css: string, abertura: RegExp): string[] {
  const encontrados: string[] = [];
  const varredura = new RegExp(abertura, 'g');
  let ocorrencia: RegExpExecArray | null;

  while ((ocorrencia = varredura.exec(css))) {
    const abre = css.indexOf('{', ocorrencia.index);
    if (abre === -1) continue;

    let profundidade = 0;
    for (let indice = abre; indice < css.length; indice++) {
      if (css[indice] === '{') profundidade++;
      if (css[indice] === '}' && --profundidade === 0) {
        encontrados.push(css.slice(abre + 1, indice));
        break;
      }
    }
  }

  return encontrados;
}

function propriedadesDeclaradas(corpo: string): string[] {
  return [...corpo.matchAll(/([a-z-]+)\s*:/g)].map(([, nome]) => nome.toLowerCase());
}

function propriedadesTransicionadas(css: string): string[] {
  return [...css.matchAll(/transition(?:-property)?:\s*([^;{}]+)/g)].flatMap(([, valor]) =>
    valor
      .split(',')
      .map((segmento) => segmento.trim().split(/\s+/)[0].toLowerCase())
      .filter((nome) => nome && nome !== 'none'),
  );
}

function temMovimento(css: string): boolean {
  return (
    /@keyframes\s/.test(css) ||
    /animation(?:-name)?:\s*(?!none)[^;{}]+/.test(css) ||
    /transition(?:-property)?:\s*(?!none)[^;{}]+/.test(css)
  );
}

describe('Movimento com freio', () => {
  it('@spec:AC-284 nenhuma transição ou keyframe anima propriedade de layout', () => {
    expect(folhas.length).toBeGreaterThan(0);
    const infracoes: string[] = [];

    for (const caminho of folhas) {
      const css = readFileSync(caminho, 'utf8');

      for (const propriedade of propriedadesTransicionadas(css)) {
        if (PROPRIEDADES_DE_LAYOUT.has(propriedade)) {
          infracoes.push(`${caminho}: transition anima "${propriedade}"`);
        }
      }

      for (const corpo of blocos(css, /@keyframes\s+[\w-]+/)) {
        for (const propriedade of propriedadesDeclaradas(corpo)) {
          if (PROPRIEDADES_DE_LAYOUT.has(propriedade)) {
            infracoes.push(`${caminho}: @keyframes anima "${propriedade}"`);
          }
        }
      }
    }

    expect(infracoes, infracoes.join('\n')).toEqual([]);
  });

  it('@spec:AC-284 toda folha com movimento o suprime em prefers-reduced-motion', () => {
    const semFreio: string[] = [];

    for (const caminho of folhas) {
      const css = readFileSync(caminho, 'utf8');
      if (!temMovimento(css)) continue;

      const guardas = blocos(css, /@media[^{]*prefers-reduced-motion[^{]*/);
      const suprime = guardas.some((corpo) => /(animation|transition):\s*none/.test(corpo));

      if (!suprime) semFreio.push(caminho);
    }

    expect(semFreio, semFreio.join('\n')).toEqual([]);
  });
});
