import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Botao } from './botao';

interface Props {
  pagina: number;
  totalPaginas: number;
  totalItens: number;
  itensPorPagina: number;
  aoMudarPagina: (pagina: number) => void;
}

/** Posição, faixa e os dois controles; nos limites o controle fica desabilitado (AC-224). */
export function Paginador({ pagina, totalPaginas, totalItens, itensPorPagina, aoMudarPagina }: Props) {
  const inicio = totalItens === 0 ? 0 : (pagina - 1) * itensPorPagina + 1;
  const fim = Math.min(pagina * itensPorPagina, totalItens);

  const irPara = (destino: number) => {
    if (destino >= 1 && destino <= totalPaginas && destino !== pagina) aoMudarPagina(destino);
  };

  return (
    <nav aria-label="Paginação dos resultados" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
      <div aria-live="polite" className="flex items-baseline gap-3">
        <strong data-pagina className="font-semibold">
          Página {pagina} de {totalPaginas}
        </strong>
        <span data-faixa className="font-numero text-rotulo text-texto-fraco">
          {inicio}–{fim} de {totalItens}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Botao
          intencao="secundaria"
          tamanho="compacto"
          type="button"
          data-anterior
          desabilitado={pagina <= 1}
          onClick={() => irPara(pagina - 1)}
        >
          <ChevronLeft aria-hidden="true" focusable="false" />
          <span>Anterior</span>
        </Botao>
        <Botao
          intencao="secundaria"
          tamanho="compacto"
          type="button"
          data-proxima
          desabilitado={pagina >= totalPaginas}
          onClick={() => irPara(pagina + 1)}
        >
          <span>Próxima</span>
          <ChevronRight aria-hidden="true" focusable="false" />
        </Botao>
      </div>
    </nav>
  );
}
