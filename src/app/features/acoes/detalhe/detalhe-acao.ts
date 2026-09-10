import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Botao } from '../../../shared/botao/botao';
import { CATALOGO_ERROS } from '../../../core/erros/catalogo-erros';
import { ErroTraduzido, traduzirErro } from '../../../core/erros/tradutor-erro';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarHora } from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { rotuloDoMercado } from '../../carteiras/carteiras.model';
import { Acao } from '../acoes.model';
import { AcoesService } from '../acoes.service';
import { Desfecho, classificarAtualizacao } from '../desfecho-cotacao';

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
@Component({
  selector: 'app-detalhe-acao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Botao,
    MensagemFeedback,
    DialogoConfirmacao,
    ValorComHorario,
  ],
  templateUrl: './detalhe-acao.html',
  styleUrl: './detalhe-acao.scss',
})
export class DetalheAcao {
  private readonly acoes = inject(AcoesService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  protected readonly rotuloDoMercado = rotuloDoMercado;

  readonly acao = signal<Acao | null>(null);
  readonly carregando = signal(true);
  readonly atualizando = signal(false);
  readonly desfecho = signal<Desfecho | null>(null);
  readonly resultadoDaAtualizacao = signal<string | null>(null);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);
  readonly nivelDoErro = signal<'erro' | 'aviso'>('erro');
  readonly confirmandoRemocao = signal(false);
  readonly removendo = signal(false);

  constructor() {
    this.rota.paramMap.subscribe((parametros) => this.carregar(parametros.get('ticker') ?? ''));
  }

  atualizarCotacao(): void {
    this.pedirCotacao(false);
  }

  /**
   * Ignora o cache e vai direto à fonte. Só é oferecida depois de o cache ter
   * sido reaproveitado, porque cada chamada forçada consome a cota que todos os
   * investidores dividem.
   */
  forcarAtualizacao(): void {
    this.pedirCotacao(true);
  }

  pedirRemocao(): void {
    this.limparMensagens();
    this.confirmandoRemocao.set(true);
  }

  cancelarRemocao(): void {
    this.confirmandoRemocao.set(false);
  }

  confirmarRemocao(): void {
    const acao = this.acao();
    if (!acao || this.removendo()) {
      return;
    }

    this.removendo.set(true);
    this.acoes.remover(acao.ticker).subscribe({
      next: () => {
        this.removendo.set(false);
        this.confirmandoRemocao.set(false);
        this.feedback.informar(`${acao.ticker} saiu do catálogo.`);
        this.router.navigateByUrl('/acoes');
      },
      error: (erro: ErroTraduzido) => {
        this.removendo.set(false);
        // ACA-003 cancela a exclusão. O texto é o do catálogo e não diz de quem
        // são as posições nem em qual carteira estão.
        this.confirmandoRemocao.set(false);
        this.textoDoErro.set(erro.mensagem);
        this.codigoDoErro.set(erro.codigo);
        this.nivelDoErro.set('erro');
      },
    });
  }

  private pedirCotacao(forcar: boolean): void {
    const anterior = this.acao();
    if (!anterior || this.atualizando()) {
      return;
    }

    this.limparMensagens();
    this.atualizando.set(true);

    this.acoes.atualizarCotacao(anterior.id, forcar).subscribe({
      next: (atual) => {
        this.atualizando.set(false);
        this.acao.set(atual);
        const resultado = classificarAtualizacao(anterior, atual);
        this.desfecho.set(resultado.desfecho);
        this.resultadoDaAtualizacao.set(resultado.mensagem);
      },
      error: (erro: ErroTraduzido) => {
        this.atualizando.set(false);
        this.falharMantendoOPreco(erro, anterior);
      },
    });
  }

  /**
   * EXT-009 e EXT-010 chegam com `{horario}` por preencher: o horário é da
   * cotação que está na tela, e só a tela sabe qual é. O preço anterior fica.
   */
  private falharMantendoOPreco(erro: ErroTraduzido, exibida: Acao): void {
    const traduzido =
      erro.comportamento === 'manter-ultimo-valor' && erro.original
        ? traduzirErro(erro.original, { horario: formatarHora(exibida.dataHoraCotacao) })
        : erro;

    this.textoDoErro.set(traduzido.mensagem);
    this.codigoDoErro.set(traduzido.codigo);
    this.nivelDoErro.set(traduzido.nivel === 'aviso' ? 'aviso' : 'erro');
  }

  private carregar(ticker: string): void {
    this.carregando.set(true);
    this.acoes.porTicker(ticker).subscribe((acao) => {
      this.carregando.set(false);
      if (acao) {
        this.acao.set(acao);
        return;
      }
      // Ticker fora do catálogo é o mesmo que ACA-001: a mensagem sai do
      // catálogo de erros, não de um texto escrito aqui.
      this.feedback.errar(CATALOGO_ERROS['ACA-001'].mensagem, 'ACA-001');
      this.router.navigateByUrl('/acoes');
    });
  }

  private limparMensagens(): void {
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
    this.resultadoDaAtualizacao.set(null);
    this.desfecho.set(null);
  }
}
