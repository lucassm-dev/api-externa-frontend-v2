import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Botao } from '@/components/ui/botao';
import { CaixaDeMarcar } from '@/components/ui/caixa-de-marcar';
import { Campo } from '@/components/ui/campo';
import { GrupoDeOpcoes } from '@/components/ui/grupo-de-opcoes';
import { Selecao } from '@/components/ui/selecao';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { ErroTraduzido } from '@/core/erros/tradutor-erro';
import { formatarMoeda, formatarNumero } from '@/core/formatacao/formatacao';
import { Acao } from '@/features/acoes/acoes.model';
import { acoesService } from '@/features/acoes/acoes.service';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { carteirasService } from '@/features/carteiras/carteiras.service';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { AcaoVendavel, acoesVendaveis, disponivelDe, vendaExcedePosicao } from './disponivel-para-venda';
import { CATALOGO_POR_VARREDURA, NovaOperacao, TIPOS_DE_OPERACAO, TipoOperacao, opcaoDeTipo } from './operacoes.model';
import { estimarOperacao, precoManualTemCasasDemais } from './preco-da-operacao';

export const ID_CAMPO_CARTEIRA = 'operacao-carteira';

export interface PedidoDeRegistro {
  tipo: TipoOperacao;
  operacao: NovaOperacao;
}

/**
 * `true`: registrada. `false`: a recusa não é de campo e a página já a mostrou.
 * Erro traduzido: OPE-004 ou OPE-005, que pertencem a um campo deste formulário.
 */
export type DesfechoDoRegistro = boolean | ErroTraduzido;

interface Props {
  carteiraInicial: number | null;
  tipoInicial: TipoOperacao;
  enviando: boolean;
  aoRegistrar: (pedido: PedidoDeRegistro) => Promise<DesfechoDoRegistro>;
}

const numeroOuNulo = (texto: string): number | null => (texto ? Number(texto) : null);

/**
 * Compra e venda no mesmo formulário (PRD-007). O seletor de tipo é o primeiro
 * elemento e é um par de opções lado a lado, nunca um campo suspenso: ele muda
 * o que a operação faz, e esconder isso atrás de um clique é o pior lugar da
 * tela para economizar espaço.
 *
 * Trocar o tipo preserva a carteira e limpa quantidade e preço. Manter a
 * quantidade seria perigoso: um número válido numa compra pode exceder a
 * posição numa venda, e o investidor confirmaria sem reler.
 *
 * O preço não é digitado por padrão (ADR-008) — abrir o campo é uma ação
 * deliberada. E o preço mostrado antes de confirmar é estimativa: não existe
 * endpoint de preço para operação, e o backend pode buscar preço novo se o
 * cache tiver vencido (ASM-040).
 */
