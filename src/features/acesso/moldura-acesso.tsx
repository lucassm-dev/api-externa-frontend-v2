import type { ReactNode } from 'react';
import { Holofote } from '@/components/ui/holofote';

/**
 * Moldura das duas telas de acesso, sem regra de formulário. Em tela larga, o
 * formulário divide a página com a região de marca; abaixo disso ele ocupa a
 * tela sozinho (no Angular as duas colunas tinham 480px de mínimo e a página
 * rolava de lado no celular).
 */
export function MolduraAcesso({ children }: { children: ReactNode }) {
  return (
    <main data-moldura-acesso className="grid min-h-dvh bg-fundo lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section data-regiao-formulario className="grid place-items-center px-4 py-10 sm:px-8 lg:p-16">
        <div className="w-[min(100%,440px)]">{children}</div>
      </section>

      <aside
        data-regiao-marca
        aria-hidden="true"
        className="relative isolate hidden place-items-center overflow-hidden bg-barra-mercado-fundo p-16 text-barra-mercado-texto lg:grid"
      >
        <Holofote />
        <div className="max-w-[480px]">
          <span className="mb-8 grid size-14 place-items-center rounded-grande bg-destaque text-titulo font-extrabold text-destaque-texto shadow-media">
            C
          </span>
          <p className="m-0 text-display leading-none font-bold tracking-(--entrelinha-titulo)">Carteira</p>
          <p className="mt-4 mb-0 max-w-[400px] text-grande leading-relaxed text-barra-mercado-fraco">
            Decisões mais claras para suas carteiras hipotéticas.
          </p>
        </div>
      </aside>
    </main>
  );
}
