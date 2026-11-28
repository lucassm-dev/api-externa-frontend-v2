import { CircleCheck } from 'lucide-react';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarDataHora, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { cn } from '@/lib/utils';
import { Operacao, opcaoDeTipo } from './operacoes.model';

const ROTULO = 'text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';

/**
 * O ponto mais delicado do produto. Uma operação pode ser **registrada com
 * sucesso e trazer avisos**: o preço veio do cache, a cota da fonte estourou
 * (EXT-009), a fonte caiu (EXT-010), o câmbio não é o mais recente (EXT-011).
 *
 * Isso não é erro — a operação aconteceu. Pintar de vermelho ou usar o
 * componente de erro faz o investidor achar que a compra falhou, registrar de
 * novo, e ficar com duas compras reais no extrato (ADR-006). Por isso os avisos
 * saem no nível "aviso" da fundação, junto do resultado.
 *
 * O preço exibido é o `precoUnitario` da resposta, não a estimativa que estava
 * no formulário: o backend pode ter buscado preço novo (ASM-040).
 */
export function ResultadoOperacao({ operacao }: { operacao: Operacao }) {
  const ehVenda = operacao.tipo === 'VENDA';
  const moeda = (valor: number) => formatarMoeda(valor, operacao.moeda);
  const avisos = operacao.avisos ?? [];

  /** Ausente é ausente: nada de traço nem zero no lugar de um número que não veio. */
  const numeros: Array<{ rotulo: string; dado: string; valor: string; destaque?: boolean }> = [
    { rotulo: 'Ação', dado: 'ticker', valor: operacao.ticker },
    { rotulo: 'Quantidade', dado: 'quantidade', valor: formatarNumero(operacao.quantidade, 0) },
    { rotulo: 'Preço unitário efetivo', dado: 'preco-efetivo', valor: moeda(operacao.precoUnitario) },
    { rotulo: 'Valor total', dado: 'total', valor: moeda(operacao.valorTotal) },
  ];
  if (ehVenda && operacao.lucroRealizado !== undefined) {
    numeros.push({ rotulo: 'Resultado realizado desta venda', dado: 'lucro-realizado', valor: moeda(operacao.lucroRealizado), destaque: true });
  }
  if (ehVenda && operacao.precoMedioCompraNoMomento !== undefined) {
    numeros.push({ rotulo: 'Preço médio de compra vigente', dado: 'preco-medio', valor: moeda(operacao.precoMedioCompraNoMomento) });
  }

  return (
    <section data-resultado aria-labelledby="titulo-resultado" className="grid content-start gap-4 rounded-grande border border-sucesso-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="titulo-resultado" data-confirmacao className="m-0 flex items-center gap-2 text-medio font-semibold text-sucesso-texto">
          <CircleCheck aria-hidden="true" focusable="false" className="size-5 flex-none" />
          {opcaoDeTipo(operacao.tipo).rotulo} registrada
        </h2>
        <span data-quando className="text-apoio text-texto-fraco tabular-nums">
          {formatarDataHora(operacao.dataHora)}
        </span>
      </header>

      <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-x-4 gap-y-3">
        {numeros.map(({ rotulo, dado, valor, destaque }) => (
          <div key={dado} className="grid content-between gap-0.5">
            <dt className={ROTULO}>{rotulo}</dt>
            <dd {...{ [`data-${dado}`]: '' }} className={cn('m-0 font-numero text-medio tabular-nums', destaque ? 'font-bold' : 'font-semibold')}>
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      {avisos.length > 0 && (
        <div data-avisos className="grid gap-2">
          {avisos.map((aviso) => (
            <MensagemFeedback key={aviso} nivel="aviso" mensagem={aviso} />
          ))}
        </div>
      )}
    </section>
  );
}
