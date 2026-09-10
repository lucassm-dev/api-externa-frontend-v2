import { readFileSync } from 'node:fs';

describe('Tabela — rolagem contida', () => {
  const estilo = readFileSync('src/app/shared/tabela/tabela.scss', 'utf8');
  const base = estilo.match(/\.tabela\s*\{[^}]*\}/)?.[0] ?? '';

  it('@spec:AC-272 mantém a rolagem horizontal dentro do bloco da tabela', () => {
    expect(base).not.toBe('');
    // A própria <table> vira a região rolável.
    expect(base).toMatch(/display:\s*block/);
    expect(base).toMatch(/overflow-x:\s*(auto|scroll)/);
    // E esse bloco nunca fica mais largo que a tela.
    expect(base).toMatch(/max-width:\s*100%/);
  });

  it('@spec:AC-272 impede que a rolagem da tabela arraste a página de lado', () => {
    expect(base).toMatch(/overscroll-behavior(-x)?:\s*[^;]*contain/);
  });

  it('@spec:AC-272 dá contorno próprio à região rolável quando ela recebe foco de teclado', () => {
    const foco = estilo.match(/\.tabela:focus-visible\s*\{[^}]*\}/)?.[0] ?? '';
    expect(foco).not.toBe('');
    expect(foco).toMatch(/outline:\s*[^;]*var\(--cor-foco\)/);
    expect(foco).not.toMatch(/outline:\s*none/);
  });

  it('@spec:AC-272 preserva o nome acessível da região rolável pela caption da tabela', () => {
    // Com a <table> como scroll container, o nome acessível da região vem da
    // <caption>; o estilo dela precisa continuar existindo.
    expect(estilo).toMatch(/\.tabela\s+caption\s*\{[^}]*\}/);
  });
});
