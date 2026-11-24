import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  rotulo: string;
}

/** Opção de liga/desliga: o checkbox nativo (teclado e leitor de tela já resolvidos) no acento do produto, com o rótulo clicável. */
export function CaixaDeMarcar({ rotulo, className, ...input }: Props) {
  return (
    <label className={cn('inline-flex min-h-8 cursor-pointer items-center gap-2 pointer-coarse:min-h-(--alvo-toque)', className)}>
      <input
        type="checkbox"
        className="size-4 flex-none cursor-pointer rounded-sm accent-acento focus-visible:shadow-(--anel-foco) focus-visible:outline-none"
        {...input}
      />
      <span>{rotulo}</span>
    </label>
  );
}
