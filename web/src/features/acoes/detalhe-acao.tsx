import { ArrowLeft, CircleCheck, Clock, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { ehErroTraduzido, traduzirErro } from '@/core/erros/tradutor-erro';
import { feedback } from '@/core/feedback/feedback.service';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarHora } from '@/core/formatacao/formatacao';
import { rotuloDoMercado } from '@/features/carteiras/carteiras.model';
import { Monograma } from '@/shared/monograma';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { Acao } from './acoes.model';
import { acoesService } from './acoes.service';
import { Desfecho, classificarAtualizacao } from './desfecho-cotacao';

type Erro = { texto: string; codigo: string | null; nivel: 'erro' | 'aviso' };

const ROTULO = 'm-0 text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';

/**
 * A tela dos quatro desfechos da atualização de cotação (ADR-005). Nenhum deles
 * esvazia o preço: preço novo, cache ainda válido, limite da fonte (EXT-009) e
 * fonte indisponível (EXT-010) sempre deixam um número datado na tela.
 *
 * Nada de cotação parte daqui sozinho: abrir a tela não atualiza, e não há
 * intervalo nenhum agendado. A fonte gratuita é compartilhada por todos.
 *
 * A exclusão manda o TICKER na rota — diferente de corretora, que vai por id.
 */
