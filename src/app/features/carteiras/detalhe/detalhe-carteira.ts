import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATALOGO_ERROS } from '../../../core/erros/catalogo-erros';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { Variacao } from '../../../shared/variacao/variacao';
import { EditarOperacao } from '../../operacoes/edicao/editar-operacao';
import { AlteracaoDeOperacao } from '../../operacoes/operacoes.model';
import { OperacoesService } from '../../operacoes/operacoes.service';
import {
  Carteira,
  ConsolidadoDaCarteira,
  ExtratoBuscado,
  LucroRealizado,
  MovimentacaoDoExtrato,
  Posicao,
  rotuloDoMercado,
} from '../carteiras.model';
import { CarteirasService } from '../carteiras.service';
import { MovimentacoesCarteira } from './movimentacoes-carteira';
import { PosicoesCarteira } from './posicoes-carteira';

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
@Component({
  selector: 'app-detalhe-carteira',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MensagemFeedback,
    DialogoConfirmacao,
    ValorComHorario,
    Variacao,
    PosicoesCarteira,
    MovimentacoesCarteira,
    EditarOperacao,
  ],
  templateUrl: './detalhe-carteira.html',
  styleUrl: './detalhe-carteira.scss',
})
export class DetalheCarteira {
  private readonly carteiras = inject(CarteirasService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);
  private readonly operacoes = inject(OperacoesService);

  protected readonly formatarReal = formatarReal;
  protected readonly rotuloDoMercado = rotuloDoMercado;

  readonly carteira = signal<Carteira | null>(null);
  readonly posicoes = signal<Posicao[]>([]);
  readonly consolidado = signal<ConsolidadoDaCarteira | null>(null);
  readonly lucroRealizado = signal<LucroRealizado | null>(null);
  readonly extrato = signal<ExtratoBuscado | null>(null);
  readonly carregando = signal(true);

  readonly renomeando = signal(false);
  readonly nomeEditado = signal('');
  readonly salvandoNome = signal(false);

  readonly confirmandoExclusao = signal(false);
  readonly removendo = signal(false);

