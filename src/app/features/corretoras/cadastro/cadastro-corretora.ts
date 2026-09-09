import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { REGRA_CNPJ, cnpjValidator, formatarCnpj } from '../cnpj';
import { Corretora, cidadeComUf, nomeExibido } from '../corretoras.model';
import { CorretorasService } from '../corretoras.service';

/**
 * Um campo só: o CNPJ. Razão social, endereço e validação vêm de fontes
 * públicas, e a consulta a elas é lenta — por isso a tela diz o que está
 * consultando em vez de apenas travar o botão (PRD-004, PRD-009).
 *
 * Aqui mora a distinção mais cara do produto: COR-003 é veredito sobre a
 * empresa, com o motivo específico vindo do servidor; EXT-007 é a fonte que
 * não respondeu. Quem separa os dois é o código do erro, nunca o texto (P-004).
 */
@Component({
  selector: 'app-cadastro-corretora',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MensagemFeedback,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './cadastro-corretora.html',
  styleUrl: './cadastro-corretora.scss',
})
export class CadastroCorretora {
  private readonly corretoras = inject(CorretorasService);
  private readonly router = inject(Router);
  /** Quem chegou aqui por falta de corretora volta para onde estava (AC-092). */
  private readonly voltarPara = inject(ActivatedRoute).snapshot.queryParamMap.get('voltarPara');

  protected readonly regraCnpj = REGRA_CNPJ;
  protected readonly formatarCnpj = formatarCnpj;
  protected readonly nomeExibido = nomeExibido;
  protected readonly cidadeComUf = cidadeComUf;

  readonly consultando = signal(false);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);
  readonly corretoraExistente = signal<Corretora | null>(null);

  readonly formulario = inject(FormBuilder).nonNullable.group({
    cnpj: ['', [Validators.required, cnpjValidator]],
  });

  enviar(): void {
    if (this.consultando()) {
      return;
    }
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
    this.corretoraExistente.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.consultando.set(true);
    const cnpj = this.formulario.getRawValue().cnpj;

    this.corretoras.cadastrar(cnpj).subscribe({
      next: (corretora) => {
        this.consultando.set(false);
        if (this.voltarPara) {
          this.router.navigateByUrl(this.voltarPara);
        } else {
          this.router.navigate(['/corretoras', corretora.id]);
        }
      },
      error: (erro: ErroTraduzido) => {
        this.consultando.set(false);
        this.tratarRecusa(erro, cnpj);
      },
    });
  }

  /**
   * O que o investidor vê sai da tradução da fundação: COR-003 já vem com o
   * motivo do servidor anexado, EXT-007 com a mensagem de indisponibilidade, e
   * nenhuma das duas empresta texto da outra. O CNPJ digitado nunca se perde.
   */
  private tratarRecusa(erro: ErroTraduzido, cnpj: string): void {
    const campo = this.formulario.controls.cnpj;
    const porCampo = Object.entries(erro.porCampo);

    if (porCampo.length > 0) {
      // VAL-001: a mensagem é de cada campo e nunca vira balão no topo (PRD-009).
      for (const [nome, mensagem] of porCampo) {
        this.formulario.get(nome)?.setErrors({ servidor: mensagem });
      }
      this.textoDoErro.set(null);
    } else {
      // O motivo do COR-003 é a informação principal desta tela: fica por
      // extenso, não escondido na linha de erro do campo. O campo apenas
      // destaca — é o que o PRD-009 pede para os dois (AC-071, AC-073).
      this.textoDoErro.set(erro.mensagem);
      if (erro.campoDestacado === 'cnpj') {
        campo.setErrors({ destacado: true });
        campo.markAsTouched();
      }
    }

    this.codigoDoErro.set(erro.codigo);

    if (erro.comportamento === 'oferecer-existente') {
      this.buscarExistente(cnpj);
    }
  }

  /** COR-002 não é beco sem saída: a corretora existe e o investidor pode abri-la. */
  private buscarExistente(cnpj: string): void {
    this.corretoras.porCnpj(cnpj).subscribe((corretora) => this.corretoraExistente.set(corretora));
  }
}
