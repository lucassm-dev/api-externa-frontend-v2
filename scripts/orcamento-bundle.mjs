// Teto do bundle inicial (TDD da migracao-react, design-v2.md §16): soma o JS e o CSS
// que o index.html carrega antes de qualquer rota. Roda depois do `vite build`.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// 475/142 desde identidade-papel (Q-046): o catálogo completo de erros passou 0,79 kB do teto sem folga.
const TETO = { bruto: 475_000, gzip: 142_000 };

const html = readFileSync('dist/index.html', 'utf8');
const arquivos = [...html.matchAll(/(?:src|href)="\/(assets\/[^"]+\.(?:js|css))"/g)].map(([, caminho]) =>
  readFileSync(`dist/${caminho}`),
);
const bruto = arquivos.reduce((soma, arquivo) => soma + arquivo.length, 0);
const gzip = arquivos.reduce((soma, arquivo) => soma + gzipSync(arquivo, { level: 9 }).length, 0);
const kB = (bytes) => (bytes / 1000).toFixed(2);

console.log(`bundle inicial: ${kB(bruto)} kB brutos, ${kB(gzip)} kB gzip (teto ${kB(TETO.bruto)} / ${kB(TETO.gzip)})`);
if (arquivos.length === 0 || bruto > TETO.bruto || gzip > TETO.gzip) {
  console.error('bundle inicial fora do teto do TDD (design-v2.md §16)');
  process.exit(1);
}