export function DetalheAcao() {
  const { ticker = '' } = useParams();
  const navegar = useNavigate();
  const [acao, setAcao] = useState<Acao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [resultado, setResultado] = useState<{ desfecho: Desfecho; mensagem: string } | null>(null);
  const [erro, setErro] = useState<Erro | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);
  const [removendo, setRemovendo] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCarregando(true);
    void acoesService.porTicker(ticker).then((achada) => {
      if (!vigente) return;
      setCarregando(false);
      if (achada) {
        setAcao(achada);
        return;
      }
      // Ticker fora do catálogo é o mesmo que ACA-001: a mensagem sai do catálogo de erros.
      feedback.errar(CATALOGO_ERROS['ACA-001'].mensagem, 'ACA-001');
      navegar('/acoes');
    });
    return () => {
      vigente = false;
    };
  }, [ticker, navegar]);

  const limparMensagens = () => {
    setErro(null);
    setResultado(null);
  };

  /**
   * Forçar ignora o cache e vai direto à fonte. Só é oferecido depois de o cache
   * ter sido reaproveitado, porque cada chamada forçada consome a cota que todos
   * os investidores dividem.
   */
  const pedirCotacao = async (forcar: boolean) => {
    const anterior = acao;
    if (!anterior || atualizando) return;
    limparMensagens();
    setAtualizando(true);
    try {
      const atual = await acoesService.atualizarCotacao(anterior.id, forcar);
      setAcao(atual);
      setResultado(classificarAtualizacao(anterior, atual));
    } catch (falha) {
      if (!ehErroTraduzido(falha)) throw falha;
      // EXT-009 e EXT-010 chegam com `{horario}` por preencher: o horário é da
      // cotação que está na tela, e só a tela sabe qual é. O preço anterior fica.
      const traduzido =
        falha.comportamento === 'manter-ultimo-valor' && falha.original
          ? traduzirErro(falha.original, { horario: formatarHora(anterior.dataHoraCotacao) })
          : falha;
      setErro({ texto: traduzido.mensagem, codigo: traduzido.codigo, nivel: traduzido.nivel === 'aviso' ? 'aviso' : 'erro' });
    } finally {
      setAtualizando(false);
    }
  };

  const confirmarRemocao = async () => {
    if (!acao || removendo) return;
    setRemovendo(true);
    try {
      await acoesService.remover(acao.ticker);
      feedback.informar(`${acao.ticker} saiu do catálogo.`);
      navegar('/acoes');
    } catch (falha) {
      if (!ehErroTraduzido(falha)) throw falha;
      // ACA-003 cancela a exclusão. O texto é o do catálogo e não diz de quem
      // são as posições nem em qual carteira estão.
      setErro({ texto: falha.mensagem, codigo: falha.codigo, nivel: 'erro' });
    } finally {
      setRemovendo(false);
      setConfirmandoRemocao(false);
    }
  };

  return (
    <section className="grid gap-5">
      <Link to="/acoes" className="inline-flex items-center gap-1 justify-self-start text-apoio font-semibold no-underline hover:underline">
        <ArrowLeft aria-hidden="true" focusable="false" className="size-4" />
        Voltar às ações
      </Link>

      {erro && <MensagemFeedback nivel={erro.nivel} mensagem={erro.texto} codigo={erro.codigo} />}

      {carregando ? (
        <div aria-hidden="true" className="grid gap-3">
          <Esqueleto />
          <Esqueleto formato="bloco" />
        </div>
      ) : (
        acao && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Monograma ticker={acao.ticker} />
                <div className="min-w-0">
                  <h1 data-ticker className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">
                    {acao.ticker}
                  </h1>
                  <p data-empresa className="m-0 text-texto-fraco">
                    {acao.nomeEmpresa}
                  </p>
                </div>
              </div>
              <Botao
                intencao="destrutiva"
                type="button"
                data-remover
                onClick={() => {
                  limparMensagens();
                  setConfirmandoRemocao(true);
                }}
              >
                <Trash2 aria-hidden="true" focusable="false" />
                Remover do catálogo
              </Botao>
            </header>

            <section aria-labelledby="titulo-cotacao" className="grid gap-5 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
                <div className="grid gap-1.5">
                  <h2 id="titulo-cotacao" className={ROTULO}>
                    Cotação
                  </h2>
                  <div className="text-titulo font-semibold leading-(--altura-apertada)">
                    <ValorComHorario valor={acao.cotacaoAtual} moeda={acao.moeda} obtidoEm={acao.dataHoraCotacao} />
                  </div>
                </div>
                <dl className="m-0 flex gap-x-8 gap-y-2">
                  <div className="grid gap-1">
                    <dt className={ROTULO}>Mercado</dt>
                    <dd data-mercado className="m-0 font-semibold">
                      {rotuloDoMercado(acao.mercado)}
                    </dd>
                  </div>
                  <div className="grid gap-1">
                    <dt className={ROTULO}>Moeda</dt>
                    <dd data-moeda className="m-0 font-numero font-semibold">
                      {acao.moeda}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-borda pt-4">
                <Botao intencao="primaria" type="button" data-atualizar ocupado={atualizando} onClick={() => void pedirCotacao(false)}>
                  <RefreshCw aria-hidden="true" focusable="false" />
                  {atualizando ? 'Consultando…' : 'Atualizar cotação'}
                </Botao>
                <p className="m-0 max-w-[52ch] flex-[1_1_18rem] text-apoio text-texto-fraco">
                  O preço não se atualiza sozinho: a fonte é compartilhada por todos os investidores e a consulta acontece só quando você pede.
                </p>
              </div>

              {resultado && (
                <p
                  data-resultado-atualizacao
                  data-desfecho={resultado.desfecho}
                  role="status"
                  className="m-0 flex items-start gap-2 text-apoio font-medium"
                >
                  {resultado.desfecho === 'preco-novo' ? (
                    <CircleCheck aria-hidden="true" focusable="false" className="mt-0.5 size-4 flex-none text-sucesso-texto" />
                  ) : (
                    <Clock aria-hidden="true" focusable="false" className="mt-0.5 size-4 flex-none text-texto-fraco" />
                  )}
                  {resultado.mensagem}
                </p>
              )}

              {resultado?.desfecho === 'continua-atual' && (
                <div className="grid justify-items-start gap-3 rounded border border-dashed border-borda p-4">
                  <p data-aviso-cota className="m-0 text-apoio text-texto-fraco">
                    Precisa de um preço mais novo agora? Buscar na fonte antes dos 15 minutos consome a cota de consultas que todos os
                    investidores dividem.
                  </p>
                  <Botao intencao="secundaria" type="button" data-forcar ocupado={atualizando} onClick={() => void pedirCotacao(true)}>
                    Buscar preço novo mesmo assim
                  </Botao>
                </div>
              )}
            </section>

            {confirmandoRemocao && (
              <DialogoConfirmacao
                titulo="Remover esta ação?"
                consequencia="Ela sai do catálogo para todos os investidores e não aparece mais nas listas nem nos formulários de compra. Não há como desfazer."
                rotuloConfirmar="Remover"
                ocupado={removendo}
                aoConfirmar={() => void confirmarRemocao()}
                aoCancelar={() => setConfirmandoRemocao(false)}
              />
            )}
          </>
        )
      )}
    </section>
  );
}
