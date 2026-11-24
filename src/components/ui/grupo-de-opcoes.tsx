import { useId } from 'react';
import { cn } from '@/lib/utils';

interface Opcao<T extends string> {
  valor: T;
  rotulo: string;
}

interface Props<T extends string> {
  legenda: string;
  opcoes: readonly Opcao<T>[];
  valor: T;
  aoEscolher: (valor: T) => void;
  [dado: `data-${string}`]: unknown;
}

/**
 * Escolha que muda o que a ação faz: as opções ficam lado a lado, à vista, e
 * nunca atrás de um campo suspenso. Por baixo é o rádio nativo, então setas,
 * Tab e leitor de tela já funcionam (AC-150).
 */
export function GrupoDeOpcoes<T extends string>({ legenda, opcoes, valor, aoEscolher, ...dados }: Props<T>) {
  const nome = useId();

  return (
    <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0" {...dados}>
      <legend className="mb-2 p-0 text-apoio font-medium text-texto">{legenda}</legend>
      <div className="grid grid-cols-2 gap-1 rounded-grande border border-borda bg-fundo p-1">
        {opcoes.map((opcao) => {
          const marcada = opcao.valor === valor;
          return (
            <label
              key={opcao.valor}
              data-tipo={opcao.valor}
              data-marcada={marcada ? 'sim' : undefined}
              className={cn(
                'relative flex min-h-11 cursor-pointer items-center justify-center rounded px-3 text-medio font-medium text-texto-fraco select-none',
                'transition-[background-color,color,box-shadow] duration-(--duracao-rapida) ease-(--entrada)',
                'hover:text-texto has-focus-visible:shadow-(--anel-foco)',
                marcada && 'bg-superficie font-semibold text-texto shadow-baixa',
              )}
            >
              <input
                type="radio"
                name={nome}
                value={opcao.valor}
                checked={marcada}
                onChange={() => aoEscolher(opcao.valor)}
                className="sr-only"
              />
              {marcada && <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 rounded-pilula bg-acento" />}
              {opcao.rotulo}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
