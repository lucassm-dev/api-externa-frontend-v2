import { CircleCheck, CircleX, Info, TriangleAlert, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NivelFeedback } from './feedback.model';

const APRESENTACAO: Record<NivelFeedback, { rotulo: string; papel: string; Icone: LucideIcon; cores: string }> = {
  informacao: { rotulo: 'Informação', papel: 'note', Icone: Info, cores: 'border-info-borda bg-info-fundo text-info-texto' },
  aviso: { rotulo: 'Aviso', papel: 'status', Icone: TriangleAlert, cores: 'border-aviso-borda bg-aviso-fundo text-aviso-texto' },
  erro: { rotulo: 'Erro', papel: 'alert', Icone: CircleX, cores: 'border-erro-borda bg-erro-fundo text-erro-texto' },
  sucesso: {
    rotulo: 'Sucesso',
    papel: 'status',
    Icone: CircleCheck,
    cores: 'border-sucesso-borda bg-sucesso-fundo text-sucesso-texto',
  },
};

interface Props {
  nivel: NivelFeedback;
  mensagem: string;
  codigo?: string | null;
  className?: string;
}

export function MensagemFeedback({ nivel, mensagem, codigo = null, className }: Props) {
  const { rotulo, papel, Icone, cores } = APRESENTACAO[nivel];

  return (
    <div
      data-nivel={nivel}
      role={papel}
      className={cn('flex items-start gap-3 rounded border px-4 py-3 shadow-baixa', cores, className)}
    >
      <span data-simbolo aria-hidden="true" className="grid size-5 flex-none place-items-center">
        <Icone data-icone={nivel} aria-hidden="true" focusable="false" className="size-5" strokeWidth={2} />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <span data-rotulo className="text-rotulo font-bold uppercase tracking-(--entrelinha-rotulo)">
          {rotulo}
        </span>
        <p data-mensagem className="m-0">
          {mensagem}
        </p>
        {codigo && (
          <span data-codigo className="font-numero text-rotulo opacity-75">
            Código {codigo}
          </span>
        )}
      </div>
    </div>
  );
}
