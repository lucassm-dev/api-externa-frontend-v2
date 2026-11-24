import { animate } from 'motion';
import { useEffect, useRef } from 'react';
import { usePrefereMovimentoReduzido } from '@/lib/movimento';

/*
 * Inspirado no NumberTicker do Magic UI (registro `number-ticker`, conferido
 * em 2026-11-22). Mudanças: formata no padrão do produto (pt-BR, moeda) em vez
 * de en-US; o valor final fica sempre no texto lido por leitor de tela, e só a
 * camada visual conta; com "reduzir movimento" ela já nasce no valor final
 * (AC-302). Anima só o texto, nada de layout.
 */
interface Props {
  valor: number;
  formatar: (valor: number) => string;
}

export function ContagemNumero({ valor, formatar }: Props) {
  const reduzido = usePrefereMovimentoReduzido();
  const visual = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const alvo = visual.current;
    if (!alvo || reduzido || typeof requestAnimationFrame !== 'function') return;
    const controles = animate(0, valor, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (atual) => {
        alvo.textContent = formatar(atual);
      },
      onComplete: () => {
        alvo.textContent = formatar(valor);
      },
    });
    return () => controles.stop();
  }, [valor, formatar, reduzido]);

  return (
    <>
      <span className="sr-only">{formatar(valor)}</span>
      <span ref={visual} data-contagem aria-hidden="true" className="tabular-nums">
        {formatar(valor)}
      </span>
    </>
  );
}
