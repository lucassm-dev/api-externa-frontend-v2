import { ArrowRight, Inbox } from 'lucide-react';
import { useId } from 'react';
import { Botao } from '@/components/ui/botao';

interface Props {
  titulo: string;
  descricao: string;
  rotuloAcao: string;
  aoAcionar: () => void;
}

/** Tela vazia é feature: explica a ausência e conduz ao próximo passo (AC-223). */
export function EstadoVazio({ titulo, descricao, rotuloAcao, aoAcionar }: Props) {
  const tituloId = useId();

  return (
    <section
      aria-labelledby={tituloId}
      className="grid justify-items-center gap-2 rounded-grande border border-dashed border-borda bg-superficie px-6 py-10 text-center"
    >
      <span className="mb-2 grid size-12 place-items-center rounded-pilula bg-superficie-alta text-texto-fraco">
        <Inbox aria-hidden="true" focusable="false" className="size-6" strokeWidth={1.75} />
      </span>
      <h2
        id={tituloId}
        data-titulo
        className="m-0 text-grande font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo)"
      >
        {titulo}
      </h2>
      <p data-descricao className="m-0 max-w-[52ch] text-texto-fraco">
        {descricao}
      </p>
      <Botao intencao="primaria" type="button" data-proximo-passo onClick={aoAcionar} className="mt-3">
        <span>{rotuloAcao}</span>
        <ArrowRight aria-hidden="true" focusable="false" />
      </Botao>
    </section>
  );
}
