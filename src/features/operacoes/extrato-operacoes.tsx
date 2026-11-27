import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { BotaoIcone } from '@/components/ui/botao-icone';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { CabecalhoOrdenavel, SentidoOrdenacao, Tabela } from '@/components/ui/tabela';
import { formatarDataHora, formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { EstadoVazio } from '@/shared/estado-vazio';
import { Monograma } from '@/shared/monograma';
import { OrdenacaoTabela } from '@/shared/ordenacao';
import { OPERACOES_POR_PAGINA, OperacaoDoExtrato } from './operacoes.model';

export const AVISO_DE_RECALCULO = 'Excluir esta operação vai recalcular a posição e o resultado da carteira. Não há como desfazer.';

interface Props {
  titulo?: string;
  /** Ao lado do título, como o link para os Relatórios em Operações (AC-400). */
  aoLadoDoTitulo?: ReactNode;
  /** A barra de filtros; o estado dela mora na página (na busca do endereço). */
  filtros?: ReactNode;
  /** Presente quando há filtro aplicado: a tela conta o recorte e oferece limpar (AC-344). */
  recorte?: { aoLimpar: () => void } | null;
  /** `totalElements` do servidor: o total do recorte, não só da página. */
  totalDeItens?: number;
  operacoes: OperacaoDoExtrato[];
  carteiras?: Carteira[];
  pagina?: number;
  totalDePaginas?: number;
  carregando?: boolean;
  excluindo?: boolean;
  aoMudarPagina: (pagina: number) => void;
  /** Sem editar nem excluir, a tabela é só leitura, como no relatório (AC-399). */
  aoEditar?: (operacao: OperacaoDoExtrato) => void;
  aoExcluir?: (operacao: OperacaoDoExtrato) => void;
  aoRegistrarPrimeira?: () => void;
}

/** Carteira fora da listagem carregada aparece pelo identificador, nunca em branco. */
function nomeDaCarteira(carteiras: Carteira[], operacao: OperacaoDoExtrato): string {
  return carteiras.find((carteira) => carteira.id === operacao.carteiraId)?.nome ?? `Carteira ${operacao.carteiraId}`;
}

const SEM_CARTEIRAS: Carteira[] = [];

const ARIA_PARA_SENTIDO: Record<string, SentidoOrdenacao> = { ascending: 'crescente', descending: 'decrescente', none: 'nenhum' };

function varianteDoResultado(lucro: number): VarianteSelo {
  return lucro > 0 ? 'alta' : lucro < 0 ? 'baixa' : 'estavel';
}

/**
 * Data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total
 * e moeda, do mais recente para o mais antigo, paginado (PRD-007).
 *
 * Os filtros são do servidor (ADR-018 do backend): nada aqui filtra a página
 * carregada, que mentiria sobre o que existe.
 *
 * A ordenação vale só sobre a página já carregada — nunca busca de novo nem
 * troca de página (AC-243, ADR-010).
 */
export function ExtratoOperacoes({
  titulo = 'Extrato de movimentações',
  aoLadoDoTitulo,
  filtros,
  recorte = null,
  totalDeItens = 0,
  operacoes,
  carteiras = SEM_CARTEIRAS,
  pagina = 0,
  totalDePaginas = 0,
  carregando = false,
  excluindo = false,
  aoMudarPagina,
  aoEditar,
  aoExcluir,
  aoRegistrarPrimeira,
}: Props) {
  const [emExclusao, setEmExclusao] = useState<OperacaoDoExtrato | null>(null);
  const comAcoes = Boolean(aoEditar || aoExcluir);
  // A ordenação é estado imperativo do utilitário; a versão faz a tela reprojetar a cada acionamento.
  const [versao, setVersao] = useState(0);

  const ordenacao = useMemo(
    () =>
      new OrdenacaoTabela<OperacaoDoExtrato>([
        { id: 'quando', valor: (o) => o.dataHora },
        { id: 'carteira', valor: (o) => nomeDaCarteira(carteiras, o) },
        { id: 'tipo', valor: (o) => o.tipo },
        { id: 'ticker', valor: (o) => o.ticker },
        { id: 'quantidade', valor: (o) => o.quantidade },
        { id: 'preco', valor: (o) => o.precoUnitario },
        { id: 'total', valor: (o) => o.valorTotal },
        { id: 'resultado', valor: (o) => (o.tipo === 'VENDA' ? (o.lucroRealizado ?? null) : null) },
      ]),
    [carteiras],
  );

  // `versao` entra nas dependências só para disparar a reordenação.
  const linhas = useMemo(() => ordenacao.ordenar(operacoes), [ordenacao, operacoes, versao]);

  const cabecalho = (coluna: string, rotulo: string, numero = false) => (
    <CabecalhoOrdenavel
      rotulo={rotulo}
      numero={numero}
      sentido={ARIA_PARA_SENTIDO[ordenacao.ariaSort(coluna)]}
      aoOrdenar={() => {
        ordenacao.alternar(coluna);
        setVersao((v) => v + 1);
      }}
    />
  );

  return (
    <section data-extrato aria-labelledby="titulo-extrato" className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="titulo-extrato" className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">
          {titulo}
        </h2>
        {aoLadoDoTitulo}
      </div>

      {filtros}

      {recorte && !carregando && operacoes.length > 0 && (
        <p data-contagem-recorte className="m-0 text-apoio text-texto-fraco" aria-live="polite">
          {totalDeItens === 1 ? '1 operação neste recorte' : `${formatarNumero(totalDeItens, 0)} operações neste recorte`}
        </p>
      )}

      {carregando ? (
        <div data-extrato-carregando>
          <Esqueleto formato="tabela" />
        </div>
      ) : operacoes.length === 0 && recorte ? (
        <div data-extrato-vazio-recorte>
          <EstadoVazio
            titulo="Nenhuma operação neste recorte"
            descricao="Mude os filtros ou limpe todos para ver o extrato completo."
            rotuloAcao="Limpar filtros"
            aoAcionar={recorte.aoLimpar}
          />
        </div>
      ) : operacoes.length === 0 ? (
        <div data-extrato-vazio>
          <EstadoVazio
            titulo="Nenhuma operação registrada"
            descricao="Quando você registrar uma compra ou venda, ela aparece aqui no extrato."
            {...(aoRegistrarPrimeira && { rotuloAcao: 'Registrar primeira operação', aoAcionar: aoRegistrarPrimeira })}
          />
        </div>
      ) : (
        <>
          <Tabela aria-labelledby="titulo-extrato">
            <thead>
              <tr>
                {cabecalho('quando', 'Data e hora')}
                {cabecalho('carteira', 'Carteira')}
                {cabecalho('tipo', 'Tipo')}
                {cabecalho('ticker', 'Ação')}
                {cabecalho('quantidade', 'Quantidade', true)}
                {cabecalho('preco', 'Preço unitário', true)}
                {cabecalho('total', 'Valor total', true)}
                {cabecalho('resultado', 'Resultado', true)}
                {comAcoes && (
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {linhas.map((operacao) => {
                const quando = formatarDataHora(operacao.dataHora);
                const resultado = operacao.tipo === 'VENDA' && operacao.lucroRealizado !== undefined ? operacao.lucroRealizado : null;
                return (
                  <tr key={operacao.id} data-operacao={operacao.id}>
                    <td data-quando className="whitespace-nowrap text-texto-fraco tabular-nums">
                      {quando}
                    </td>
                    <td data-carteira className="max-w-48 truncate">
                      {nomeDaCarteira(carteiras, operacao)}
                    </td>
                    <td data-tipo>
                      <Selo variante={operacao.tipo === 'COMPRA' ? 'alta' : 'baixa'} texto={operacao.tipo} />
                    </td>
                    <td data-ticker className="w-full">
                      <span className="flex items-center gap-3">
                        <Monograma ticker={operacao.ticker} />
                        <strong className="font-semibold">{operacao.ticker}</strong>
                      </span>
                    </td>
                    <td data-quantidade data-numero>
                      {formatarNumero(operacao.quantidade, 0)}
                    </td>
                    <td data-preco data-numero>
                      {formatarMoeda(operacao.precoUnitario, operacao.moeda)}
                    </td>
                    <td data-total data-numero>
                      {formatarMoeda(operacao.valorTotal, operacao.moeda)}
                    </td>
                    <td data-numero>
                      {resultado !== null && (
                        <span data-resultado-realizado>
                          <Selo variante={varianteDoResultado(resultado)} texto={formatarMoeda(resultado, operacao.moeda)} />
                        </span>
                      )}
                    </td>
                    {comAcoes && (
                      <td>
                        <span className="flex justify-end gap-1">
                          {aoEditar && (
                            <span data-editar className="contents">
                              <BotaoIcone rotulo={`Editar operação de ${operacao.ticker} em ${quando}`} aoPressionar={() => aoEditar(operacao)}>
                                <Pencil aria-hidden="true" focusable="false" />
                              </BotaoIcone>
                            </span>
                          )}
                          {aoExcluir && (
                            <span data-excluir className="contents">
                              <BotaoIcone rotulo={`Excluir operação de ${operacao.ticker} em ${quando}`} aoPressionar={() => setEmExclusao(operacao)}>
                                <Trash2 aria-hidden="true" focusable="false" />
                              </BotaoIcone>
                            </span>
                          )}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Tabela>

          {totalDePaginas > 1 && (
            <div data-paginacao>
              <Paginador
                pagina={pagina + 1}
                totalPaginas={totalDePaginas}
                totalItens={totalDeItens}
                itensPorPagina={OPERACOES_POR_PAGINA}
                aoMudarPagina={(numero) => aoMudarPagina(numero - 1)}
              />
            </div>
          )}
        </>
      )}

      {emExclusao && (
        <DialogoConfirmacao
          titulo="Excluir esta operação?"
          consequencia={AVISO_DE_RECALCULO}
          rotuloConfirmar="Excluir operação"
          ocupado={excluindo}
          aoConfirmar={() => {
            aoExcluir?.(emExclusao);
            setEmExclusao(null);
          }}
          aoCancelar={() => setEmExclusao(null)}
        />
      )}
    </section>
  );
}
