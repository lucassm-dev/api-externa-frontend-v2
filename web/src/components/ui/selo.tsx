import { CircleCheck, CircleX, Minus, TrendingDown, TrendingUp, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VarianteSelo = 'alta' | 'baixa' | 'estavel' | 'sucesso' | 'aviso' | 'erro';

const APRESENTACAO: Record<VarianteSelo, { Icone: LucideIcon; cores: string }> = {
  alta: { Icone: TrendingUp, cores: 'text-alta bg-[color-mix(in_srgb,var(--cor-alta)_12%,var(--cor-superficie))]' },
  baixa: { Icone: TrendingDown, cores: 'text-baixa bg-[color-mix(in_srgb,var(--cor-baixa)_12%,var(--cor-superficie))]' },
  estavel: {
    Icone: Minus,
    cores: 'text-estavel bg-[color-mix(in_srgb,var(--cor-estavel)_12%,var(--cor-superficie))]',
  },
  sucesso: { Icone: CircleCheck, cores: 'text-sucesso-texto bg-sucesso-fundo' },
  aviso: { Icone: TriangleAlert, cores: 'text-aviso-texto bg-aviso-fundo' },
  erro: { Icone: CircleX, cores: 'text-erro-texto bg-erro-fundo' },
};

/** Situação em texto e símbolo; a cor acompanha, nunca carrega (AC-222). */
export function Selo({ variante, texto, className }: { variante: VarianteSelo; texto: string; className?: string }) {
  const { Icone, cores } = APRESENTACAO[variante];

  return (
    <span
      data-selo
      data-variante={variante}
      className={cn(
        'inline-flex min-h-6 items-center gap-1 whitespace-nowrap rounded-pilula px-2',
        'border border-[color-mix(in_srgb,currentColor_35%,transparent)]',
        'text-rotulo font-bold leading-(--altura-apertada)',
        cores,
        className,
      )}
    >
      <Icone data-icone={variante} aria-hidden="true" focusable="false" className="size-3.5 flex-none" />
      <span>{texto}</span>
    </span>
  );
}
