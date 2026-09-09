import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import {
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
} from '../../../core/formatacao/formatacao';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { Monograma } from '../../../shared/monograma/monograma';
import { Selo, VarianteSelo } from '../../../shared/selo/selo';
import { ExtratoBuscado, MovimentacaoDoExtrato } from '../carteiras.model';
import { recortarPorCarteira } from '../movimentacoes-da-carteira';

export const AVISO_DE_RECALCULO_NA_CARTEIRA =
  'Excluir esta operação vai recalcular a posição e o resultado da carteira. Não há como desfazer.';

/**
 * O extrato é global e não aceita filtro por carteira (ADR-010): o recorte é
 * feito aqui. Quando o servidor tem mais operações do que foram buscadas, a
 * tela declara isso — apresentar recorte parcial como completo faz o
 * investidor procurar em vão um lançamento que existe.
 *
 * Corrigir e excluir moram aqui além do extrato global porque é nesta tela que
 * o recálculo fica visível: mexer numa operação refaz preço médio, posição e
 * resultado da carteira inteira (Q-020).
 */
@Component({
  selector: 'app-movimentacoes-carteira',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, DialogoConfirmacao, Esqueleto, Monograma, Selo],
  templateUrl: './movimentacoes-carteira.html',
  styleUrl: './movimentacoes-carteira.scss',
})
export class MovimentacoesCarteira {
  readonly extrato = input.required<ExtratoBuscado>();
  readonly carteiraId = input.required<number>();
  readonly excluindo = input(false);
  readonly carregando = input(false);

  readonly editar = output<MovimentacaoDoExtrato>();
  readonly excluir = output<MovimentacaoDoExtrato>();

  protected readonly avisoDeRecalculo = AVISO_DE_RECALCULO_NA_CARTEIRA;

  readonly emExclusao = signal<MovimentacaoDoExtrato | null>(null);

  protected readonly recorte = computed(() =>
    recortarPorCarteira(this.extrato(), this.carteiraId()),
  );

  pedirExclusao(movimentacao: MovimentacaoDoExtrato): void {
    this.emExclusao.set(movimentacao);
  }

  cancelarExclusao(): void {
    this.emExclusao.set(null);
  }

  confirmarExclusao(): void {
    const movimentacao = this.emExclusao();
    if (movimentacao) {
      this.emExclusao.set(null);
      this.excluir.emit(movimentacao);
    }
  }

  protected quando(movimentacao: MovimentacaoDoExtrato): string {
    return formatarDataHora(movimentacao.dataHora);
  }

  protected varianteDoTipo(movimentacao: MovimentacaoDoExtrato): VarianteSelo {
    if (movimentacao.tipo === 'COMPRA') return 'alta';
    if (movimentacao.tipo === 'VENDA') return 'baixa';
    return 'estavel';
  }

  protected quantidade(movimentacao: MovimentacaoDoExtrato): string | null {
    return movimentacao.quantidade === undefined
      ? null
      : formatarNumero(movimentacao.quantidade, 0);
  }

  protected total(movimentacao: MovimentacaoDoExtrato): string | null {
    return movimentacao.valorTotal === undefined
      ? null
      : formatarMoeda(movimentacao.valorTotal, movimentacao.moeda ?? 'BRL');
  }
}
