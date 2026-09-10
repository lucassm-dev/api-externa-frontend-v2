import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Botao } from '../../../shared/botao/botao';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarData } from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { formatarCnpj } from '../cnpj';
import { Corretora, nomeExibido } from '../corretoras.model';
import { CorretorasService } from '../corretoras.service';

/**
 * Os dados vêm de fonte externa e não são editáveis. A data da base da CVM
 * aparece junto da validação porque a base reflete o último dia útil: uma
 * corretora autorizada hoje de manhã pode ainda não constar nela (PRD-004).
 *
 * Remover está disponível em qualquer corretora — o catálogo não tem dono
 * (ADR-002) — e a única proteção é o vínculo ativo, que o servidor decide.
 */
@Component({
  selector: 'app-detalhe-corretora',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Botao, MensagemFeedback, DialogoConfirmacao],
  templateUrl: './detalhe-corretora.html',
  styleUrl: './detalhe-corretora.scss',
})
export class DetalheCorretora {
  private readonly corretoras = inject(CorretorasService);
  private readonly rota = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  protected readonly formatarCnpj = formatarCnpj;
  protected readonly formatarData = formatarData;
  protected readonly nomeExibido = nomeExibido;

  readonly corretora = signal<Corretora | null>(null);
  readonly carregando = signal(true);
  readonly confirmandoRemocao = signal(false);
  readonly removendo = signal(false);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);

  constructor() {
    this.rota.paramMap.subscribe((parametros) => this.carregar(Number(parametros.get('id'))));
  }

  pedirRemocao(): void {
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
    this.confirmandoRemocao.set(true);
  }

  cancelarRemocao(): void {
    this.confirmandoRemocao.set(false);
  }

  /**
   * A remoção é lógica no backend, mas isso não aparece aqui: para o
   * investidor, a corretora some da lista. Sem lixeira, sem desfazer (ADR-007).
   */
  confirmarRemocao(): void {
    const corretora = this.corretora();
    if (!corretora || this.removendo()) {
      return;
    }

    this.removendo.set(true);
    this.corretoras.remover(corretora.id).subscribe({
      next: () => {
        this.removendo.set(false);
        this.confirmandoRemocao.set(false);
        this.feedback.informar(`${nomeExibido(corretora)} saiu do catálogo.`);
        this.router.navigateByUrl('/corretoras');
      },
      error: (erro: ErroTraduzido) => {
        this.removendo.set(false);
        // COR-004 cancela a exclusão. O texto é o do catálogo e não nomeia
        // investidor nem quantidade: de quem são as carteiras não se revela.
        this.confirmandoRemocao.set(false);
        this.textoDoErro.set(erro.mensagem);
        this.codigoDoErro.set(erro.codigo);
      },
    });
  }

  private carregar(id: number): void {
    this.carregando.set(true);
    this.corretoras.porId(id).subscribe({
      next: (corretora) => {
        this.corretora.set(corretora);
        this.carregando.set(false);
      },
      error: (erro: ErroTraduzido) => {
        this.carregando.set(false);
        if (erro.comportamento === 'voltar-a-lista') {
          this.feedback.errar(erro.mensagem, erro.codigo);
          this.router.navigateByUrl('/corretoras');
        } else {
          this.textoDoErro.set(erro.mensagem);
          this.codigoDoErro.set(erro.codigo);
        }
      },
    });
  }
}
