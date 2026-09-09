import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { formatarDataHora } from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { AlteracaoDeOperacao, OperacaoEditavel } from '../operacoes.model';
import { precoManualTemCasasDemais } from '../preco-da-operacao';

export const AVISO_DE_RECALCULO_NA_EDICAO =
  'Editar esta operação vai recalcular a posição e o resultado da carteira.';

/**
 * Só quantidade e preço unitário são editáveis — nem ação, nem carteira, nem
 * tipo, nem data (PRD-007). E a edição não é correção de uma linha isolada: ela
 * recalcula preço médio, posição e resultado da carteira inteira, e a tela avisa
 * disso antes de confirmar.
 *
 * Sem preço novo o backend reutiliza a última cotação conhecida da ação, sem
 * buscar preço novo. O investidor precisa saber disso antes de salvar.
 */
@Component({
  selector: 'app-editar-operacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, DialogoConfirmacao],
  templateUrl: './editar-operacao.html',
  styleUrl: './editar-operacao.scss',
})
export class EditarOperacao {
  readonly operacao = input.required<OperacaoEditavel>();
  readonly salvando = input(false);

  readonly salvar = output<AlteracaoDeOperacao>();
  readonly cancelar = output<void>();

  protected readonly avisoDeRecalculo = AVISO_DE_RECALCULO_NA_EDICAO;

  readonly quantidade = signal<number | null>(null);
  readonly precoManualAtivo = signal(false);
  readonly precoUnitario = signal<number | null>(null);
  readonly confirmando = signal(false);

  protected readonly quando = computed(() => formatarDataHora(this.operacao().dataHora));

  protected readonly precoComCasasDemais = computed(
    () => this.precoManualAtivo() && precoManualTemCasasDemais(this.precoUnitario()),
  );

  protected readonly podeSalvar = computed(
    () =>
      (this.quantidade() ?? 0) > 0 &&
      !this.precoComCasasDemais() &&
      !(this.precoManualAtivo() && !this.precoUnitario()),
  );

  constructor() {
    queueMicrotask(() => this.quantidade.set(this.operacao().quantidade ?? null));
  }

  alternarPrecoManual(ativo: boolean): void {
    this.precoManualAtivo.set(ativo);
    if (!ativo) {
      this.precoUnitario.set(null);
    }
  }

  pedirConfirmacao(): void {
    if (this.podeSalvar()) {
      this.confirmando.set(true);
    }
  }

  cancelarConfirmacao(): void {
    this.confirmando.set(false);
  }

  confirmar(): void {
    if (!this.podeSalvar()) {
      return;
    }
    const alteracao: AlteracaoDeOperacao = { quantidade: this.quantidade()! };
    if (this.precoManualAtivo() && this.precoUnitario()) {
      alteracao.precoUnitario = this.precoUnitario()!;
    }
    this.salvar.emit(alteracao);
  }

  fechar(): void {
    this.confirmando.set(false);
    this.cancelar.emit();
  }
}
