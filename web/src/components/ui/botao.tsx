import { cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { cn } from '@/lib/utils';

/**
 * As quatro intenções que o produto reconhece. Não são estilos: são respostas à
 * pergunta "o que acontece se eu clicar?". Primária avança o fluxo, secundária
 * oferece a alternativa, sutil é navegação de baixo peso e destrutiva apaga.
 */
export type IntencaoBotao = 'primaria' | 'secundaria' | 'sutil' | 'destrutiva';
export type TamanhoBotao = 'medio' | 'compacto';

const INTENCOES: readonly IntencaoBotao[] = ['primaria', 'secundaria', 'sutil', 'destrutiva'];
const TAMANHOS: readonly TamanhoBotao[] = ['medio', 'compacto'];

/**
 * Intenção desconhecida é recusada em vez de virar aparência padrão silenciosa
 * (AC-267): um botão que deveria gritar e aparece discreto é pior que um erro.
 */
function exigirIntencao(valor: string): IntencaoBotao {
  if (!INTENCOES.includes(valor as IntencaoBotao)) {
    throw new Error(`Intenção de botão desconhecida: "${valor}". Use ${INTENCOES.join(', ')}.`);
  }
  return valor as IntencaoBotao;
}

function exigirTamanho(valor: string): TamanhoBotao {
  if (!TAMANHOS.includes(valor as TamanhoBotao)) {
    throw new Error(`Tamanho de botão desconhecido: "${valor}". Use ${TAMANHOS.join(', ')}.`);
  }
  return valor as TamanhoBotao;
}

export const estiloBotao = cva(
  [
    'relative inline-flex items-center justify-center gap-2 select-none whitespace-nowrap',
    'min-h-(--alvo-toque) px-5 rounded-pilula border border-transparent',
    'font-sans text-base font-bold leading-(--altura-apertada) tracking-[0.01em] no-underline cursor-pointer',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-(--duracao-rapida) ease-(--entrada)',
    'active:translate-y-px',
    'focus-visible:outline-none focus-visible:shadow-(--anel-foco)',
    'disabled:cursor-not-allowed disabled:opacity-55 disabled:active:translate-y-0',
    'aria-disabled:pointer-events-none aria-disabled:opacity-55',
    "[&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      intencao: {
        // O amarelo da marca preenchendo, com texto escuro por cima. É a única
        // ação amarela de uma tela — duas primárias significam nenhuma.
        primaria:
          'bg-destaque text-destaque-texto shadow-baixa hover:not-disabled:bg-destaque-forte hover:not-disabled:shadow-cartao',
        secundaria:
          'border-borda bg-superficie text-texto hover:not-disabled:border-acento hover:not-disabled:bg-superficie-alta hover:not-disabled:text-acento',
        sutil: 'bg-transparent text-acento hover:not-disabled:bg-acento-suave',
        destrutiva:
          'bg-perigo text-perigo-contraste hover:not-disabled:bg-[color-mix(in_srgb,var(--cor-perigo)_82%,var(--cor-texto))]',
      },
      tamanho: {
        medio: '',
        // Dedo não tem a precisão do ponteiro: onde há toque, nenhum botão fica
        // abaixo do alvo do WCAG, nem mesmo o compacto (AC-269).
        compacto: 'min-h-(--alvo-minimo) px-3 text-rotulo pointer-coarse:min-h-(--alvo-toque) pointer-coarse:px-4',
      },
    },
  },
);

export interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  intencao?: string;
  tamanho?: string;
  /**
   * Ação em curso. O rótulo continua legível — botão que vira spinner esconde o
   * que estava prestes a acontecer —, e o clique não passa duas vezes (AC-268).
   */
  ocupado?: boolean;
  desabilitado?: boolean;
  /** Renderiza o filho (um link) com a aparência e as regras do botão. */
  asChild?: boolean;
  [dado: `data-${string}`]: unknown;
}

/** A única origem de botão do produto (AC-266). */
export function Botao({
  intencao = 'secundaria',
  tamanho = 'medio',
  ocupado = false,
  desabilitado = false,
  asChild = false,
  className,
  children,
  onClick,
  ...resto
}: PropsBotao) {
  const i = exigirIntencao(intencao);
  const t = exigirTamanho(tamanho);
  const bloqueado = ocupado || desabilitado;

  // Só <button> tem `disabled` de verdade. Num link, desabilitar é tirar do foco
  // e do ponteiro e dizer isso ao leitor de tela.
  const bloqueio = asChild
    ? { 'aria-disabled': bloqueado || undefined, tabIndex: bloqueado ? -1 : undefined }
    : { disabled: bloqueado };

  const aoClicar = (evento: MouseEvent<HTMLButtonElement>) => {
    if (bloqueado) {
      evento.preventDefault();
      return;
    }
    onClick?.(evento);
  };

  const Componente = asChild ? Slot.Root : 'button';
  const giro = ocupado && <LoaderCircle data-giro aria-hidden="true" className="animate-spin" />;

  return (
    <Componente
      data-intencao={i}
      data-tamanho={t}
      data-ocupado={ocupado ? '' : undefined}
      aria-busy={ocupado || undefined}
      className={cn(estiloBotao({ intencao: i, tamanho: t }), className)}
      onClick={aoClicar}
      {...bloqueio}
      {...resto}
    >
      {giro}
      {asChild ? <Slot.Slottable>{children}</Slot.Slottable> : children}
    </Componente>
  );
}
