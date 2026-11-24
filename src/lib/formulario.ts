import { useState } from 'react';

export type Erros<T> = Partial<Record<keyof T, string>>;

/**
 * O que o Reactive Forms fazia nas telas, sem o Angular: campo tocado ao perder
 * o foco, todos tocados ao tentar enviar, e o erro do servidor (setErrors
 * `servidor`) preso ao campo até o investidor editar aquele campo.
 */
export function useFormulario<T extends Record<string, string>>(inicial: T, validar: (valores: T) => Erros<T>) {
  const [valores, setValores] = useState<T>(inicial);
  const [tocados, setTocados] = useState<Partial<Record<keyof T, boolean>>>({});
  const [doServidor, setDoServidor] = useState<Erros<T>>({});

  const validacao = validar(valores);
  const invalido = Object.keys(validacao).length > 0;

  return {
    valores,
    invalido,
    /** Erro a mostrar: o do servidor sempre; o de validação só depois de tocado. */
    erroDe: (campo: keyof T): string | null =>
      doServidor[campo] ?? (tocados[campo] ? (validacao[campo] ?? null) : null),
    tocado: (campo: keyof T) => Boolean(tocados[campo]),
    mudar: (campo: keyof T, valor: string) => {
      setValores((atual) => ({ ...atual, [campo]: valor }));
      setDoServidor((atual) => {
        if (!(campo in atual)) return atual;
        const { [campo]: _, ...resto } = atual;
        return resto as Erros<T>;
      });
    },
    tocar: (campo: keyof T) => setTocados((atual) => ({ ...atual, [campo]: true })),
    tocarTodos: () => setTocados(Object.fromEntries(Object.keys(valores).map((campo) => [campo, true])) as typeof tocados),
    aplicarErrosDoServidor: (erros: Erros<T>) => setDoServidor(erros),
  };
}
