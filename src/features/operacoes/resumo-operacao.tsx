import { ReceiptText } from 'lucide-react';
import { Moeda, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { Monograma } from '@/shared/monograma';
import { ValorComHorario } from '@/shared/valor-com-horario';

const CARTAO = 'grid content-start gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4';
const ROTULO = 'm-0 text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';

export interface Estimativa {
  precoUnitario: number;
  valorTotal: number;
  /** `null`: o preço é o que o investidor informou, não uma cotação. */
  obtidoEm: string | null;
}

interface Props {
  ehVenda: boolean;
  acao: { ticker: string; nomeEmpresa: string } | null;
  moeda: Moeda;
  cotacao: { valor: number; obtidoEm: string } | null;
  /** `undefined`: sem carteira escolhida ou posições ainda chegando; `null`: a carteira não tem a ação. */
  posicao: { quantidade: number; precoMedio: number } | null | undefined;
  carteiraEscolhida: boolean;
  estimativa: Estimativa | null;
}

/**
 * O que o investidor está prestes a registrar, ao lado do formulário (AC-402 a
 * AC-404). Tudo aqui sai do que o formulário já leu; nada é pedido de novo.
 */
export function ResumoOperacao({ ehVenda, acao, moeda, cotacao, posicao, carteiraEscolhida, estimativa }: Props) {
  if (!acao) {
    return (
      <aside data-resumo-operacao aria-label="Resumo da operação" className={CARTAO}>
        <div data-resumo-vazio className="grid justify-items-start gap-3 py-2">
          <ReceiptText aria-hidden="true" focusable="false" className="size-6 text-texto-fraco" />
          <h2 className="m-0 text-medio font-semibold">Resumo da operação</h2>
          <p className="m-0 max-w-[45ch] text-texto-fraco">
            Escolha a ação para ver aqui a última cotação, a sua posição na carteira e o total estimado antes de confirmar.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside data-resumo-operacao aria-label="Resumo da operação" aria-live="polite" className={CARTAO}>
      <header data-resumo-acao className="flex items-center gap-3">
        <Monograma ticker={acao.ticker} />
        <div className="grid min-w-0">
          <h2 className="m-0 text-medio font-semibold">{acao.ticker}</h2>
          {acao.nomeEmpresa && <p className="m-0 truncate text-apoio text-texto-fraco">{acao.nomeEmpresa}</p>}
        </div>
      </header>

      {/* Com estimativa pela cotação, o preço já aparece nela: repetir só duplicaria o número. */}
      {cotacao && !estimativa?.obtidoEm && (
        <div className="grid gap-1">
          <p className={ROTULO}>Última cotação</p>
          <span className="text-grande font-bold">
            <ValorComHorario valor={cotacao.valor} moeda={moeda} obtidoEm={cotacao.obtidoEm} />
          </span>
        </div>
      )}

      <div data-resumo-posicao className="grid gap-2 border-t border-borda pt-4">
        <p className={ROTULO}>Posição nesta carteira</p>
        {!carteiraEscolhida ? (
          <p className="m-0 text-apoio text-texto-fraco">Escolha a carteira para ver quanto você já tem desta ação.</p>
        ) : posicao === undefined ? (
          <p className="m-0 text-apoio text-texto-fraco">Lendo a posição…</p>
        ) : posicao === null ? (
          <p className="m-0 text-apoio text-texto-fraco">Esta carteira ainda não tem {acao.ticker}.</p>
        ) : (
          <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="grid gap-0.5">
              <dt className="text-apoio text-texto-fraco">{ehVenda ? 'Disponível para venda' : 'Quantidade'}</dt>
              <dd className="m-0 font-numero text-medio font-semibold tabular-nums">{formatarNumero(posicao.quantidade, 0)}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-apoio text-texto-fraco">Preço médio</dt>
              <dd className="m-0 font-numero text-medio font-semibold tabular-nums">{formatarMoeda(posicao.precoMedio, moeda)}</dd>
            </div>
          </dl>
        )}
      </div>

      {estimativa && (
        <div data-estimativa className="grid gap-2 rounded border border-borda bg-fundo p-4">
          <h3 className={ROTULO}>Estimativa desta operação</h3>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            {estimativa.obtidoEm ? (
              <ValorComHorario valor={estimativa.precoUnitario} moeda={moeda} obtidoEm={estimativa.obtidoEm} />
            ) : (
              <span data-preco-informado className="text-apoio text-texto-fraco">
                Preço que você informou
              </span>
            )}
            <p className="m-0 flex items-baseline gap-2">
              <span className="text-apoio text-texto-fraco">Total estimado</span>
              <strong data-total-estimado className="font-numero text-medio font-semibold tabular-nums">
                {formatarMoeda(estimativa.valorTotal, moeda)}
              </strong>
            </p>
          </div>
          <p data-ressalva-estimativa className="m-0 text-rotulo text-texto-fraco">
            {estimativa.obtidoEm
              ? 'Este é o preço da última cotação conhecida — uma estimativa. O preço efetivamente registrado pode ser outro, e ele aparece na confirmação.'
              : 'O total usa o preço que você informou.'}
          </p>
        </div>
      )}
    </aside>
  );
}
