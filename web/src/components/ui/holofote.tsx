import { motion } from 'motion/react';
import type { CSSProperties } from 'react';
import { usePrefereMovimentoReduzido } from '@/lib/movimento';

/*
 * Adaptado do Spotlight do Aceternity UI (registro `spotlight-new`, conferido em
 * 2026-11-22). Mudanças: as cores hsla fixas viraram o amarelo do token via
 * color-mix (P-003), e com "reduzir movimento" o holofote fica parado (AC-302).
 * Anima só deslocamento (x) e opacidade — nada de layout (AC-253).
 */
const feixe = (forte: number, fraco: number) =>
  `radial-gradient(50% 50% at 50% 50%, color-mix(in srgb, var(--cor-destaque) ${forte}%, transparent) 0, color-mix(in srgb, var(--cor-destaque) ${fraco}%, transparent) 80%, transparent 100%)`;

const PRINCIPAL =
  'radial-gradient(68.54% 68.72% at 55.02% 31.46%, color-mix(in srgb, var(--cor-destaque) 14%, transparent) 0, color-mix(in srgb, var(--cor-destaque) 4%, transparent) 50%, transparent 80%)';

interface Props {
  deslocamento?: number;
  duracao?: number;
}

function Lado({ lado, deslocamento, duracao, parado }: { lado: 'esquerda' | 'direita'; deslocamento: number; duracao: number; parado: boolean }) {
  const giro = lado === 'esquerda' ? -45 : 45;
  const origem = lado === 'esquerda' ? 'top left' : 'top right';
  const ancora: CSSProperties = lado === 'esquerda' ? { left: 0 } : { right: 0 };
  const placas: CSSProperties[] = [
    { transform: `translateY(-350px) rotate(${giro}deg)`, background: PRINCIPAL, width: 560, height: 1380 },
    { transform: `rotate(${giro}deg) translate(${lado === 'esquerda' ? '5%' : '-5%'}, -50%)`, background: feixe(10, 3), width: 240, height: 1380, transformOrigin: origem },
    { transform: `rotate(${giro}deg) translate(${lado === 'esquerda' ? '-180%' : '180%'}, -70%)`, background: feixe(6, 2), width: 240, height: 1380, transformOrigin: origem },
  ];

  return (
    <motion.div
      data-lado={lado}
      animate={parado ? undefined : { x: [0, lado === 'esquerda' ? deslocamento : -deslocamento, 0] }}
      transition={{ duration: duracao, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      className="pointer-events-none absolute top-0 h-full w-full"
      style={ancora}
    >
      {placas.map((estilo, indice) => (
        <div key={indice} className="absolute top-0" style={{ ...ancora, ...estilo }} />
      ))}
    </motion.div>
  );
}

export function Holofote({ deslocamento = 100, duracao = 7 }: Props) {
  const parado = usePrefereMovimentoReduzido();

  return (
    <motion.div
      data-holofote
      data-movimento={parado ? 'parado' : 'ativo'}
      aria-hidden="true"
      initial={parado ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <Lado lado="esquerda" deslocamento={deslocamento} duracao={duracao} parado={parado} />
      <Lado lado="direita" deslocamento={deslocamento} duracao={duracao} parado={parado} />
    </motion.div>
  );
}
