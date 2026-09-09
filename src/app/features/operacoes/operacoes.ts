import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ErroTraduzido } from '../../core/erros/tradutor-erro';
import { FeedbackService } from '../../core/feedback/feedback.service';
import { MensagemFeedback } from '../../core/feedback/mensagem-feedback';
import { Carteira } from '../carteiras/carteiras.model';
import { CarteirasService } from '../carteiras/carteiras.service';
import { EditarOperacao } from './edicao/editar-operacao';
import { ExtratoOperacoes } from './extrato/extrato-operacoes';
import { FormularioOperacao } from './formulario/formulario-operacao';
import {
  AlteracaoDeOperacao,
  NovaOperacao,
  Operacao,
  OperacaoDoExtrato,
  TipoOperacao,
} from './operacoes.model';
import { OperacoesService } from './operacoes.service';
import { ResultadoOperacao } from './resultado/resultado-operacao';

/**
 * Uma tela só: formulário no topo, extrato abaixo (Q-019). É o destino dos dois
 * links que já existem no produto — o "registrar compra/venda" do detalhe da
 * carteira, com `?carteira=&tipo=`, e o "ver o extrato completo" das
 * movimentações.
 *
 * O formulário nunca fecha depois de registrar: quem registra uma compra
 * normalmente registra várias na mesma sessão, e obrigar a voltar à carteira a
 * cada lançamento é o atrito mais caro do produto (PRD-007).
 */
@Component({
  selector: 'app-operacoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MensagemFeedback,
    FormularioOperacao,
    ResultadoOperacao,
    ExtratoOperacoes,
    EditarOperacao,
  ],
  templateUrl: './operacoes.html',
  styleUrl: './operacoes.scss',
})
export class Operacoes {
  private readonly operacoesService = inject(OperacoesService);
  private readonly carteirasService = inject(CarteirasService);
  private readonly rota = inject(ActivatedRoute);
  private readonly feedback = inject(FeedbackService);

  private readonly formulario = viewChild(FormularioOperacao);

  readonly carteiraInicial = signal<number | null>(null);
  readonly tipoInicial = signal<TipoOperacao>('COMPRA');

  readonly carteiras = signal<Carteira[]>([]);
  readonly extrato = signal<OperacaoDoExtrato[]>([]);
  readonly pagina = signal(0);
  readonly totalDePaginas = signal(0);
  readonly carregandoExtrato = signal(true);

  readonly ultimaOperacao = signal<Operacao | null>(null);
  readonly registrando = signal(false);

  readonly emEdicao = signal<OperacaoDoExtrato | null>(null);
  readonly salvandoEdicao = signal(false);
  readonly excluindo = signal(false);

  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);

  constructor() {
    const parametros = this.rota.snapshot.queryParamMap;
    const carteira = parametros.get('carteira');
    if (carteira) {
      this.carteiraInicial.set(Number(carteira));
    }
    if (parametros.get('tipo') === 'VENDA') {
      this.tipoInicial.set('VENDA');
    }

    this.carteirasService.listar(0).subscribe({
      next: (paginaDeCarteiras) => this.carteiras.set(paginaDeCarteiras.content),
      error: () => this.carteiras.set([]),
    });
    this.lerExtrato(0);
  }

  /**
   * Registrar é sucesso mesmo trazendo avisos (ADR-006): o resultado vai para o
   * bloco de confirmação, que apresenta os avisos como aviso. Nada aqui pode
   * encaminhar uma operação registrada ao caminho de erro.
   */
  registrar(pedido: { tipo: TipoOperacao; operacao: NovaOperacao }): void {
    if (this.registrando()) {
      return;
    }
    this.limparErro();
    this.registrando.set(true);

    this.operacoesService.registrar(pedido.tipo, pedido.operacao).subscribe({
      next: (operacao) => {
        this.registrando.set(false);
        this.ultimaOperacao.set(operacao);
        this.formulario()?.prepararProxima();
        this.lerExtrato(0);
      },
      error: (erro: ErroTraduzido) => {
        this.registrando.set(false);
        this.tratarNoFormulario(erro);
      },
    });
  }

  abrirEdicao(operacao: OperacaoDoExtrato): void {
    this.limparErro();
    this.emEdicao.set(operacao);
  }

  fecharEdicao(): void {
    this.emEdicao.set(null);
  }

  salvarEdicao(alteracao: AlteracaoDeOperacao): void {
    const operacao = this.emEdicao();
    if (!operacao || this.salvandoEdicao()) {
      return;
    }
    this.salvandoEdicao.set(true);

    this.operacoesService.alterar(operacao.id, alteracao).subscribe({
      next: (atualizada) => {
        this.salvandoEdicao.set(false);
        this.emEdicao.set(null);
        this.ultimaOperacao.set(atualizada);
        this.lerExtrato(this.pagina());
      },
      error: (erro: ErroTraduzido) => {
        this.salvandoEdicao.set(false);
        this.emEdicao.set(null);
        this.tratarNaLista(erro);
      },
    });
  }

  excluir(operacao: OperacaoDoExtrato): void {
    if (this.excluindo()) {
      return;
    }
    this.excluindo.set(true);

    this.operacoesService.excluir(operacao.id).subscribe({
      next: () => {
        this.excluindo.set(false);
        this.feedback.informar('Operação removida do extrato.');
        this.lerExtrato(this.pagina());
      },
      error: (erro: ErroTraduzido) => {
        this.excluindo.set(false);
        this.tratarNaLista(erro);
      },
    });
  }

  mudarPagina(pagina: number): void {
    this.lerExtrato(pagina);
  }

  private lerExtrato(pagina: number): void {
    this.carregandoExtrato.set(true);
    this.operacoesService.extrato(pagina).subscribe({
      next: (resposta) => {
        this.extrato.set(resposta.content);
        this.pagina.set(resposta.number);
        this.totalDePaginas.set(resposta.totalPages);
        this.carregandoExtrato.set(false);
      },
      error: () => this.carregandoExtrato.set(false),
    });
  }

  /** OPE-004 e OPE-005 pertencem ao campo; o resto fica visível acima do formulário. */
  private tratarNoFormulario(erro: ErroTraduzido): void {
    if (erro.campoDestacado) {
      this.formulario()?.aplicarErro(erro);
      return;
    }
    this.textoDoErro.set(erro.mensagem);
    this.codigoDoErro.set(erro.codigo);
  }

  /**
   * OPE-001 quase sempre significa que a operação foi excluída em outra aba:
   * reler o extrato mostra a lista sem ela em vez de insistir no que sumiu.
   */
  private tratarNaLista(erro: ErroTraduzido): void {
    this.textoDoErro.set(erro.mensagem);
    this.codigoDoErro.set(erro.codigo);
    if (erro.comportamento === 'recarregar') {
      this.lerExtrato(this.pagina());
    }
  }

  private limparErro(): void {
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
  }
}
