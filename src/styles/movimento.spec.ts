import { globSync, readFileSync } from 'node:fs';

// Mesmo recorte do original: as telas de acesso têm critério de movimento
// próprio (repaginacao-acesso) e ficam fora deste sentinela.
const FORA_DO_ESCOPO = /(^|\/)src\/features\/acesso\//;
const PRODUTO = (caminho: string) => !FORA_DO_ESCOPO.test(caminho) && !/\.spec\.tsx?$/.test(caminho);

const folhas = globSync('src/**/*.css').filter(PRODUTO).sort();
const componentes = globSync('src/**/*.tsx').filter(PRODUTO).sort();
const global = readFileSync('src/styles/global.css', 'utf8');

// Propriedades cuja animação força o navegador a recalcular layout (reflow).
const PROPRIEDADES_DE_LAYOUT = new Set([
  'all', 'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
  'top', 'right', 'bottom', 'left', 'inset',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'margin-block', 'margin-inline',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'padding-block', 'padding-inline',
  'border', 'border-width', 'flex', 'flex-basis', 'flex-grow', 'flex-shrink',
  'gap', 'row-gap', 'column-gap', 'grid-template-columns', 'grid-template-rows',
  'font-size', 'line-height', 'letter-spacing',
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

// No React o movimento também nasce de classe Tailwind: `transition-all` e
// `transition-[height]` animam layout; `transition`, `-colors`, `-opacity`,
// `-transform` e `-shadow` não.
function transicoesDeLayoutEmClasse(codigo: string): string[] {
  const achadas = [...codigo.matchAll(/\btransition-(all|\[[^\]]+\])/g)].map(([, alvo]) =>
    alvo === 'all' ? 'all' : alvo.slice(1, -1),
  );
  return achadas.flatMap((alvo) => alvo.split(',')).filter((nome) => PROPRIEDADES_DE_LAYOUT.has(nome.trim()));
}

function freioGlobal(css: string): boolean {
  return blocos(css, /@media[^{]*prefers-reduced-motion:\s*reduce[^{]*/).some(
    (corpo) => /animation[a-z-]*:\s*none/.test(corpo) && /transition[a-z-]*:\s*none/.test(corpo),
  );
}

describe('Movimento com freio', () => {
  it('@spec:AC-284 nenhuma transição ou keyframe anima propriedade de layout', () => {
    expect(folhas.length).toBeGreaterThan(0);
    const infracoes: string[] = [];

    for (const caminho of folhas) {
      const css = readFileSync(caminho, 'utf8');

      for (const propriedade of propriedadesTransicionadas(css)) {
        if (PROPRIEDADES_DE_LAYOUT.has(propriedade)) infracoes.push(`${caminho}: transition anima "${propriedade}"`);
      }

      for (const corpo of blocos(css, /@keyframes\s+[\w-]+/)) {
        for (const propriedade of propriedadesDeclaradas(corpo)) {
          if (PROPRIEDADES_DE_LAYOUT.has(propriedade)) infracoes.push(`${caminho}: @keyframes anima "${propriedade}"`);
        }
      }
    }

    for (const caminho of componentes) {
      for (const propriedade of transicoesDeLayoutEmClasse(readFileSync(caminho, 'utf8'))) {
        infracoes.push(`${caminho}: classe anima "${propriedade}"`);
      }
    }

    expect(infracoes, infracoes.join('\n')).toEqual([]);
  });

  it('@spec:AC-284 todo movimento é suprimido em prefers-reduced-motion', () => {
    // Freio único na raiz: vale para CSS próprio e para as classes do Tailwind.
    expect(freioGlobal(global)).toBe(true);

    // E folha com movimento próprio também precisa do seu, como no original.
    const semFreio = folhas
      .filter((caminho) => caminho !== 'src/styles/global.css')
      .filter((caminho) => {
        const css = readFileSync(caminho, 'utf8');
        // Regra do original: o freio da folha zera a animação ou a transição que ela usa.
        const guardas = blocos(css, /@media[^{]*prefers-reduced-motion[^{]*/);
        return temMovimento(css) && !guardas.some((corpo) => /(animation|transition):\s*none/.test(corpo));
      });

    expect(semFreio, semFreio.join('\n')).toEqual([]);
  });
});
