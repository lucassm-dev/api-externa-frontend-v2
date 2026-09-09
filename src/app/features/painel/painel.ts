import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { catchError, of } from 'rxjs';
import { BarraMercado } from './blocos/barra-mercado';
import { CarteirasDoInvestidor } from './blocos/carteiras-do-investidor';
import { Consolidado } from './blocos/consolidado';
import { ConviteProximoPasso } from './blocos/convite-proximo-passo';
import { UltimasMovimentacoes } from './blocos/ultimas-movimentacoes';
import { CarteiraPreferida } from './carteira-preferida';
import { BarraDeMercado, CarteiraResumida, ConsolidadoDaCarteira, Movimentacao } from './painel.model';
import { PainelService } from './painel.service';
import { decidirProximoPasso } from './proximo-passo';

/**
 * Os quatro blocos do PRD-003, nesta ordem. Quando existe um próximo passo, ele
 * ocupa o corpo da tela no lugar dos blocos 2, 3 e 4 — a barra de mercado fica,
 * porque não depende de dado nenhum do investidor.
 *
 * `null` aqui é sempre estado desconhecido: a leitura falhou e o painel degrada
 * o bloco afetado sem derrubar a tela nem inventar um passo (ADR-006, ASM-016).
 */
@Component({
  selector: 'app-painel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BarraMercado, Consolidado, CarteirasDoInvestidor, UltimasMovimentacoes, ConviteProximoPasso],
  templateUrl: './painel.html',
  styleUrl: './painel.scss',
})
export class Painel {
  private readonly painel = inject(PainelService);
  private readonly preferida = inject(CarteiraPreferida);

  protected readonly barra = signal<BarraDeMercado | null>(null);
  protected readonly carteiras = signal<CarteiraResumida[] | null>(null);
  protected readonly movimentacoes = signal<Movimentacao[] | null>(null);
  protected readonly catalogoTemCorretora = signal<boolean | null>(null);
  protected readonly consolidado = signal<ConsolidadoDaCarteira | null>(null);
  protected readonly carteiraSelecionada = signal<number | null>(null);

  protected readonly carregandoEstado = signal(true);
  protected readonly carregandoConsolidado = signal(false);

  protected readonly proximoPasso = computed(() =>
    this.carregandoEstado()
      ? null
      : decidirProximoPasso({
          catalogoTemCorretora: this.catalogoTemCorretora(),
          temCarteira: this.carteiras() === null ? null : this.carteiras()!.length > 0,
          temOperacao: this.movimentacoes() === null ? null : this.movimentacoes()!.length > 0,
        }),
  );

  protected readonly mostrarBlocosDoInvestidor = computed(
    () => this.carregandoEstado() || this.proximoPasso() === null,
  );

  constructor() {
    this.painel.barraDeMercado().subscribe((barra) => this.barra.set(barra));

    let faltando = 3;
    const terminou = () => {
      if (--faltando === 0) {
        this.carregandoEstado.set(false);
      }
    };

    this.painel
      .catalogoTemCorretora()
      .pipe(catchError(() => of(null)))
      .subscribe((tem) => {
        this.catalogoTemCorretora.set(tem);
        terminou();
      });

    this.painel
      .carteiras()
      .pipe(catchError(() => of(null)))
      .subscribe((carteiras) => {
        this.carteiras.set(carteiras);
        const escolhida = carteiras ? this.preferida.escolherEntre(carteiras) : null;
        if (escolhida) {
          this.carteiraSelecionada.set(escolhida.id);
          this.buscarConsolidado(escolhida.id);
        }
        terminou();
      });

    this.painel
      .ultimasMovimentacoes()
      .pipe(catchError(() => of(null)))
      .subscribe((movimentacoes) => {
        this.movimentacoes.set(movimentacoes);
        terminou();
      });
  }

  protected trocarCarteira(carteiraId: number): void {
    this.preferida.lembrar(carteiraId);
    this.carteiraSelecionada.set(carteiraId);
    this.buscarConsolidado(carteiraId);
  }

  private buscarConsolidado(carteiraId: number): void {
    this.carregandoConsolidado.set(true);
    this.consolidado.set(null);
    this.painel
      .consolidado(carteiraId)
      .pipe(catchError(() => of(null)))
      .subscribe((consolidado) => {
        this.consolidado.set(consolidado);
        this.carregandoConsolidado.set(false);
      });
  }
}
