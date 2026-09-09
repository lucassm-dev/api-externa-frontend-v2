import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Pagina } from '../../../core/api/pagina';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { formatarReal } from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { Variacao } from '../../../shared/variacao/variacao';
import { Carteira, rotuloDoMercado } from '../carteiras.model';
import { CarteirasService, NumerosDaCarteira } from '../carteiras.service';

/**
 * Só as carteiras do investidor logado existem aqui — o backend já garante
 * isso, e a tela não sugere o contrário: sem busca por investidor, sem menção
 * a catálogo compartilhado (isso é das corretoras, ADR-002).
 *
 * A listagem não devolve valor nem resultado: os números vêm por carteira,
 * cada leitura independente. O que falhar some da linha; a lista continua
 * inteira e sem alarme (ADR-006, Q-013).
 */
@Component({
  selector: 'app-lista-carteiras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MensagemFeedback,
    DialogoConfirmacao,
    Variacao,
  ],
  templateUrl: './lista-carteiras.html',
  styleUrl: './lista-carteiras.scss',
})
export class ListaCarteiras {
  private readonly carteiras = inject(CarteirasService);

  protected readonly formatarReal = formatarReal;
  protected readonly rotuloDoMercado = rotuloDoMercado;

  readonly pagina = signal<Pagina<Carteira> | null>(null);
  readonly carregando = signal(true);
  readonly numeros = signal<Map<number, NumerosDaCarteira>>(new Map());

  readonly renomeando = signal<Carteira | null>(null);
  readonly nomeEditado = signal('');
  readonly salvandoNome = signal(false);

  readonly excluindo = signal<Carteira | null>(null);
  readonly removendo = signal(false);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);

  constructor() {
    this.irPara(0);
  }

  irPara(numero: number): void {
    this.carregando.set(true);
    this.carteiras.listar(numero).subscribe({
      next: (pagina) => {
        this.pagina.set(pagina);
        this.carregando.set(false);
        this.numeros.set(new Map());
        for (const carteira of pagina.content) {
          this.buscarNumeros(carteira.id);
        }
      },
      error: () => this.carregando.set(false),
    });
  }

  pedirRenomeacao(carteira: Carteira): void {
    this.limparErro();
    this.nomeEditado.set(carteira.nome);
    this.renomeando.set(carteira);
  }

  cancelarRenomeacao(): void {
    this.renomeando.set(null);
  }

  confirmarRenomeacao(): void {
    const carteira = this.renomeando();
    const nome = this.nomeEditado().trim();
    if (!carteira || !nome || this.salvandoNome()) {
      return;
    }

    this.salvandoNome.set(true);
    this.carteiras.renomear(carteira.id, nome).subscribe({
      next: (atualizada) => {
        this.salvandoNome.set(false);
        this.renomeando.set(null);
        this.substituir(atualizada);
      },
      error: (erro: ErroTraduzido) => {
        this.salvandoNome.set(false);
        this.renomeando.set(null);
        this.mostrarErro(erro);
      },
    });
  }

  pedirExclusao(carteira: Carteira): void {
    this.limparErro();
    this.excluindo.set(carteira);
  }

  cancelarExclusao(): void {
    this.excluindo.set(null);
  }

  /**
   * Para o investidor, excluir é sumir da lista: sem lixeira, sem desfazer
   * (ADR-007). CAR-002 cancela a exclusão com a mensagem que diz o que fazer.
   */
  confirmarExclusao(): void {
    const carteira = this.excluindo();
    if (!carteira || this.removendo()) {
      return;
    }

    this.removendo.set(true);
    this.carteiras.excluir(carteira.id).subscribe({
      next: () => {
        this.removendo.set(false);
        this.excluindo.set(null);
        this.irPara(this.pagina()?.number ?? 0);
      },
      error: (erro: ErroTraduzido) => {
        this.removendo.set(false);
        this.excluindo.set(null);
        this.mostrarErro(erro);
      },
    });
  }

  protected numerosDe(id: number): NumerosDaCarteira | undefined {
    return this.numeros().get(id);
  }

  private buscarNumeros(id: number): void {
    this.carteiras.numerosDaCarteira(id).subscribe((numeros) => {
      this.numeros.update((atual) => new Map(atual).set(id, numeros));
    });
  }

  private substituir(atualizada: Carteira): void {
    this.pagina.update((pagina) =>
      pagina
        ? {
            ...pagina,
            content: pagina.content.map((c) => (c.id === atualizada.id ? atualizada : c)),
          }
        : pagina,
    );
  }

  private mostrarErro(erro: ErroTraduzido): void {
    this.textoDoErro.set(erro.mensagem);
    this.codigoDoErro.set(erro.codigo);
  }

  private limparErro(): void {
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
  }
}
