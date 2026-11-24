import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// O tailwind-merge só conhece os nomes padrão do Tailwind. Sem isto ele trata
// `text-rotulo` como cor (e descarta `text-texto-fraco` ao juntar) e mantém
// `rounded-pequeno rounded-grande` juntos, deixando a ordem do CSS decidir.
const juntar = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['pequeno', 'grande', 'pilula'],
      shadow: ['baixa', 'cartao', 'media', 'alta'],
    },
    classGroups: {
      'font-size': [{ text: ['rotulo', 'apoio', 'base', 'medio', 'grande', 'titulo', 'display'] }],
    },
  },
});

export function cn(...entradas: ClassValue[]): string {
  return juntar(clsx(entradas));
}
