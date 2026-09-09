import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MensagemFeedback } from '../core/feedback/mensagem-feedback';
import { AcessoService } from '../features/acesso/acesso.service';
import { MINUTOS_AVISO_EXPIRACAO, ROTA_LOGIN } from '../core/sessao/sessao.model';
import { SessaoService } from '../core/sessao/sessao.service';
import { TemaService } from '../core/tema/tema.service';
import { AREAS_DO_PRODUTO } from './areas';

const INTERVALO_DE_CHECAGEM_MS = 30_000;

/**
 * Moldura da área autenticada: a navegação das áreas, a troca de tema e o botão
 * de sair — que fica sempre visível (PRD-002, ADR-001) — mais o aviso de sessão
 * acabando, que sai do `expiraEm` guardado, sem tocar o servidor.
 */
@Component({
  selector: 'app-casca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MensagemFeedback, MatButtonModule],
  templateUrl: './casca.html',
  styleUrl: './casca.scss',
})
export class Casca implements OnDestroy {
  private readonly sessao = inject(SessaoService);
  private readonly acesso = inject(AcessoService);
  private readonly router = inject(Router);
  private readonly temaService = inject(TemaService);

  /** Reavalia a idade da sessão de tempos em tempos, sem consultar o backend. */
  private readonly tique = signal(0);
  private readonly relogio = setInterval(
    () => this.tique.update((valor) => valor + 1),
    INTERVALO_DE_CHECAGEM_MS,
  );

  protected readonly areas = AREAS_DO_PRODUTO;
  protected readonly tema = this.temaService.tema;
  protected readonly email = this.sessao.email;
  protected readonly minutosDeAviso = MINUTOS_AVISO_EXPIRACAO;

  protected readonly sessaoAcabando = computed(() => {
    this.tique();
    return this.sessao.acabando();
  });

  ngOnDestroy(): void {
    clearInterval(this.relogio);
  }

  alternarTema(): void {
    this.temaService.alternar();
  }

  sair(): void {
    this.acesso.sair();
    this.router.navigateByUrl(ROTA_LOGIN);
  }

  /** Entrar de novo antes do prazo acabar: encerra a sessão atual e volta ao login. */
  entrarNovamente(): void {
    this.sair();
  }
}
