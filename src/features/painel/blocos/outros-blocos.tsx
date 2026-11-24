import { ArrowRight, Inbox } from 'lucide-react';
import { Link } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { formatarDataHora, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { Monograma } from '@/shared/monograma';
import { CarteiraResumida, MOVIMENTACOES_NO_PAINEL, Movimentacao } from '../painel.model';
import { ProximoPasso } from '../proximo-passo';

const TITULO = 'm-0 text-medio font-semibold tracking-(--entrelinha-titulo)';

/**
 * Um cartão por carteira. A ordem é a que o servidor devolveu — mais recente
 * primeiro, por identificador — e o cliente não reordena: o valor de mercado
 * muda com o preço e faria a carteira pular de lugar sozinha (PRD-003).
 */
export function CarteirasDoInvestidor({ carteiras }: { carteiras: CarteiraResumida[] }) {
  return (
    <section data-carteiras>
      <h2 className={`${TITULO} mb-3`}>Carteiras</h2>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,15rem),1fr))] gap-3 p-0">
        {carteiras.map((carteira) => (
          <li
            key={carteira.id}
            data-carteira={carteira.id}
            className="grid gap-1 rounded-grande border border-borda bg-superficie p-4 shadow-baixa transition-shadow duration-(--duracao-rapida) hover:shadow-cartao"
          >
            <span data-nome className="truncate font-semibold text-texto">
              {carteira.nome}
            </span>
            <span data-corretora className="truncate text-apoio text-texto-fraco">
              {carteira.nomeCorretora}
            </span>
            <Link data-abrir to={`/carteiras/${carteira.id}`} className="mt-2 inline-flex items-center gap-1 text-apoio font-semibold no-underline hover:underline">
              Abrir carteira
              <ArrowRight aria-hidden="true" focusable="false" className="size-3.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Um convite por vez, na linguagem do estado vazio: painel sem carteira é
 * caminho com ícone, explicação e ação seguinte, não um bloco vazio (ADR-003).
 */
export function ConviteProximoPasso({ passo }: { passo: ProximoPasso }) {
  return (
    <section
      data-proximo-passo
      data-passo={passo.id}
      className="grid justify-items-center gap-2 rounded-grande border border-dashed border-borda bg-superficie px-6 py-12 text-center"
    >
      <span className="mb-2 grid size-12 place-items-center rounded-pilula bg-superficie-alta text-texto-fraco">
        <Inbox data-icone aria-hidden="true" focusable="false" className="size-6" strokeWidth={1.75} />
      </span>
      <h2 data-titulo className={TITULO}>
        {passo.titulo}
      </h2>
      <p data-explicacao className="m-0 max-w-[52ch] text-texto-fraco">
        {passo.explicacao}
      </p>
      <Botao asChild intencao="primaria" className="mt-3">
        <Link data-acao to={passo.rota}>
          <span>{passo.acao}</span>
          <ArrowRight aria-hidden="true" focusable="false" />
        </Link>
      </Botao>
    </section>
  );
}

function varianteDoTipo(tipo: string): VarianteSelo {
  if (tipo === 'COMPRA') return 'alta';
  if (tipo === 'VENDA') return 'baixa';
  return 'estavel';
}

/**
 * Cinco linhas, nunca mais: cabem sem empurrar as carteiras para fora da
 * primeira dobra, e quem quer mais vai ao extrato (PRD-003). Campo que o
 * servidor não mandou some da linha em vez de virar traço sem explicação.
 */
export function UltimasMovimentacoes({ movimentacoes }: { movimentacoes: Movimentacao[] }) {
  return (
    <section data-movimentacoes>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={TITULO}>Últimas movimentações</h2>
        <Link data-ver-extrato to="/operacoes" className="text-apoio font-semibold">
          Ver extrato completo
        </Link>
      </header>
      <ul className="m-0 grid list-none overflow-hidden rounded-grande border border-borda bg-superficie p-0 shadow-baixa">
        {movimentacoes.slice(0, MOVIMENTACOES_NO_PAINEL).map((movimentacao) => (
          <li
            key={movimentacao.id}
            data-movimentacao={movimentacao.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-borda px-4 py-3 last:border-b-0"
          >
            <span data-quando className="font-numero text-apoio text-texto-fraco">
              {formatarDataHora(movimentacao.dataHora)}
            </span>
            <span data-tipo={movimentacao.tipo}>
              <Selo variante={varianteDoTipo(movimentacao.tipo)} texto={movimentacao.tipo} />
            </span>
            {movimentacao.ticker && (
              <span className="ativo inline-flex items-center gap-2">
                <Monograma ticker={movimentacao.ticker} />
                <span data-ticker className="font-semibold">
                  {movimentacao.ticker}
                </span>
              </span>
            )}
            {movimentacao.quantidade !== undefined && (
              <span data-quantidade className="font-numero text-texto-fraco">
                {formatarNumero(movimentacao.quantidade, 0)}
              </span>
            )}
            {movimentacao.valorTotal !== undefined && (
              <span data-total className="ml-auto font-numero font-semibold">
                {formatarMoeda(movimentacao.valorTotal, movimentacao.moeda ?? 'BRL')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
