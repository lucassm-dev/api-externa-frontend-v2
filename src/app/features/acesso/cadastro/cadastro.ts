import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterLink } from '@angular/router';
import { Botao } from '../../../shared/botao/botao';
import { aplicarErroNoFormulario } from '../../../core/erros/erro-em-formulario';
import { NivelFeedback } from '../../../core/feedback/feedback.model';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { ROTA_LOGIN } from '../../../core/sessao/sessao.model';
import { AcessoService } from '../acesso.service';
import { ForcaDaSenha } from '../forca-da-senha';
import { MolduraAcesso } from '../moldura-acesso';
import {
  REGRA_CPF,
  REGRA_EMAIL,
  REGRA_SENHA,
  cpfValidator,
  digitosDoCpf,
  formatarCpf,
  senhaValidator,
} from '../validadores';

function senhasCoincidemValidator(formulario: AbstractControl): ValidationErrors | null {
  const senha = formulario.get('senha')?.value;
  const confirmarSenha = formulario.get('confirmarSenha')?.value;

  if (!confirmarSenha || senha === confirmarSenha) {
    return null;
  }

  return { senhasDiferentes: true };
}

@Component({
  selector: 'app-cadastro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MolduraAcesso,
    ForcaDaSenha,
    MensagemFeedback,
    MatFormFieldModule,
    MatInputModule,
    Botao,
  ],
  templateUrl: './cadastro.html',
  styleUrl: './cadastro.scss',
})
export class Cadastro {
  private readonly acesso = inject(AcessoService);
  private readonly router = inject(Router);

  protected readonly regraCpf = REGRA_CPF;
  protected readonly regraSenha = REGRA_SENHA;
  protected readonly regraEmail = REGRA_EMAIL;
  protected readonly rotaLogin = ROTA_LOGIN;

  readonly enviando = signal(false);
  readonly mensagemGeral = signal<string | null>(null);
  readonly confirmacaoSenhaErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: (controle) =>
      !!controle &&
      controle.touched &&
      (controle.invalid || controle.parent?.hasError('senhasDiferentes') === true),
  };
  protected readonly nivelMensagem = signal<NivelFeedback>('erro');
  protected readonly codigoMensagem = signal<string | null>(null);

  readonly formulario = inject(FormBuilder).nonNullable.group(
    {
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      cpf: ['', [Validators.required, cpfValidator]],
      senha: ['', [Validators.required, senhaValidator]],
      confirmarSenha: ['', [Validators.required]],
    },
    { validators: senhasCoincidemValidator },
  );

  private readonly primeiroCampo = viewChild<ElementRef<HTMLInputElement>>('primeiroCampo');

  constructor() {
    afterNextRender(() => this.primeiroCampo()?.nativeElement.focus());
  }

  /** A máscara acompanha a digitação; o que não é dígito não entra no campo. */
  aoDigitarCpf(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const formatado = formatarCpf(campo.value);
    campo.value = formatado;
    this.formulario.controls.cpf.setValue(formatado);
  }

  enviar(): void {
    if (this.enviando()) {
      return;
    }
    this.mensagemGeral.set(null);
    this.codigoMensagem.set(null);
    // O que dá para validar antes do envio é validado antes (PRD-009).
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    const dados = this.formulario.getRawValue();

    // O backend valida 11 dígitos: a pontuação fica na tela, não no envio.
    this.acesso
      .cadastrar({
        nome: dados.nome,
        email: dados.email,
        cpf: digitosDoCpf(dados.cpf),
        senha: dados.senha,
      })
      .subscribe({
        next: (conta) => {
          this.enviando.set(false);
          // Cadastro não entra no sistema: o backend não devolve token (ADR-001).
          this.router.navigate([ROTA_LOGIN], {
            queryParams: { email: conta.email, contaCriada: '1' },
          });
        },
        error: (erro: ErroTraduzido) => {
          this.enviando.set(false);
          const mensagem = aplicarErroNoFormulario(erro, this.formulario);
          this.mensagemGeral.set(mensagem);
          if (mensagem) {
            this.nivelMensagem.set(erro.nivel);
            this.codigoMensagem.set(erro.exibirCodigo ? erro.codigo : null);
          }
        },
      });
  }
}