  readonly operacaoEmEdicao = signal<MovimentacaoDoExtrato | null>(null);
  readonly salvandoOperacao = signal(false);
  readonly excluindoOperacao = signal(false);

  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);

  /** Uma saída só: três leituras podem recusar com CAR-001 ao mesmo tempo. */
  private saiu = false;

  constructor() {
    this.rota.paramMap.subscribe((parametros) => this.abrir(Number(parametros.get('id'))));
  }

  pedirRenomeacao(): void {
    this.limparErro();
    this.nomeEditado.set(this.carteira()?.nome ?? '');
    this.renomeando.set(true);
  }

  cancelarRenomeacao(): void {
    this.renomeando.set(false);
  }

  /** Só o nome muda — nada mais da carteira é editável, e nada é recarregado. */
  confirmarRenomeacao(): void {
    const carteira = this.carteira();
    const nome = this.nomeEditado().trim();
    if (!carteira || !nome || this.salvandoNome()) {
      return;
    }

    this.salvandoNome.set(true);
    this.carteiras.renomear(carteira.id, nome).subscribe({
      next: (atualizada) => {
        this.salvandoNome.set(false);
        this.renomeando.set(false);
        this.carteira.set({ ...carteira, ...atualizada });
      },
      error: (erro: ErroTraduzido) => {
        this.salvandoNome.set(false);
        this.renomeando.set(false);
        this.tratar(erro);
      },
    });
  }

  pedirExclusao(): void {
    this.limparErro();
    this.confirmandoExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.confirmandoExclusao.set(false);
  }

  confirmarExclusao(): void {
    const carteira = this.carteira();
    if (!carteira || this.removendo()) {
      return;
    }

    this.removendo.set(true);
    this.carteiras.excluir(carteira.id).subscribe({
      next: () => {
        this.removendo.set(false);
        this.confirmandoExclusao.set(false);
        this.feedback.informar(`${carteira.nome} saiu da sua lista.`);
        this.router.navigateByUrl('/carteiras');
      },
      error: (erro: ErroTraduzido) => {
        this.removendo.set(false);
        // CAR-002 cancela a exclusão: a mensagem diz o que fazer antes de
        // tentar de novo, e a carteira continua inteira na tela (ADR-007).
        this.confirmandoExclusao.set(false);
        this.tratar(erro);
      },
    });
  }

  abrirEdicaoDeOperacao(movimentacao: MovimentacaoDoExtrato): void {
    this.limparErro();
    this.operacaoEmEdicao.set(movimentacao);
  }

  fecharEdicaoDeOperacao(): void {
    this.operacaoEmEdicao.set(null);
  }

  /**
   * Editar não corrige uma linha isolada: refaz preço médio, posição e
   * resultado da carteira. Por isso o que é relido aqui é a tela inteira, sem
   * o investidor precisar recarregar nada (AC-178).
   */
  salvarEdicaoDeOperacao(alteracao: AlteracaoDeOperacao): void {
    const movimentacao = this.operacaoEmEdicao();
    const carteira = this.carteira();
    if (!movimentacao || !carteira || this.salvandoOperacao()) {
      return;
    }

    this.salvandoOperacao.set(true);
    this.operacoes.alterar(movimentacao.id, alteracao).subscribe({
      next: () => {
        this.salvandoOperacao.set(false);
        this.operacaoEmEdicao.set(null);
        this.carregarConteudo(carteira.id);
      },
      error: (erro: ErroTraduzido) => {
        this.salvandoOperacao.set(false);
        this.operacaoEmEdicao.set(null);
        this.tratarOperacao(erro, carteira.id);
      },
    });
  }

  excluirOperacao(movimentacao: MovimentacaoDoExtrato): void {
    const carteira = this.carteira();
    if (!carteira || this.excluindoOperacao()) {
      return;
    }

    this.excluindoOperacao.set(true);
    this.operacoes.excluir(movimentacao.id).subscribe({
      next: () => {
        this.excluindoOperacao.set(false);
        this.feedback.informar('Operação removida do extrato.');
        this.carregarConteudo(carteira.id);
      },
      error: (erro: ErroTraduzido) => {
        this.excluindoOperacao.set(false);
        this.tratarOperacao(erro, carteira.id);
      },
    });
  }

  /** OPE-001 aqui não devolve à lista: a carteira continua, só a operação sumiu. */
  private tratarOperacao(erro: ErroTraduzido, carteiraId: number): void {
    this.textoDoErro.set(erro.mensagem);
    this.codigoDoErro.set(erro.codigo);
    if (erro.comportamento === 'recarregar') {
      this.carregarConteudo(carteiraId);
    }
  }

  private abrir(id: number): void {
    this.carregando.set(true);
    this.carteiras.porId(id).subscribe({
      next: (carteira) => {
        this.carregando.set(false);
        if (!carteira) {
          this.naoEncontrada();
          return;
        }
        this.carteira.set(carteira);
        this.carregarConteudo(id);
      },
      error: (erro: ErroTraduzido) => {
        this.carregando.set(false);
        this.tratar(erro);
      },
    });
  }

  private carregarConteudo(id: number): void {
    this.carteiras.posicoes(id).subscribe({
      next: (posicoes) => this.posicoes.set(posicoes),
      error: (erro: ErroTraduzido) => this.tratar(erro),
    });
    this.carteiras.consolidado(id).subscribe({
      next: (consolidado) => this.consolidado.set(consolidado),
      error: (erro: ErroTraduzido) => this.tratar(erro),
    });
    this.carteiras.lucroRealizado(id).subscribe({
      next: (lucro) => this.lucroRealizado.set(lucro),
      error: (erro: ErroTraduzido) => this.tratar(erro),
    });
    this.carteiras.extratoDoInvestidor().subscribe({
      next: (extrato) => this.extrato.set(extrato),
      error: () => this.extrato.set(null),
    });
  }

  private tratar(erro: ErroTraduzido): void {
    if (erro.comportamento === 'voltar-a-lista') {
      this.naoEncontrada(erro.mensagem, erro.codigo);
      return;
    }
    this.textoDoErro.set(erro.mensagem);
    this.codigoDoErro.set(erro.codigo);
  }

  /**
   * Não achar a carteira na listagem é indistinguível de CAR-001 — e é assim
   * que o produto quer: a tela nunca diz de quem a carteira seria (Q-015).
   */
  private naoEncontrada(
    mensagem = CATALOGO_ERROS['CAR-001'].mensagem,
    codigo: string | null = 'CAR-001',
  ): void {
    if (this.saiu) {
      return;
    }
    this.saiu = true;
    this.feedback.errar(mensagem, codigo);
    this.router.navigateByUrl('/carteiras');
  }

  private limparErro(): void {
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
  }
}
