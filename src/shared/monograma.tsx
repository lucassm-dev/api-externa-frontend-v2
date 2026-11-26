import { ChartCandlestick } from 'lucide-react';
import { useState, type CSSProperties } from 'react';

/** Mesma fonte dos logos que o backend usa na barra de cotações (brapi). */
export const logoDoTicker = (ticker: string) => `https://icons.brapi.dev/icons/${encodeURIComponent(ticker)}.svg`;

/** Série estável por ticker: o mesmo ativo tem sempre a mesma cor (AC-219). */
function serieDe(ticker: string): number {
  let hash = 0;
  for (const caractere of ticker) {
    hash = (hash * 31 + caractere.charCodeAt(0)) | 0;
  }
  return Math.abs(hash % 8) + 1;
}

/**
 * O logo da empresa; sem logo, um ícone na cor da série do ativo, nunca letras
 * (AC-380, AC-381). O ticker é anunciado pelo elemento de fora, então a imagem
 * é decorativa e o leitor de tela não o repete (AC-220).
 */
export function Monograma({ ticker, logoUrl = null }: { ticker: string; logoUrl?: string | null }) {
  const normalizado = ticker.trim().toUpperCase();
  const fonte = logoUrl ?? logoDoTicker(normalizado);
  // Guardar qual fonte falhou, e não um booleano, faz um ticker novo tentar o logo de novo.
  const [fonteQueFalhou, setFonteQueFalhou] = useState<string | null>(null);
  const comLogo = fonteQueFalhou !== fonte;

  const serie = serieDe(normalizado);
  const estilo = { '--cor-monograma': `var(--cor-serie-${serie})` } as CSSProperties;

  return (
    <span
      data-monograma
      data-logo={comLogo || undefined}
      role="img"
      aria-label={`Ativo ${normalizado}`}
      data-serie={serie}
      style={estilo}
      className={[
        'inline-grid size-9 flex-none place-items-center overflow-hidden rounded-pilula',
        'ring-1 ring-borda bg-[color-mix(in_srgb,var(--cor-monograma)_14%,var(--cor-superficie))] text-(--cor-monograma)',
      ].join(' ')}
    >
      {comLogo ? (
        <img src={fonte} alt="" loading="lazy" decoding="async" onError={() => setFonteQueFalhou(fonte)} className="size-full object-cover" />
      ) : (
        <ChartCandlestick data-icone-ativo aria-hidden="true" focusable="false" className="size-4.5" strokeWidth={2.25} />
      )}
    </span>
  );
}
