import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { ErroTraduzido, ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { feedback } from '@/core/feedback/feedback.service';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { carteirasService } from '@/features/carteiras/carteiras.service';
import { EditarOperacao } from './editar-operacao';
import { ExtratoOperacoes } from './extrato-operacoes';
import { DesfechoDoRegistro, FormularioOperacao, ID_CAMPO_CARTEIRA, PedidoDeRegistro } from './formulario-operacao';
import { AlteracaoDeOperacao, Operacao, OperacaoDoExtrato } from './operacoes.model';
import { operacoesService } from './operacoes.service';
import { ResultadoOperacao } from './resultado-operacao';

/**
 * Uma tela só: formulário no topo, extrato abaixo (Q-019). É o destino dos dois
 * links que já existem no produto — o "registrar compra/venda" do detalhe da
 * carteira, com `?carteira=&tipo=`, e o "ver o extrato completo" das
 * movimentações. Recortar e totalizar o extrato é na área Relatórios (AC-400).
 *
 * O formulário nunca fecha depois de registrar: quem registra uma compra
 * normalmente registra várias na mesma sessão, e obrigar a voltar à carteira a
 * cada lançamento é o atrito mais caro do produto (PRD-007).
 */
export function Operacoes() {
  const [busca] = useSearchParams();
  const carteiraInicial = busca.get('carteira') ? Number(busca.get('carteira')) : null;
  const tipoInicial = busca.get('tipo') === 'VENDA' ? 'VENDA' : 'COMPRA';

  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [extrato, setExtrato] = useState<OperacaoDoExtrato[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalDePaginas, setTotalDePaginas] = useState(0);
  const [totalDeItens, setTotalDeItens] = useState(0);
  const [carregandoExtrato, setCarregandoExtrato] = useState(true);

  const [ultimaOperacao, setUltimaOperacao] = useState<Operacao | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [emEdicao, setEmEdicao] = useState<OperacaoDoExtrato | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<{ texto: string; codigo: string | null } | null>(null);

  const lerExtrato = useCallback(async (numero: number): Promise<void> => {
    setCarregandoExtrato(true);
    try {
      const resposta = await operacoesService.extrato(numero);
      // A última página esvaziou (o único item foi excluído): volta uma página (AC-307).
      if (resposta.content.length === 0 && resposta.number > 0) return await lerExtrato(resposta.number - 1);
      setExtrato(resposta.content);
      setPagina(resposta.number);
      setTotalDePaginas(resposta.totalPages);
      setTotalDeItens(resposta.totalElements);
    } catch {
      // O extrato que não veio fica como estava; a tela segue utilizável.
    }
    setCarregandoExtrato(false);
  }, []);

  useEffect(() => {
    carteirasService.listar(0).then(
      (resposta) => setCarteiras(resposta.content),
      () => setCarteiras([]),
    );
  }, []);

  useEffect(() => {
    void lerExtrato(0);
  }, [lerExtrato]);

  const traduzida = (falha: unknown): ErroTraduzido => {
    if (!ehErroTraduzido(falha)) throw falha;
    return falha;
  };

  /**
   * OPE-001 quase sempre significa que a operação foi excluída em outra aba:
   * reler o extrato mostra a lista sem ela em vez de insistir no que sumiu.
   */
  const tratarNaLista = (falha: unknown) => {
    const erroTraduzido = traduzida(falha);
    setErro({ texto: erroTraduzido.mensagem, codigo: erroTraduzido.codigo });
    if (erroTraduzido.comportamento === 'recarregar') void lerExtrato(pagina);
  };

  /**
   * Registrar é sucesso mesmo trazendo avisos (ADR-006): o resultado vai para o
   * bloco de confirmação, que apresenta os avisos como aviso. Nada aqui pode
   * encaminhar uma operação registrada ao caminho de erro. OPE-004 e OPE-005
   * pertencem ao campo; o resto fica visível acima do formulário.
   */
  const registrar = async (pedido: PedidoDeRegistro): Promise<DesfechoDoRegistro> => {
    if (registrando) return false;
    setErro(null);
    setRegistrando(true);
    try {
      setUltimaOperacao(await operacoesService.registrar(pedido.tipo, pedido.operacao));
      void lerExtrato(0);
      return true;
    } catch (falha) {
      const erroTraduzido = traduzida(falha);
      if (erroTraduzido.campoDestacado) return erroTraduzido;
      setErro({ texto: erroTraduzido.mensagem, codigo: erroTraduzido.codigo });
      return false;
    } finally {
      setRegistrando(false);
    }
  };

  const salvarEdicao = async (alteracao: AlteracaoDeOperacao) => {
    if (!emEdicao || salvandoEdicao) return;
    setSalvandoEdicao(true);
    try {
      setUltimaOperacao(await operacoesService.alterar(emEdicao.id, alteracao));
      setEmEdicao(null);
      void lerExtrato(pagina);
    } catch (falha) {
      setEmEdicao(null);
      tratarNaLista(falha);
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const excluir = async (operacao: OperacaoDoExtrato) => {
    if (excluindo) return;
    setExcluindo(true);
    try {
      await operacoesService.excluir(operacao.id);
      feedback.informar('Operação removida do extrato.');
      void lerExtrato(pagina);
    } catch (falha) {
      tratarNaLista(falha);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Operações</h1>
        <Botao asChild intencao="secundaria" tamanho="compacto">
          <Link data-voltar-carteiras to="/carteiras">
            <ArrowLeft aria-hidden="true" focusable="false" />
            Voltar às carteiras
          </Link>
        </Botao>
      </header>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {emEdicao ? (
        <EditarOperacao operacao={emEdicao} salvando={salvandoEdicao} aoSalvar={(alteracao) => void salvarEdicao(alteracao)} aoCancelar={() => setEmEdicao(null)} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[35rem_minmax(0,35rem)]">
          <FormularioOperacao carteiraInicial={carteiraInicial} tipoInicial={tipoInicial} enviando={registrando} aoRegistrar={registrar} />
          {ultimaOperacao && <ResultadoOperacao operacao={ultimaOperacao} />}
        </div>
      )}

      <ExtratoOperacoes
        aoLadoDoTitulo={
          <Link to="/relatorios" className="inline-flex items-center gap-1 text-apoio font-semibold no-underline hover:underline">
            Filtrar e totalizar em Relatórios
            <ArrowRight aria-hidden="true" focusable="false" className="size-4" />
          </Link>
        }
        totalDeItens={totalDeItens}
        operacoes={extrato}
        carteiras={carteiras}
        pagina={pagina}
        totalDePaginas={totalDePaginas}
        carregando={carregandoExtrato}
        excluindo={excluindo}
        aoMudarPagina={(numero) => void lerExtrato(numero)}
        aoEditar={(operacao) => {
          setErro(null);
          setEmEdicao(operacao);
        }}
        aoExcluir={(operacao) => void excluir(operacao)}
        aoRegistrarPrimeira={() => document.getElementById(ID_CAMPO_CARTEIRA)?.focus()}
      />
    </section>
  );
}
