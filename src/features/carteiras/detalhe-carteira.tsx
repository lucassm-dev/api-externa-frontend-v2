import { ArrowLeft, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { feedback } from '@/core/feedback/feedback.service';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarReal } from '@/core/formatacao/formatacao';
import { EditarOperacao } from '@/features/operacoes/editar-operacao';
import { AlteracaoDeOperacao } from '@/features/operacoes/operacoes.model';
import { operacoesService } from '@/features/operacoes/operacoes.service';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { Variacao } from '@/shared/variacao';
import { Carteira, ConsolidadoDaCarteira, ExtratoBuscado, LucroRealizado, MovimentacaoDoExtrato, Posicao, rotuloDoMercado } from './carteiras.model';
import { carteirasService } from './carteiras.service';
import { MovimentacoesCarteira } from './movimentacoes-carteira';
import { MapaDeMoedas, moedasDoCatalogo } from '@/features/desempenho/moeda-das-posicoes';
import { PosicoesCarteira } from './posicoes-carteira';

type Erro = { texto: string; codigo: string | null };

// Indicadores planos, separados por divisória — o mesmo desenho do consolidado do painel.
const INDICADOR = 'grid content-start gap-1.5 border-borda py-3 not-first:border-t sm:py-0 sm:not-first:border-t-0 sm:not-first:border-l sm:not-first:pl-5';
const ROTULO = 'text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';
const VALOR = 'm-0 font-numero text-grande font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo)';

/**
 * A tela mais densa do produto. Quatro leituras independentes compõem o que o
 * investidor vê, e cada uma pode falhar sozinha (ADR-006).
 *
 * Duas regras não podem ser afrouxadas aqui: resultado realizado e não
 * realizado nunca viram um número só — são naturezas diferentes (PRD-005) — e
 * CAR-001 diz apenas "Carteira não encontrada.": o servidor responde igual
 * quando a carteira não existe, quando está inativa e quando é de outro
 * investidor, de propósito, e a tela não pode desfazer isso (PRD-009).
 */
