import { cn } from '@/lib/utils';

export type FormatoEsqueleto = 'linha' | 'bloco' | 'tabela';

const ALTURA: Record<FormatoEsqueleto, string> = {
  linha: 'min-h-4',
  bloco: 'min-h-30',
  tabela: 'min-h-10',
};

/** Silhueta do que vai chegar; oculta da árvore acessível (AC-221). Brilho em movimento.css. */
export function Esqueleto({ formato = 'linha' }: { formato?: FormatoEsqueleto }) {
  const linhas = formato === 'tabela' ? 5 : 1;

  return (
    <div data-esqueleto data-formato={formato} aria-hidden="true" className="grid gap-2">
      {Array.from({ length: linhas }, (_, indice) => (
        <span
          key={indice}
          data-linha
          className={cn(
            'esqueleto-linha relative block overflow-hidden rounded',
            'bg-[color-mix(in_srgb,var(--cor-borda)_64%,var(--cor-superficie))]',
            ALTURA[formato],
          )}
        />
      ))}
    </div>
  );
}
