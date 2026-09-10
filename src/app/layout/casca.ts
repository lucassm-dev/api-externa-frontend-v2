import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MensagemFeedback } from '../core/feedback/mensagem-feedback';
import { AcessoService } from '../features/acesso/acesso.service';
import { MINUTOS_AVISO_EXPIRACAO, ROTA_LOGIN } from '../core/sessao/sessao.model';
import { SessaoService } from '../core/sessao/sessao.service';
import { TemaService } from '../core/tema/tema.service';
import { Botao } from '../shared/botao/botao';
import { AREAS_DO_PRODUTO } from './areas';

const INTERVALO_DE_CHECAGEM_MS = 30_000;

/** Abaixo disto a navegação some atrás do botão de menu (AC-271). */
const CONSULTA_TELA_ESTREITA = '(max-width: 47.99em)';

/**
 * Moldura da área autenticada: a navegação das áreas, a troca de tema e o botão
 * de sair — que fica sempre visível (PRD-002, ADR-001) — mais o aviso de sessão
 * acabando, que sai do `expiraEm` guardado, sem tocar o servidor.
 *
 * Na tela estreita a barra vira casca compacta: as áreas ficam atrás de um botão
 * de menu que anuncia `aria-expanded`, abre e fecha por teclado e fecha ao
 * navegar (AC-271).
 */
@Component({
  selector: 'app-casca',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MensagemFeedback, Botao],
  templateUrl: './casca.html',
  styleUrl: './casca.scss',
  host: {
    '(keydown.escape)': 'fecharMenu()',
  },
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

  /** Tela estreita: o menu compacto entra no lugar da navegação horizontal. */
  protected readonly compacto = signal(false);
  protected readonly menuAberto = signal(false);

  private readonly consultaEstreita =
    typeof globalThis !== 'undefined' && typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia(CONSULTA_TELA_ESTREITA)
      : null;

  private readonly aoMudarLargura = (evento: MediaQueryListEvent): void => {
    this.compacto.set(evento.matches);
    if (!evento.matches) {
      this.menuAberto.set(false);
    }
  };

  /** Fechar ao navegar: trocar de área não deixa o menu aberto por cima (AC-271). */
  private readonly fechaAoNavegar = this.router.events.pipe(takeUntilDestroyed()).subscribe((e) => {
    if (e instanceof NavigationEnd) {
      this.fecharMenu();
    }
  });

  protected readonly sessaoAcabando = computed(() => {
    this.tique();
    return this.sessao.acabando();
  });

  constructor() {
    if (this.consultaEstreita) {
      this.compacto.set(this.consultaEstreita.matches);
      this.consultaEstreita.addEventListener('change', this.aoMudarLargura);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.relogio);
    this.consultaEstreita?.removeEventListener('change', this.aoMudarLargura);
  }

  alternarMenu(): void {
    this.menuAberto.update((aberto) => !aberto);
  }

  fecharMenu(): void {
    this.menuAberto.set(false);
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
