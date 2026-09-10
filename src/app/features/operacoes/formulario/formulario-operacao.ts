import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATALOGO_ERROS } from '../../../core/erros/catalogo-erros';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { formatarMoeda, formatarNumero } from '../../../core/formatacao/formatacao';
import { Botao } from '../../../shared/botao/botao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { Acao } from '../../acoes/acoes.model';
import { AcoesService } from '../../acoes/acoes.service';
import { Carteira } from '../../carteiras/carteiras.model';
import { CarteirasService } from '../../carteiras/carteiras.service';
import {
  AcaoVendavel,
  acoesVendaveis,
  disponivelDe,
  vendaExcedePosicao,
} from '../disponivel-para-venda';
import { NovaOperacao, TIPOS_DE_OPERACAO, TipoOperacao, opcaoDeTipo } from '../operacoes.model';
import { estimarOperacao, precoManualTemCasasDemais } from '../preco-da-operacao';

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
@Component({
  selector: 'app-formulario-operacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Botao, ValorComHorario],
  templateUrl: './formulario-operacao.html',
  styleUrl: './formulario-operacao.scss',
})
export class FormularioOperacao {
  private readonly carteirasService = inject(CarteirasService);
  private readonly acoesService = inject(AcoesService);

  readonly carteiraInicial = input<number | null>(null);
  readonly tipoInicial = input<TipoOperacao>('COMPRA');
  readonly enviando = input(false);

  readonly registrar = output<{ tipo: TipoOperacao; operacao: NovaOperacao }>();

  protected readonly tipos = TIPOS_DE_OPERACAO;
  protected readonly formatarNumero = formatarNumero;

  readonly tipo = signal<TipoOperacao>('COMPRA');
  readonly carteiraId = signal<number | null>(null);
  readonly ticker = signal<string | null>(null);
  readonly quantidade = signal<number | null>(null);
  readonly precoManualAtivo = signal(false);
  readonly precoManual = signal<number | null>(null);

  readonly carteiras = signal<Carteira[]>([]);
  readonly catalogo = signal<Acao[]>([]);
  readonly vendaveis = signal<AcaoVendavel[]>([]);
  readonly carregandoPosicoes = signal(false);

  /** Erro do servidor que a tela precisa manter à vista sem apagar o preenchido. */
  readonly erroDeCampo = signal<{ campo: string; mensagem: string } | null>(null);

  constructor() {
    this.carteirasService.listar(0).subscribe({
      next: (pagina) => this.carteiras.set(pagina.content),
      error: () => this.carteiras.set([]),
    });
    this.acoesService.listar(0).subscribe({
      next: (pagina) => this.catalogo.set(pagina.content),
      error: () => this.catalogo.set([]),
    });

    effect(() => {
      const inicial = this.carteiraInicial();
      if (inicial !== null) {
        this.carteiraId.set(inicial);
        this.carregarPosicoes(inicial);
      }
    });
    effect(() => this.tipo.set(this.tipoInicial()));
  }

  protected readonly ehVenda = computed(() => this.tipo() === 'VENDA');
  protected readonly rotuloDoBotao = computed(() => opcaoDeTipo(this.tipo()).rotuloDoBotao);

  /** Na compra, o catálogo inteiro; na venda, só o que tem posição (AC-152, AC-157). */
  protected readonly acoesOferecidas = computed(() =>
    this.ehVenda()
      ? this.vendaveis().map((acao) => ({ ticker: acao.ticker, nomeEmpresa: acao.nomeEmpresa }))
      : this.catalogo().map((acao) => ({ ticker: acao.ticker, nomeEmpresa: acao.nomeEmpresa })),
  );

  protected readonly disponivel = computed(() =>
    this.ehVenda() ? disponivelDe(this.vendaveis(), this.ticker()) : null,
  );

  protected readonly excedePosicao = computed(
    () => this.ehVenda() && vendaExcedePosicao(this.vendaveis(), this.ticker(), this.quantidade()),
  );

  protected readonly precoComCasasDemais = computed(
    () => this.precoManualAtivo() && precoManualTemCasasDemais(this.precoManual()),
  );

  /** A cotação conhecida da ação escolhida — do catálogo na compra, da posição na venda. */
  private readonly cotacaoConhecida = computed(() => {
    const ticker = this.ticker();
    if (!ticker) {
      return null;
    }
    if (this.ehVenda()) {
      const vendavel = this.vendaveis().find((acao) => acao.ticker === ticker);
      return vendavel ? { valor: vendavel.cotacaoAtual, obtidoEm: vendavel.dataHoraCotacao } : null;
    }
    const doCatalogo = this.catalogo().find((acao) => acao.ticker === ticker);
    return doCatalogo
      ? { valor: doCatalogo.cotacaoAtual, obtidoEm: doCatalogo.dataHoraCotacao }
      : null;
  });

