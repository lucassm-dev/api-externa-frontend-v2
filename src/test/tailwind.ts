import { readFileSync } from 'node:fs';
import path from 'node:path';
import { compile } from '@tailwindcss/node';

/** Só a camada de utilitários: a base (preflight) vale para todo elemento e não diz nada da classe. */
function camadaDeUtilitarios(css: string): string {
  const inicio = css.indexOf('@layer utilities {');
  if (inicio === -1) return '';
  let profundidade = 0;
  for (let indice = css.indexOf('{', inicio); indice < css.length; indice++) {
    if (css[indice] === '{') profundidade++;
    if (css[indice] === '}' && --profundidade === 0) return css.slice(inicio, indice + 1);
  }
  return css.slice(inicio);
}

/**
 * CSS que o Tailwind do produto gera para estas classes. Testes de estrutura
 * visual provam a regra que sai no navegador, não só o nome da classe (ASM-074).
 */
export async function gerarCss(classes: string[]): Promise<string> {
  const global = readFileSync('src/styles/global.css', 'utf8');
  const compilador = await compile(global, { base: path.resolve('src/styles'), onDependency: () => undefined });
  return camadaDeUtilitarios(compilador.build(classes));
}

export const classesDe = (elemento: Element): string[] => (elemento.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
