import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  titulo: string;
  apoio?: string | null;
  /** Conteúdo no canto do cabeçalho (seletor, selo, horário). */
  aoLadoDoTitulo?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** Título, conteúdo e ações numa estrutura de seção previsível (AC-225). */
export function Cartao({ titulo, apoio = null, aoLadoDoTitulo, acoes, className, children }: Props) {
  const tituloId = useId();

  return (
    <article className={cn('overflow-hidden rounded-grande border border-borda bg-superficie shadow-cartao', className)}>
      <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4">
        <div className="min-w-0">
          <h2
            id={tituloId}
            data-cartao-titulo
            className="m-0 text-medio font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo)"
          >
            {titulo}
          </h2>
          {apoio && (
            <p data-cartao-apoio className="mt-1 mb-0 text-rotulo text-texto-fraco">
              {apoio}
            </p>
          )}
        </div>
        {aoLadoDoTitulo}
      </header>

      <section role="region" aria-labelledby={tituloId} data-cartao-conteudo className="px-5 py-4">
        {children}
      </section>

      <footer data-cartao-acoes className="flex justify-end gap-2 border-t border-borda px-5 py-3 empty:hidden">
        {acoes}
      </footer>
    </article>
  );
}