  protected readonly moedaDaAcao = computed(
    () => this.catalogo().find((acao) => acao.ticker === this.ticker())?.moeda ?? 'BRL',
  );

  /**
   * Estimativa, nunca promessa. Com preço manual ativo o número é exato, porque
   * é o que o investidor mandou usar; sem ele, sai da última cotação conhecida.
   */
  protected readonly estimativa = computed(() => {
    const cotacao = this.cotacaoConhecida();
    if (this.precoManualAtivo()) {
      const preco = this.precoManual();
      const quantidade = this.quantidade();
      if (!preco || !quantidade) {
        return null;
      }
      return { precoUnitario: preco, valorTotal: preco * quantidade, obtidoEm: null };
    }
    return estimarOperacao(cotacao?.valor, cotacao?.obtidoEm, this.quantidade());
  });

  protected readonly totalEstimado = computed(() => {
    const estimativa = this.estimativa();
    return estimativa ? formatarMoeda(estimativa.valorTotal, this.moedaDaAcao()) : null;
  });

  protected readonly podeEnviar = computed(
    () =>
      this.carteiraId() !== null &&
      !!this.ticker() &&
      !!this.quantidade() &&
      (this.quantidade() ?? 0) > 0 &&
      !this.excedePosicao() &&
      !this.precoComCasasDemais() &&
      !(this.precoManualAtivo() && !this.precoManual()),
  );

  /**
   * Preserva a carteira e limpa quantidade e preço — inclusive a ação, que na
   * venda precisa existir na posição e na compra pode ser qualquer uma.
   */
  escolherTipo(tipo: TipoOperacao): void {
    if (tipo === this.tipo()) {
      return;
    }
    this.tipo.set(tipo);
    this.ticker.set(null);
    this.quantidade.set(null);
    this.precoManual.set(null);
    this.precoManualAtivo.set(false);
    this.erroDeCampo.set(null);
  }

  escolherCarteira(id: number | null): void {
    this.carteiraId.set(id);
    this.ticker.set(null);
    this.quantidade.set(null);
    this.erroDeCampo.set(null);
    this.vendaveis.set([]);
    if (id !== null) {
      this.carregarPosicoes(id);
    }
  }

  alternarPrecoManual(ativo: boolean): void {
    this.precoManualAtivo.set(ativo);
    if (!ativo) {
      this.precoManual.set(null);
    }
    this.erroDeCampo.set(null);
  }

  enviar(): void {
    if (!this.podeEnviar() || this.enviando()) {
      return;
    }
    this.erroDeCampo.set(null);

    const operacao: NovaOperacao = {
      carteiraId: this.carteiraId()!,
      ticker: this.ticker()!,
      quantidade: this.quantidade()!,
    };
    if (this.precoManualAtivo() && this.precoManual()) {
      operacao.precoUnitario = this.precoManual()!;
    }

    this.registrar.emit({ tipo: this.tipo(), operacao });
  }

  /** A operação deu certo: a carteira fica, o resto sai do caminho (AC-156). */
  prepararProxima(): void {
    this.quantidade.set(null);
    this.precoManual.set(null);
    this.precoManualAtivo.set(false);
    this.erroDeCampo.set(null);
    const carteira = this.carteiraId();
    if (carteira !== null) {
      this.carregarPosicoes(carteira);
    }
  }

  /**
   * OPE-004 destaca a quantidade e OPE-005 o preço, sem nada ser apagado: o
   * investidor corrige o número em vez de refazer o formulário (PRD-009).
   */
  aplicarErro(erro: ErroTraduzido, quantidadeDisponivel?: number): void {
    if (!erro.campoDestacado) {
      return;
    }
    const mensagem =
      erro.codigo === 'OPE-004' && quantidadeDisponivel !== undefined
        ? CATALOGO_ERROS['OPE-004'].mensagem.replace(
            '{quantidade}',
            formatarNumero(quantidadeDisponivel, 0),
          )
        : erro.mensagem;
    this.erroDeCampo.set({ campo: erro.campoDestacado, mensagem });
  }

  private carregarPosicoes(carteiraId: number): void {
    this.carregandoPosicoes.set(true);
    this.carteirasService.posicoes(carteiraId).subscribe({
      next: (posicoes) => {
        this.vendaveis.set(acoesVendaveis(posicoes));
        this.carregandoPosicoes.set(false);
      },
      error: () => {
        this.vendaveis.set([]);
        this.carregandoPosicoes.set(false);
      },
    });
  }
}
