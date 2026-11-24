import { Info, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { BotaoIcone } from '@/components/ui/botao-icone';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { Tabela } from '@/components/ui/tabela';
import { formatarDataHora, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { Monograma } from '@/shared/monograma';
import { ExtratoBuscado, MovimentacaoDoExtrato } from './carteiras.model';
import { recortarPorCarteira } from './movimentacoes-da-carteira';

export const AVISO_DE_RECALCULO_NA_CARTEIRA = 'Excluir esta operação vai recalcular a posição e o resultado da carteira. Não há como desfazer.';

function varianteDoTipo(tipo: string): VarianteSelo {
  if (tipo === 'COMPRA') return 'alta';
  if (tipo === 'VENDA') return 'baixa';
  return 'estavel';
}

interface Props {
  extrato: ExtratoBuscado;
  carteiraId: number;
  excluindo?: boolean;
  carregando?: boolean;
  aoEditar: (movimentacao: MovimentacaoDoExtrato) => void;
  aoExcluir: (movimentacao: MovimentacaoDoExtrato) => void;
}

/**
 * O extrato é global e não aceita filtro por carteira (ADR-010): o recorte é
 * feito aqui. Quando o servidor tem mais operações do que foram buscadas, a
 * tela declara isso — apresentar recorte parcial como completo faz o
 * investidor procurar em vão um lançamento que existe.
 *
 * Corrigir e excluir moram aqui além do extrato global porque é nesta tela que
 * o recálculo fica visível: mexer numa operação refaz preço médio, posição e
 * resultado da carteira inteira (Q-020).
 */
export function MovimentacoesCarteira({ extrato, carteiraId, excluindo = false, carregando = false, aoEditar, aoExcluir }: Props) {
  const [emExclusao, setEmExclusao] = useState<MovimentacaoDoExtrato | null>(null);
  const recorte = recortarPorCarteira(extrato, carteiraId);

  return (
    <section data-movimentacoes aria-labelledby="titulo-movimentacoes" className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-baixa max-sm:p-4">
      <h2 id="titulo-movimentacoes" className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">
        Movimentações desta carteira
      </h2>

      {!carregando && recorte.parcial && (
        <p data-recorte-parcial className="m-0 flex items-start gap-2 text-apoio text-texto-fraco">
          <Info aria-hidden="true" focusable="false" className="mt-0.5 size-4 flex-none" />
          <span>
            Seu extrato tem mais operações do que cabe aqui: estas são as {recorte.buscadas} mais recentes de todas as suas carteiras, já
            filtradas para esta. <Link to="/operacoes">Ver o extrato completo</Link>
          </span>
        </p>
      )}

      {carregando ? (
        <div data-carregando-movimentacoes>
          <Esqueleto formato="tabela" />
        </div>
      ) : recorte.movimentacoes.length === 0 ? (
        <div data-sem-movimentacao className="grid justify-items-start gap-3 rounded border border-dashed border-borda p-5">
          <p className="m-0 text-texto-fraco">Nenhuma movimentação registrada nesta carteira.</p>
          <Botao asChild intencao="secundaria" tamanho="compacto">
            <Link data-proximo-passo to="/operacoes">
              Registrar uma operação
            </Link>
          </Botao>
        </div>
      ) : (
        <Tabela aria-labelledby="titulo-movimentacoes">
          <thead>
            <tr>
              <th scope="col">Tipo</th>
              <th scope="col" className="w-full">Ativo</th>
              <th scope="col" data-numero>Quantidade</th>
              <th scope="col" data-numero>Total</th>
              <th scope="col">Quando</th>
              <th scope="col">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {recorte.movimentacoes.map((movimentacao) => {
              const alvo = [movimentacao.tipo.toLowerCase(), movimentacao.ticker].filter(Boolean).join(' de ');
              return (
                <tr key={movimentacao.id} data-movimentacao={movimentacao.id}>
                  <td>
                    <Selo variante={varianteDoTipo(movimentacao.tipo)} texto={movimentacao.tipo} />
                  </td>
                  <td>
                    {movimentacao.ticker && (
                      <span className="flex items-center gap-3">
                        <Monograma ticker={movimentacao.ticker} />
                        <strong className="font-semibold">{movimentacao.ticker}</strong>
                      </span>
                    )}
                  </td>
                  <td data-numero>{movimentacao.quantidade !== undefined && formatarNumero(movimentacao.quantidade, 0)}</td>
                  <td data-numero>{movimentacao.valorTotal !== undefined && formatarMoeda(movimentacao.valorTotal, movimentacao.moeda ?? 'BRL')}</td>
                  <td className="whitespace-nowrap text-texto-fraco">{formatarDataHora(movimentacao.dataHora)}</td>
                  <td>
                    <span className="flex justify-end gap-1">
                      <span data-editar className="contents">
                        <BotaoIcone rotulo={`Corrigir ${alvo}`} aoPressionar={() => aoEditar(movimentacao)}>
                          <Pencil aria-hidden="true" focusable="false" />
                        </BotaoIcone>
                      </span>
                      <span data-excluir className="contents">
                        <BotaoIcone rotulo={`Excluir ${alvo}`} aoPressionar={() => setEmExclusao(movimentacao)}>
                          <Trash2 aria-hidden="true" focusable="false" />
                        </BotaoIcone>
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}

      {emExclusao && (
        <DialogoConfirmacao
          titulo="Excluir esta operação?"
          consequencia={AVISO_DE_RECALCULO_NA_CARTEIRA}
          rotuloConfirmar="Excluir operação"
          ocupado={excluindo}
          aoConfirmar={() => {
            setEmExclusao(null);
            aoExcluir(emExclusao);
          }}
          aoCancelar={() => setEmExclusao(null)}
        />
      )}
    </section>
  );
}