export function FormularioOperacao({ carteiraInicial, tipoInicial, enviando, aoRegistrar }: Props) {
  const [tipo, setTipo] = useState<TipoOperacao>(tipoInicial);
  const [carteiraId, setCarteiraId] = useState<number | null>(carteiraInicial);
  const [ticker, setTicker] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState<number | null>(null);
  const [precoManualAtivo, setPrecoManualAtivo] = useState(false);
  const [precoManual, setPrecoManual] = useState<number | null>(null);

  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [catalogo, setCatalogo] = useState<Acao[]>([]);
  const [vendaveis, setVendaveis] = useState<AcaoVendavel[]>([]);
  const [carregandoPosicoes, setCarregandoPosicoes] = useState(false);

  /** Erro do servidor que a tela precisa manter à vista sem apagar o preenchido. */
  const [erroDeCampo, setErroDeCampo] = useState<{ campo: string; mensagem: string } | null>(null);

  /** A última carteira pedida: resposta de outra carteira chegou atrasada e é descartada (AC-309). */
  const carteiraPedida = useRef<number | null>(null);

  const carregarPosicoes = async (id: number): Promise<AcaoVendavel[] | null> => {
    carteiraPedida.current = id;
    setCarregandoPosicoes(true);
    try {
      const lidas = acoesVendaveis(await carteirasService.posicoes(id));
      if (carteiraPedida.current !== id) return null;
      setVendaveis(lidas);
      return lidas;
    } catch {
      if (carteiraPedida.current !== id) return null;
      setVendaveis([]);
      return null;
    } finally {
      if (carteiraPedida.current === id) setCarregandoPosicoes(false);
    }
  };

  // As listas de escolha cobrem o catálogo do investidor típico, não só a primeira página (AC-308).
  useEffect(() => {
    carteirasService.listar(0, CATALOGO_POR_VARREDURA).then(
      (pagina) => setCarteiras(pagina.content),
      () => setCarteiras([]),
    );
    acoesService.listar(0, CATALOGO_POR_VARREDURA).then(
      (pagina) => setCatalogo(pagina.content),
      () => setCatalogo([]),
    );
    // A carteira do endereço vale só na abertura; depois, quem manda é a escolha do investidor.
    if (carteiraInicial !== null) void carregarPosicoes(carteiraInicial);
  }, []);

  const ehVenda = tipo === 'VENDA';

  /** Na compra, o catálogo inteiro; na venda, só o que tem posição (AC-152, AC-157). */
  const acoesOferecidas = (ehVenda ? vendaveis : catalogo).map(({ ticker, nomeEmpresa }) => ({ ticker, nomeEmpresa }));
  const disponivel = ehVenda ? disponivelDe(vendaveis, ticker) : null;
  const excedePosicao = ehVenda && vendaExcedePosicao(vendaveis, ticker, quantidade);
  const precoComCasasDemais = precoManualAtivo && precoManualTemCasasDemais(precoManual);

  /** A cotação conhecida da ação escolhida — do catálogo na compra, da posição na venda. */
  const cotacao = (() => {
    if (!ticker) return null;
    if (ehVenda) {
      const vendavel = vendaveis.find((acao) => acao.ticker === ticker);
      return vendavel ? { valor: vendavel.cotacaoAtual, obtidoEm: vendavel.dataHoraCotacao } : null;
    }
    const doCatalogo = catalogo.find((acao) => acao.ticker === ticker);
    return doCatalogo ? { valor: doCatalogo.cotacaoAtual, obtidoEm: doCatalogo.dataHoraCotacao } : null;
  })();

  const moedaDaAcao = catalogo.find((acao) => acao.ticker === ticker)?.moeda ?? 'BRL';

  /**
   * Estimativa, nunca promessa. Com preço manual ativo o número é exato, porque
   * é o que o investidor mandou usar; sem ele, sai da última cotação conhecida.
   */
  const estimativa = precoManualAtivo
    ? precoManual && quantidade
      ? { precoUnitario: precoManual, valorTotal: precoManual * quantidade, obtidoEm: null }
      : null
    : estimarOperacao(cotacao?.valor, cotacao?.obtidoEm, quantidade);

  const podeEnviar =
    carteiraId !== null &&
    !!ticker &&
    (quantidade ?? 0) > 0 &&
    !excedePosicao &&
    !precoComCasasDemais &&
    !(precoManualAtivo && !precoManual);

  /**
   * Preserva a carteira e limpa quantidade e preço — inclusive a ação, que na
   * venda precisa existir na posição e na compra pode ser qualquer uma.
   */
  const escolherTipo = (novo: TipoOperacao) => {
    if (novo === tipo) return;
    setTipo(novo);
    setTicker(null);
    setQuantidade(null);
    setPrecoManual(null);
    setPrecoManualAtivo(false);
    setErroDeCampo(null);
  };

  const escolherCarteira = (id: number | null) => {
    setCarteiraId(id);
    setTicker(null);
    setQuantidade(null);
    setErroDeCampo(null);
    setVendaveis([]);
    if (id === null) {
      carteiraPedida.current = null;
      setCarregandoPosicoes(false);
      return;
    }
    void carregarPosicoes(id);
  };

  /** A operação deu certo: a carteira fica, o resto sai do caminho (AC-156). */
  const prepararProxima = () => {
    setQuantidade(null);
    setPrecoManual(null);
    setPrecoManualAtivo(false);
    setErroDeCampo(null);
    if (carteiraId !== null) void carregarPosicoes(carteiraId);
  };

  /**
   * OPE-004 destaca a quantidade e OPE-005 o preço, sem nada ser apagado: o
   * investidor corrige o número em vez de refazer o formulário (PRD-009). O
   * OPE-004 não traz a quantidade: ela é lida de novo da carteira (AC-306).
   */
  const aplicarErro = async (erro: ErroTraduzido) => {
    if (!erro.campoDestacado) return;
    let mensagem = erro.mensagem;
    if (erro.codigo === 'OPE-004' && carteiraId !== null) {
      const relidas = await carregarPosicoes(carteiraId);
      const quantidadeReal = disponivelDe(relidas ?? vendaveis, ticker) ?? 0;
      mensagem = CATALOGO_ERROS['OPE-004'].mensagem.replace('{quantidade}', formatarNumero(quantidadeReal, 0));
    }
    setErroDeCampo({ campo: erro.campoDestacado, mensagem });
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!podeEnviar || enviando) return;
    setErroDeCampo(null);

    const operacao: NovaOperacao = { carteiraId: carteiraId!, ticker: ticker!, quantidade: quantidade! };
    if (precoManualAtivo && precoManual) operacao.precoUnitario = precoManual;

    const desfecho = await aoRegistrar({ tipo, operacao });
    if (desfecho === true) prepararProxima();
    else if (desfecho !== false) await aplicarErro(desfecho);
  };

  const erroNaQuantidade =
    erroDeCampo?.campo === 'quantidade' ? (
      <span data-erro-quantidade>{erroDeCampo.mensagem}</span>
    ) : excedePosicao ? (
      <span data-excede-posicao>Você tem apenas {formatarNumero(disponivel!, 0)} unidades desta ação.</span>
    ) : null;

  const erroNoPreco = precoComCasasDemais ? (
    <span data-preco-casas>O preço pode ter no máximo 2 casas decimais.</span>
  ) : erroDeCampo?.campo === 'precoUnitario' ? (
    <span data-erro-preco>{erroDeCampo.mensagem}</span>
  ) : null;

  return (
    <form
      onSubmit={(evento) => void enviar(evento)}
      noValidate
      aria-label="Registrar operação"
      className="grid max-w-[35rem] gap-5 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4"
    >
      <GrupoDeOpcoes
        data-seletor-tipo
        legenda="O que você vai registrar"
        opcoes={TIPOS_DE_OPERACAO}
        valor={tipo}
        aoEscolher={escolherTipo}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          empilhado
          id={ID_CAMPO_CARTEIRA}
          rotulo="Carteira"
          data-campo-carteira
          value={carteiraId ?? ''}
          onChange={(evento) => escolherCarteira(evento.target.value ? Number(evento.target.value) : null)}
        >
          <option value="">Escolha a carteira</option>
          {carteiras.map((carteira) => (
            <option key={carteira.id} value={carteira.id}>
              {carteira.nome} · {carteira.nomeCorretora}
            </option>
          ))}
        </Selecao>

        <Selecao
          empilhado
          rotulo="Ação"
          data-campo-acao
          value={ticker ?? ''}
          onChange={(evento) => setTicker(evento.target.value || null)}
          dica={
            ehVenda && carteiraId !== null && !carregandoPosicoes && acoesOferecidas.length === 0 ? (
              <span data-sem-posicao>Esta carteira não tem nenhuma posição aberta para vender.</span>
            ) : undefined
          }
        >
          <option value="">Escolha a ação</option>
          {acoesOferecidas.map((acao) => (
            <option key={acao.ticker} value={acao.ticker}>
              {acao.ticker} · {acao.nomeEmpresa}
            </option>
          ))}
        </Selecao>
      </div>

      <Campo
        rotulo="Quantidade"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        data-campo-quantidade
        value={quantidade ?? ''}
        onChange={(evento) => setQuantidade(numeroOuNulo(evento.target.value))}
        dica={disponivel !== null ? <span data-disponivel>Disponível para venda: {formatarNumero(disponivel, 0)} unidades.</span> : undefined}
        erro={erroNaQuantidade}
        className="sm:max-w-[calc(50%-0.5rem)]"
      />

      <div className="grid gap-3 border-t border-borda pt-4">
        <CaixaDeMarcar
          rotulo="Informar preço manualmente"
          data-preco-manual
          checked={precoManualAtivo}
          onChange={(evento) => {
            setPrecoManualAtivo(evento.target.checked);
            if (!evento.target.checked) setPrecoManual(null);
            setErroDeCampo(null);
          }}
          className="justify-self-start"
        />
        {precoManualAtivo ? (
          <Campo
            rotulo="Preço unitário"
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            data-campo-preco
            value={precoManual ?? ''}
            onChange={(evento) => setPrecoManual(numeroOuNulo(evento.target.value))}
            erro={erroNoPreco}
            className="sm:max-w-[calc(50%-0.5rem)]"
          />
        ) : (
          <p className="m-0 text-apoio text-texto-fraco">Sem preço informado, a operação usa o preço de mercado no momento do registro.</p>
        )}
      </div>

      {estimativa && (
        <div data-estimativa aria-live="polite" className="grid gap-2 rounded border border-borda bg-fundo p-4">
          <h3 className="m-0 text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco">Estimativa desta operação</h3>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            {estimativa.obtidoEm ? (
              <ValorComHorario valor={estimativa.precoUnitario} moeda={moedaDaAcao} obtidoEm={estimativa.obtidoEm} />
            ) : (
              <span data-preco-informado className="text-apoio text-texto-fraco">
                Preço que você informou
              </span>
            )}
            <p className="m-0 flex items-baseline gap-2">
              <span className="text-apoio text-texto-fraco">Total estimado</span>
              <strong data-total-estimado className="font-numero text-medio font-semibold tabular-nums">
                {formatarMoeda(estimativa.valorTotal, moedaDaAcao)}
              </strong>
            </p>
          </div>
          <p data-ressalva-estimativa className="m-0 max-w-[65ch] text-rotulo text-texto-fraco">
            {estimativa.obtidoEm
              ? 'Este é o preço da última cotação conhecida — uma estimativa. O preço efetivamente registrado pode ser outro, e ele aparece na confirmação.'
              : 'O total usa o preço que você informou.'}
          </p>
        </div>
      )}

      {erroDeCampo && erroDeCampo.campo !== 'quantidade' && erroDeCampo.campo !== 'precoUnitario' && (
        <p data-erro-geral className="m-0 text-apoio font-medium text-erro-texto">
          {erroDeCampo.mensagem}
        </p>
      )}

      <Botao intencao="primaria" type="submit" data-confirmar disabled={!podeEnviar} ocupado={enviando} className="max-sm:w-full sm:justify-self-start">
        {enviando ? 'Registrando…' : opcaoDeTipo(tipo).rotuloDoBotao}
      </Botao>
    </form>
  );
}
