import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Pagina } from '../../../core/api/pagina';
import { ValorComHorario } from '../../../shared/valor-com-horario/valor-com-horario';
import { rotuloDoMercado } from '../../carteiras/carteiras.model';
import { Acao, normalizarTicker } from '../acoes.model';
import { AcoesService } from '../acoes.service';

/**
 * O catálogo compartilhado (ADR-002): existe uma só PETR4 no sistema inteiro, e
 * uma ação cadastrada por qualquer investidor serve a todos. Por isso o título
 * é "Ações", nunca "Minhas ações".
 *
 * Sem selo de posse, ao contrário das corretoras: marcar o que o investidor tem
 * exigiria varrer as posições de todas as carteiras dele — custo despropor-
 * cional e fora do v1 (PRD-006).
 *
 * A tela lê a cotação que o servidor já tinha e não pede atualização nenhuma:
 * a fonte gratuita é compartilhada e quem decide gastá-la é o investidor
 * (ADR-005).
 */
@Component({
  selector: 'app-lista-acoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    ValorComHorario,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './lista-acoes.html',
  styleUrl: './lista-acoes.scss',
})
export class ListaAcoes {
  private readonly acoes = inject(AcoesService);
  private readonly router = inject(Router);

  protected readonly rotuloDoMercado = rotuloDoMercado;

  readonly pagina = signal<Pagina<Acao> | null>(null);
  readonly carregando = signal(true);
  readonly termo = signal('');
  readonly buscando = signal(false);
  readonly tickerSemResultado = signal<string | null>(null);

  constructor() {
    this.irPara(0);
  }

  irPara(numero: number): void {
    this.carregando.set(true);
    this.tickerSemResultado.set(null);

    this.acoes.listar(numero).subscribe({
      next: (pagina) => {
        this.pagina.set(pagina);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  /**
   * Ticker que existe abre a ação; o que não existe vira estado vazio com o
   * convite de cadastrar. ACA-001 fica para quem abre um detalhe inexistente
   * pela URL — buscar e não achar não é erro.
   */
  buscar(termo: string): void {
    const ticker = normalizarTicker(termo);
    if (!ticker) {
      return;
    }

    this.buscando.set(true);
    this.tickerSemResultado.set(null);

    this.acoes.porTicker(ticker).subscribe((acao) => {
      this.buscando.set(false);
      if (acao) {
        this.router.navigate(['/acoes', acao.ticker]);
      } else {
        this.tickerSemResultado.set(ticker);
      }
    });
  }

  limparBusca(): void {
    this.termo.set('');
    this.tickerSemResultado.set(null);
  }
}
