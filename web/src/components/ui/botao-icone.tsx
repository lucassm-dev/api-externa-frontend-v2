import type { ReactNode } from 'react';

interface Props {
  /** Obrigatório: ícone sem nome é botão mudo para o leitor de tela (AC-216). */
  rotulo: string;
  tipo?: 'button' | 'submit';
  desabilitado?: boolean;
  aoPressionar?: () => void;
  children: ReactNode;
}

export function BotaoIcone({ rotulo, tipo = 'button', desabilitado = false, aoPressionar, children }: Props) {
  return (
    <button
      type={tipo}
      aria-label={rotulo}
      title={rotulo}
      disabled={desabilitado}
      onClick={aoPressionar}
      className={[
        'inline-grid size-8 min-w-8 min-h-8 place-items-center p-0 cursor-pointer',
        'rounded border border-borda bg-superficie text-texto',
        'transition-colors duration-(--duracao-rapida) ease-(--entrada)',
        'hover:not-disabled:border-acento hover:not-disabled:bg-superficie-alta hover:not-disabled:text-acento',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento',
        'disabled:cursor-not-allowed disabled:opacity-55',
        // Tela estreita é tela de dedo: o alvo sobe para 44px (AC-217, AC-269).
        'max-md:size-11 max-md:min-w-11 max-md:min-h-11',
      ].join(' ')}
    >
      <span data-icone aria-hidden="true" className="grid place-items-center leading-none [&_svg]:size-4">
        {children}
      </span>
    </button>
  );
}
