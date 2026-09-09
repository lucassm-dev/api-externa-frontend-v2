import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATALOGO_ERROS } from '../../../core/erros/catalogo-erros';
import { aplicarErroNoFormulario } from '../../../core/erros/erro-em-formulario';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { AcessoService } from '../acesso.service';
import { ROTA_AREA_INTERNA, ROTA_CADASTRO } from '../acesso.model';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MensagemFeedback,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly acesso = inject(AcessoService);
  private readonly router = inject(Router);
  private readonly rota = inject(ActivatedRoute);

  protected readonly rotaCadastro = ROTA_CADASTRO;

  readonly enviando = signal(false);
  readonly mensagemGeral = signal<string | null>(null);
  /** Confirmação de conta criada, vinda do cadastro. */
  readonly contaCriada = signal(false);
  /** Motivo do retorno ao login, quando a sessão acabou (AUT-005, AUT-006). */
  readonly motivoDeSaida = signal<string | null>(null);

  readonly formulario = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
  });

  constructor() {
    const parametros = this.rota.snapshot.queryParams as Record<string, string | undefined>;

    if (parametros['email']) {
      this.formulario.controls.email.setValue(parametros['email']);
    }
    this.contaCriada.set(parametros['contaCriada'] === '1');

    // O texto vem do catálogo pelo código, nunca do que o servidor escreveu.
    const motivo = parametros['motivo'];
    this.motivoDeSaida.set(motivo ? (CATALOGO_ERROS[motivo]?.mensagem ?? null) : null);
  }

  enviar(): void {
    if (this.enviando()) {
      return;
    }
    this.mensagemGeral.set(null);
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.acesso.entrar(this.formulario.getRawValue()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.router.navigateByUrl(ROTA_AREA_INTERNA);
      },
      error: (erro: ErroTraduzido) => {
        this.enviando.set(false);
        // AUT-004 é genérico de propósito: nada aqui aponta qual campo errou.
        this.mensagemGeral.set(aplicarErroNoFormulario(erro, this.formulario));
      },
    });
  }
}
