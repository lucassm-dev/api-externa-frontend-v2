import { useSyncExternalStore } from 'react';

const CONSULTA = '(prefers-reduced-motion: reduce)';

function lista(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA) : null;
}

/**
 * Animação feita em JS (motion) não passa pelo freio de CSS do global.css:
 * quem anima por script consulta a mesma preferência por aqui (AC-302).
 */
export function usePrefereMovimentoReduzido(): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = lista();
      consulta?.addEventListener('change', avisar);
      return () => consulta?.removeEventListener('change', avisar);
    },
    () => lista()?.matches ?? false,
  );
}
