import { useState, type CSSProperties } from 'react';

/**
 * A mesma regra do `initials` do ngx-oneforall, que o Angular usava: uma
 * palavra vira os primeiros caracteres; várias viram a inicial de cada uma.
 */
export function iniciais(texto: string, quantidade = 2): string {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return '';
  if (palavras.length === 1) return palavras[0].slice(0, quantidade).toUpperCase();
  return palavras
    .slice(0, quantidade)
    .map((palavra) => palavra.charAt(0))
    .join('')
    .toUpperCase();
}

/** Série estável por ticker: o mesmo ativo tem sempre a mesma cor (AC-219). */
function serieDe(ticker: string): number {
  let hash = 0;
  for (const caractere of ticker) {
    hash = (hash * 31 + caractere.charCodeAt(0)) | 0;
  }
  return Math.abs(hash % 8) + 1;
}

/** Logo curado quando existe; senão, as iniciais do ticker na cor da série (AC-218, AC-220). */
export function Monograma({ ticker, logoUrl = null }: { ticker: string; logoUrl?: string | null }) {
  const [logoFalhou, setLogoFalhou] = useState(false);
  const normalizado = ticker.trim().toUpperCase();

  if (logoUrl && !logoFalhou) {
    return (
      <img
        src={logoUrl}
        alt={`Logo do ativo ${normalizado}`}
        onError={() => setLogoFalhou(true)}
        className="size-9 flex-none rounded bg-superficie object-contain"
      />
    );
  }

  const serie = serieDe(normalizado);
  const estilo = { '--cor-monograma': `var(--cor-serie-${serie})` } as CSSProperties;

  return (
    <span
      data-monograma
      role="img"
      aria-label={`Ativo ${normalizado}`}
      data-serie={serie}
      style={estilo}
      className={[
        'inline-grid size-9 flex-none place-items-center rounded',
        'border-2 border-(--cor-monograma) bg-[color-mix(in_srgb,var(--cor-monograma)_16%,var(--cor-superficie))]',
        'font-numero text-rotulo font-bold tracking-(--entrelinha-rotulo) text-texto',
      ].join(' ')}
    >
      {iniciais(normalizado, 2)}
    </span>
  );
}
