import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Pagina } from '../../../core/api/pagina';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { EstadoVazio } from '../../../shared/estado-vazio/estado-vazio';
import { Paginador } from '../../../shared/paginador/paginador';
import { Selo } from '../../../shared/selo/selo';
import { formatarCnpj, somenteDigitos } from '../cnpj';
import { Corretora, cidadeComUf, nomeExibido } from '../corretoras.model';
import { CorretorasService } from '../corretoras.service';
import { rotuloDoSelo } from '../selo-de-uso';

/**
 * O catálogo compartilhado (ADR-002): o investidor vê o que qualquer um
 * cadastrou. O selo de uso é a única coisa pessoal aqui — informativo, some
 * quando a contagem falha e nunca mexe na ordem que o servidor devolveu.
 */
@Component({
  selector: 'app-lista-corretoras',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    Selo,
    Paginador,
    EstadoVazio,
    Esqueleto,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './lista-corretoras.html',
  styleUrl: './lista-corretoras.scss',
})
export class ListaCorretoras {
  private readonly corretoras = inject(CorretorasService);
  private readonly router = inject(Router);

  protected readonly formatarCnpj = formatarCnpj;
  protected readonly nomeExibido = nomeExibido;
  protected readonly cidadeComUf = cidadeComUf;

  readonly pagina = signal<Pagina<Corretora> | null>(null);
  readonly carregando = signal(true);
  readonly selos = signal<Map<number, number>>(new Map());
  readonly termo = signal('');
  readonly buscando = signal(false);
  readonly cnpjSemResultado = signal<string | null>(null);

  constructor() {
    this.irPara(0);
  }

  irPara(numero: number): void {
    this.carregando.set(true);
    this.cnpjSemResultado.set(null);

    this.corretoras.listar(numero).subscribe({
      next: (pagina) => {
        this.pagina.set(pagina);
        this.carregando.set(false);
        this.contarCarteiras();
      },
      error: () => this.carregando.set(false),
    });
  }

  /**
   * Buscar não é navegar às cegas: o CNPJ que existe abre o detalhe, o que não
   * existe vira estado vazio com o convite de cadastrar. COR-001 fica para quem
   * abre um detalhe inexistente pela URL (Q-010).
   */
  buscar(termo: string): void {
    const digitos = somenteDigitos(termo);
    if (digitos.length !== 14) {
      return;
    }

    this.buscando.set(true);
    this.cnpjSemResultado.set(null);

    this.corretoras.porCnpj(digitos).subscribe((corretora) => {
      this.buscando.set(false);
      if (corretora) {
        this.router.navigate(['/corretoras', corretora.id]);
      } else {
        this.cnpjSemResultado.set(digitos);
      }
    });
  }

  limparBusca(): void {
    this.termo.set('');
    this.cnpjSemResultado.set(null);
  }

  cadastrarCorretora(): void {
    this.router.navigate(['/corretoras/nova']);
  }

  protected selo(corretoraId: number): string | null {
    return rotuloDoSelo(this.selos().get(corretoraId));
  }

  private contarCarteiras(): void {
    this.corretoras.carteirasPorCorretora().subscribe((contagem) => this.selos.set(contagem));
  }
}
