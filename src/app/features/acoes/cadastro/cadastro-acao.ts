import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Botao } from '../../../shared/botao/botao';
import { ErroTraduzido } from '../../../core/erros/tradutor-erro';
import { MensagemFeedback } from '../../../core/feedback/mensagem-feedback';
import { MERCADOS, Mercado } from '../../carteiras/carteiras.model';
import { Acao } from '../acoes.model';
import { AcoesService } from '../acoes.service';

/**
 * Dois campos: ticker e mercado. O resto — nome da empresa, moeda, cotação e o
 * horário dela — vem da fonte do mercado escolhido.
 *
 * O pré-requisito que mais confunde no produto está aqui: cadastrar ação exige
 * ter carteira (ADR-003). A tela pergunta isso ao servidor ANTES de renderizar
 * campo algum — ninguém deve preencher um formulário para descobrir que não
 * podia. ACA-004 continua tratado, mas como rede de segurança.
 *
 * Não saber se o investidor tem carteira não é o mesmo que ele não ter: com a
 * consulta falha, o formulário abre e quem decide é o servidor no envio.
 */
@Component({
  selector: 'app-cadastro-acao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MensagemFeedback,
    MatFormFieldModule,
    MatInputModule,
    Botao,
  ],
  templateUrl: './cadastro-acao.html',
  styleUrl: './cadastro-acao.scss',
})
export class CadastroAcao {
  private readonly acoes = inject(AcoesService);
  private readonly router = inject(Router);
  /** A lista oferece cadastrar o ticker que a busca não achou — ele já vem preenchido. */
  private readonly tickerBuscado = inject(ActivatedRoute).snapshot.queryParamMap.get('ticker');

  protected readonly mercados = MERCADOS;

  readonly verificandoCarteira = signal(true);
  readonly temCarteira = signal<boolean | null>(null);
  readonly consultando = signal(false);
  readonly textoDoErro = signal<string | null>(null);
  readonly codigoDoErro = signal<string | null>(null);
  readonly acaoExistente = signal<Acao | null>(null);
  readonly faltaCarteira = signal(false);

  readonly formulario = inject(FormBuilder).nonNullable.group({
    ticker: [this.tickerBuscado ?? '', [Validators.required]],
    mercado: ['BR' as Mercado, [Validators.required]],
  });

  constructor() {
    this.acoes.investidorTemCarteira().subscribe((tem) => {
      this.temCarteira.set(tem);
      this.verificandoCarteira.set(false);
    });
  }

  /** O bloqueio é do estado conhecido: `null` (consulta falhou) não bloqueia. */
  protected bloqueado(): boolean {
    return this.temCarteira() === false;
  }

  enviar(): void {
    if (this.consultando() || this.bloqueado()) {
      return;
    }
    this.textoDoErro.set(null);
    this.codigoDoErro.set(null);
    this.acaoExistente.set(null);
    this.faltaCarteira.set(false);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.consultando.set(true);
    const { ticker, mercado } = this.formulario.getRawValue();

    this.acoes.cadastrar({ ticker, mercado }).subscribe({
      next: (acao) => {
        this.consultando.set(false);
        this.router.navigate(['/acoes', acao.ticker]);
      },
      error: (erro: ErroTraduzido) => {
        this.consultando.set(false);
        this.tratarRecusa(erro, ticker);
      },
    });
  }

  /**
   * O comportamento sai do código do erro, nunca do texto (P-004). EXT-008
   * destaca o ticker e não perde o que foi digitado; ACA-002 vai buscar a ação
   * existente; ACA-004 repete o atalho do pré-requisito.
   */
  private tratarRecusa(erro: ErroTraduzido, ticker: string): void {
    const porCampo = Object.entries(erro.porCampo);

    if (porCampo.length > 0) {
      for (const [nome, mensagem] of porCampo) {
        this.formulario.get(nome)?.setErrors({ servidor: mensagem });
      }
      this.textoDoErro.set(null);
    } else {
      this.textoDoErro.set(erro.mensagem);
      const campo = erro.campoDestacado ? this.formulario.get(erro.campoDestacado) : null;
      if (campo) {
        campo.setErrors({ destacado: true });
        campo.markAsTouched();
      }
    }

    this.codigoDoErro.set(erro.codigo);

    if (erro.comportamento === 'oferecer-existente') {
      this.acoes.porTicker(ticker).subscribe((acao) => this.acaoExistente.set(acao));
    }
    if (erro.comportamento === 'oferecer-pre-requisito') {
      this.faltaCarteira.set(true);
    }
  }
}
