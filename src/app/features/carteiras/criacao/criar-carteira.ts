import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { aplicarErroNoFormulario } from '../../../core/erros/erro-em-formulario';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { Corretora, nomeExibido } from '../../corretoras/corretoras.model';
import { CorretorasService } from '../../corretoras/corretoras.service';
import { MERCADOS, Mercado } from '../carteiras.model';
import { CarteirasService } from '../carteiras.service';

/**
 * Três campos, nenhum a mais. O mercado continua aqui porque o backend o exige,
 * mas é moeda de referência, não restrição: a carteira aceita ações dos dois
 * mercados (ADR-004). Nenhum valor padrão escondido — gravar um mercado que o
 * investidor não escolheu é pior do que pedir a escolha (PRD-005).
 *
 * Catálogo vazio não vira seletor vazio: a tela leva ao cadastro de corretora
 * e traz o investidor de volta para cá.
 */
@Component({
  selector: 'app-criar-carteira',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MensagemFeedback,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './criar-carteira.html',
  styleUrl: './criar-carteira.scss',
})
export class CriarCarteira {
  private readonly carteiras = inject(CarteirasService);
  private readonly corretoras = inject(CorretorasService);
  private readonly router = inject(Router);

  protected readonly mercados = MERCADOS;
  protected readonly nomeExibido = nomeExibido;

  readonly catalogo = signal<Corretora[]>([]);
  readonly carregando = signal(true);
  readonly criando = signal(false);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);

  readonly catalogoVazio = computed(() => !this.carregando() && this.catalogo().length === 0);

  readonly formulario = inject(FormBuilder).group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    corretoraId: [null as number | null, Validators.required],
    mercado: [null as Mercado | null, Validators.required],
  });

  constructor() {
    this.corretoras.listar(0).subscribe({
      next: (pagina) => {
        this.catalogo.set(pagina.content);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }

  enviar(): void {
    if (this.criando()) {
      return;
    }
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { nome, corretoraId, mercado } = this.formulario.getRawValue();
    this.criando.set(true);

    this.carteiras
      .criar({ corretoraId: corretoraId!, mercado: mercado!, nome: nome!.trim() })
      .subscribe({
        next: (carteira) => {
          this.criando.set(false);
          this.router.navigate(['/carteiras', carteira.id]);
        },
        error: (erro: ErroTraduzido) => {
          this.criando.set(false);
          this.textoDoErro.set(aplicarErroNoFormulario(erro, this.formulario));
          this.codigoDoErro.set(erro.codigo);
        },
      });
  }
}