export function DetalheCarteira() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [carteira, setCarteira] = useState<Carteira | null>(null);
  const [posicoes, setPosicoes] = useState<Posicao[]>([]);
  const [consolidado, setConsolidado] = useState<ConsolidadoDaCarteira | null>(null);
  const [lucroRealizado, setLucroRealizado] = useState<LucroRealizado | null>(null);
  const [moedas, setMoedas] = useState<MapaDeMoedas>({});
  const [extrato, setExtrato] = useState<ExtratoBuscado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [renomeando, setRenomeando] = useState(false);
  const [nomeEditado, setNomeEditado] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [removendo, setRemovendo] = useState(false);
  const [operacaoEmEdicao, setOperacaoEmEdicao] = useState<MovimentacaoDoExtrato | null>(null);
  const [salvandoOperacao, setSalvandoOperacao] = useState(false);
  const [excluindoOperacao, setExcluindoOperacao] = useState(false);
  const [erro, setErro] = useState<Erro | null>(null);
  /** Uma saída só: três leituras podem recusar com CAR-001 ao mesmo tempo. */
  const saiu = useRef(false);

  /**
   * Não achar a carteira na listagem é indistinguível de CAR-001 — e é assim
   * que o produto quer: a tela nunca diz de quem a carteira seria (Q-015).
   */
  const naoEncontrada = useCallback(
    (mensagem = CATALOGO_ERROS['CAR-001'].mensagem, codigo: string | null = 'CAR-001') => {
      if (saiu.current) return;
      saiu.current = true;
      feedback.errar(mensagem, codigo);
      navegar('/carteiras');
    },
    [navegar],
  );

  const tratar = useCallback(
    (falha: unknown) => {
      if (!ehErroTraduzido(falha)) throw falha;
      if (falha.comportamento === 'voltar-a-lista') naoEncontrada(falha.mensagem, falha.codigo);
      else setErro({ texto: falha.mensagem, codigo: falha.codigo });
    },
    [naoEncontrada],
  );

  const carregarConteudo = useCallback(
    (carteiraId: number) => {
      carteirasService.posicoes(carteiraId).then(setPosicoes, tratar);
      carteirasService.consolidado(carteiraId).then(setConsolidado, tratar);
      carteirasService.lucroRealizado(carteiraId).then(setLucroRealizado, tratar);
      // As posições vêm na moeda da ação, sem dizer qual (#62): o catálogo diz.
      void moedasDoCatalogo().then(setMoedas);
      carteirasService.extratoDoInvestidor().then(setExtrato, () => setExtrato(null));
    },
    [tratar],
  );

  useEffect(() => {
    const carteiraId = Number(id);
    let vigente = true;
    setCarregando(true);
    carteirasService.porId(carteiraId).then(
      (achada) => {
        if (!vigente) return;
        setCarregando(false);
        if (!achada) return naoEncontrada();
        setCarteira(achada);
        carregarConteudo(carteiraId);
      },
      (falha: unknown) => {
        if (!vigente) return;
        setCarregando(false);
        tratar(falha);
      },
    );
    return () => {
      vigente = false;
    };
  }, [id, carregarConteudo, naoEncontrada, tratar]);

  /** Só o nome muda — nada mais da carteira é editável, e nada é recarregado. */
  const confirmarRenomeacao = async () => {
    const nome = nomeEditado.trim();
    if (!carteira || !nome || salvandoNome) return;
    setSalvandoNome(true);
    try {
      const atualizada = await carteirasService.renomear(carteira.id, nome);
      setCarteira({ ...carteira, ...atualizada });
    } catch (falha) {
      tratar(falha);
    } finally {
      setSalvandoNome(false);
      setRenomeando(false);
    }
  };

  /** CAR-002 cancela a exclusão: a mensagem diz o que fazer, e a carteira continua inteira na tela (ADR-007). */
  const confirmarExclusao = async () => {
    if (!carteira || removendo) return;
    setRemovendo(true);
    try {
      await carteirasService.excluir(carteira.id);
      feedback.informar(`${carteira.nome} saiu da sua lista.`);
      navegar('/carteiras');
    } catch (falha) {
      tratar(falha);
    } finally {
      setRemovendo(false);
      setConfirmandoExclusao(false);
    }
  };

  /** OPE-001 aqui não devolve à lista: a carteira continua, só a operação sumiu. */
  const tratarOperacao = (falha: unknown, carteiraId: number) => {
    if (!ehErroTraduzido(falha)) throw falha;
    setErro({ texto: falha.mensagem, codigo: falha.codigo });
    if (falha.comportamento === 'recarregar') carregarConteudo(carteiraId);
  };

  /**
   * Editar não corrige uma linha isolada: refaz preço médio, posição e
   * resultado da carteira. Por isso o que é relido aqui é a tela inteira, sem
   * o investidor precisar recarregar nada (AC-178).
   */
  const salvarEdicaoDeOperacao = async (alteracao: AlteracaoDeOperacao) => {
    if (!operacaoEmEdicao || !carteira || salvandoOperacao) return;
    setSalvandoOperacao(true);
    try {
      await operacoesService.alterar(operacaoEmEdicao.id, alteracao);
      carregarConteudo(carteira.id);
    } catch (falha) {
      tratarOperacao(falha, carteira.id);
    } finally {
      setSalvandoOperacao(false);
      setOperacaoEmEdicao(null);
    }
  };

  const excluirOperacao = async (movimentacao: MovimentacaoDoExtrato) => {
    if (!carteira || excluindoOperacao) return;
    setExcluindoOperacao(true);
    try {
      await operacoesService.excluir(movimentacao.id);
      feedback.informar('Operação removida do extrato.');
      carregarConteudo(carteira.id);
    } catch (falha) {
      tratarOperacao(falha, carteira.id);
    } finally {
      setExcluindoOperacao(false);
    }
  };

  return (
    <section className="grid gap-5">
      <Link to="/carteiras" className="inline-flex items-center gap-1 justify-self-start text-apoio font-semibold no-underline hover:underline">
        <ArrowLeft aria-hidden="true" focusable="false" className="size-4" />
        Voltar às carteiras
      </Link>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {carregando ? (
        <div aria-hidden="true" className="grid gap-3">
          <Esqueleto formato="bloco" />
          <Esqueleto formato="tabela" />
        </div>
      ) : (
        carteira && (
          <>
            <header data-cabecalho className="grid gap-5 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-[1_1_16rem]">
                  {renomeando ? (
                    <div data-edicao-nome className="flex flex-wrap items-center gap-2">
                      <Campo
                        rotulo="Novo nome da carteira"
                        rotuloVisivel={false}
                        data-campo-nome
                        value={nomeEditado}
                        onChange={(evento) => setNomeEditado(evento.target.value)}
                        className="min-w-0 flex-[1_1_14rem]"
                        autoFocus
                      />
                      <Botao intencao="primaria" tamanho="compacto" type="button" data-salvar-nome ocupado={salvandoNome} onClick={() => void confirmarRenomeacao()}>
                        Salvar
                      </Botao>
                      <Botao intencao="sutil" tamanho="compacto" type="button" data-cancelar-nome onClick={() => setRenomeando(false)}>
                        Cancelar
                      </Botao>
                    </div>
                  ) : (
                    <h1 className="m-0 truncate text-titulo font-bold tracking-(--entrelinha-titulo)">{carteira.nome}</h1>
                  )}
                  <p className="m-0 mt-1 text-texto-fraco">
                    {carteira.nomeCorretora} · {rotuloDoMercado(carteira.mercado)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Botao asChild intencao="primaria">
                    <Link data-registrar-compra to={`/operacoes?${new URLSearchParams({ carteira: String(carteira.id), tipo: 'COMPRA' })}`}>
                      <Plus aria-hidden="true" focusable="false" />
                      Registrar compra
                    </Link>
                  </Botao>
                  <Botao asChild intencao="secundaria">
                    <Link data-registrar-venda to={`/operacoes?${new URLSearchParams({ carteira: String(carteira.id), tipo: 'VENDA' })}`}>
                      <Minus aria-hidden="true" focusable="false" />
                      Registrar venda
                    </Link>
                  </Botao>
                  <Botao
                    intencao="sutil"
                    type="button"
                    data-renomear
                    onClick={() => {
                      setErro(null);
                      setNomeEditado(carteira.nome);
                      setRenomeando(true);
                    }}
                  >
                    <Pencil aria-hidden="true" focusable="false" />
                    Renomear
                  </Botao>
                  <Botao
                    intencao="destrutiva"
                    type="button"
                    data-excluir-carteira
                    onClick={() => {
                      setErro(null);
                      setConfirmandoExclusao(true);
                    }}
                  >
                    <Trash2 aria-hidden="true" focusable="false" />
                    Excluir
                  </Botao>
                </div>
              </div>

              {(consolidado || lucroRealizado) && (
                <dl className="m-0 grid gap-x-5 border-t border-borda pt-5 sm:grid-cols-4">
                  {consolidado && (
                    <>
                      <div className={INDICADOR}>
                        <dt className={ROTULO}>Investido</dt>
                        <dd data-investido className={VALOR}>
                          {formatarReal(consolidado.valorInvestido)}
                        </dd>
                      </div>
                      <div className={INDICADOR}>
                        <dt className={ROTULO}>Valor de mercado</dt>
                        <dd data-valor-de-mercado className={VALOR}>
                          {formatarReal(consolidado.valorDeMercado)}
                        </dd>
                      </div>
                      <div className={INDICADOR}>
                        <dt className={ROTULO}>Resultado não realizado</dt>
                        <dd data-nao-realizado className={VALOR}>
                          <Variacao valor={consolidado.lucroNaoRealizado} moeda="BRL" />
                        </dd>
                      </div>
                    </>
                  )}
                  {lucroRealizado && (
                    <div className={INDICADOR}>
                      <dt className={ROTULO}>Resultado realizado</dt>
                      <dd data-realizado className={VALOR}>
                        <Variacao valor={lucroRealizado.total} moeda="BRL" />
                      </dd>
                    </div>
                  )}
                </dl>
              )}

              {consolidado && (
                <>
                  <p data-taxa-cambio className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-apoio">
                    <span className="text-texto-fraco">Totais em real, convertidos pela taxa</span>
                    <ValorComHorario valor={consolidado.taxaCambioAtual} obtidoEm={consolidado.dataHoraTaxaCambio} />
                  </p>
                  {consolidado.avisos.map((aviso) => (
                    <div key={aviso} data-aviso-consolidado>
                      <MensagemFeedback nivel="aviso" mensagem={aviso} />
                    </div>
                  ))}
                </>
              )}
            </header>

            <PosicoesCarteira posicoes={posicoes} moedas={moedas} lucroPorTicker={lucroRealizado?.porTicker ?? {}} />

            {operacaoEmEdicao && (
              <EditarOperacao
                operacao={operacaoEmEdicao}
                salvando={salvandoOperacao}
                aoSalvar={(alteracao) => void salvarEdicaoDeOperacao(alteracao)}
                aoCancelar={() => setOperacaoEmEdicao(null)}
              />
            )}

            {extrato && (
              <MovimentacoesCarteira
                extrato={extrato}
                carteiraId={carteira.id}
                excluindo={excluindoOperacao}
                aoEditar={(movimentacao) => {
                  setErro(null);
                  setOperacaoEmEdicao(movimentacao);
                }}
                aoExcluir={(movimentacao) => void excluirOperacao(movimentacao)}
              />
            )}

            {confirmandoExclusao && (
              <DialogoConfirmacao
                titulo="Excluir esta carteira?"
                consequencia={`${carteira.nome} sai da sua lista com as movimentações e os resultados dela. Não há como desfazer.`}
                rotuloConfirmar="Excluir"
                ocupado={removendo}
                aoConfirmar={() => void confirmarExclusao()}
                aoCancelar={() => setConfirmandoExclusao(false)}
              />
            )}
          </>
        )
      )}
    </section>
  );
}
