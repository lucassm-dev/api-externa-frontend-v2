import { Marquee } from '@/components/ui/marquee';
import { formatarMoeda } from '@/core/formatacao/formatacao';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { Variacao } from '@/shared/variacao';
import { BarraDeMercado, ItemDeMercado } from '../painel.model';

/**
 * Q-029: a barra corre a velocidade constante, não em duração fixa — com
 * duração fixa, mais itens acelerariam a barra. Este é o único ponto de ajuste.
 */
const SEGUNDOS_POR_CHIP = 4.5;

function Chip({ item, real }: { item: ItemDeMercado; real: boolean }) {
  return (
    <li
      data-item={real ? item.simbolo : undefined}
      className="flex items-baseline gap-2 rounded-pequeno bg-[color-mix(in_srgb,var(--cor-barra-mercado-borda)_30%,var(--cor-barra-mercado-fundo))] px-2 text-rotulo whitespace-nowrap"
    >
      {/* Decorativo: o símbolo ao lado já diz qual é o ativo. Logo que não carrega some. */}
      {item.logoUrl && (
        <img
          data-logo-mercado={real ? '' : undefined}
          src={item.logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={(evento) => (evento.currentTarget.hidden = true)}
          className="size-4 self-center rounded-pilula object-cover"
        />
      )}
      <span data-simbolo={real ? '' : undefined} className="font-bold text-barra-mercado-texto">
        {item.simbolo}
      </span>
      <span data-preco={real ? '' : undefined} className="font-numero text-barra-mercado-texto">
        {formatarMoeda(item.preco, 'BRL')}
      </span>
      {/* A superfície é escura nos dois temas: alta, baixa e estável vêm da barra, não do tema. */}
      <Variacao
        valor={item.variacaoPercentual}
        percentual
        className="self-center rounded-pilula bg-[color-mix(in_srgb,var(--cor-barra-mercado-texto)_12%,transparent)] px-1.5 text-rotulo [--cor-alta:var(--cor-barra-mercado-alta)] [--cor-baixa:var(--cor-barra-mercado-baixa)] [--cor-estavel:var(--cor-barra-mercado-estavel)]"
      />
    </li>
  );
}

/**
 * Contexto de mercado, igual para todo investidor. Item que a fonte não
 * devolveu simplesmente não aparece, e o que faltou vira aviso discreto — nunca
 * erro, e nunca derruba a tela (ADR-006). Sem borda e sem horário fixo (AC-236).
 */
export function BarraMercado({ barra }: { barra: BarraDeMercado | null }) {
  if (!barra) return null;
  const itens = barra.itens ?? [];
  const avisos = barra.avisos ?? [];

  return (
    <>
      <section
        data-barra-mercado
        aria-label="Mercado"
        className="grid min-h-(--altura-cotacoes) w-full max-w-full grid-cols-[minmax(0,1fr)] items-center overflow-hidden bg-barra-mercado-fundo p-0 text-barra-mercado-texto"
      >
        <Marquee
          duracao={Math.max(itens.length, 1) * SEGUNDOS_POR_CHIP}
          conteudo={itens.map((item) => (
            <Chip key={item.simbolo} item={item} real />
          ))}
          copia={itens.map((item) => (
            <Chip key={item.simbolo} item={item} real={false} />
          ))}
        />
      </section>

      {avisos.map((aviso) => (
        <div key={aviso} data-aviso-mercado className="mt-2 text-rotulo">
          <MensagemFeedback nivel="aviso" mensagem={aviso} />
        </div>
      ))}
    </>
  );
}
