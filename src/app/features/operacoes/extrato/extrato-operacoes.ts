import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
} from '../../../core/formatacao/formatacao';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { Carteira } from '../../carteiras/carteiras.model';
import { OperacaoDoExtrato } from '../operacoes.model';

export const AVISO_DE_RECALCULO =
  'Excluir esta operação vai recalcular a posição e o resultado da carteira. Não há como desfazer.';

/**
 * Data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total
 * e moeda, do mais recente para o mais antigo, paginado (PRD-007).
 *
 * **Sem filtros.** O backend não aceita filtro por carteira, ticker, tipo nem
 * período, e filtrar só a página carregada mentiria: o investidor filtraria por
 * um ticker, não acharia a operação que sabe existir, e concluiria que o
 * sistema perdeu o lançamento (ADR-010). Nenhum controle de filtro existe aqui.
 */
@Component({
  selector: 'app-extrato-operacoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, DialogoConfirmacao],
  templateUrl: './extrato-operacoes.html',
  styleUrl: './extrato-operacoes.scss',
})
export class ExtratoOperacoes {
  readonly operacoes = input.required<OperacaoDoExtrato[]>();
  readonly carteiras = input<Carteira[]>([]);
  readonly pagina = input(0);
  readonly totalDePaginas = input(0);
  readonly carregando = input(false);
  readonly excluindo = input(false);

  readonly mudarPagina = output<number>();
  readonly editar = output<OperacaoDoExtrato>();
  readonly excluir = output<OperacaoDoExtrato>();

  protected readonly avisoDeRecalculo = AVISO_DE_RECALCULO;

  readonly emExclusao = signal<OperacaoDoExtrato | null>(null);

  protected readonly temAnterior = computed(() => this.pagina() > 0);
  protected readonly temProxima = computed(() => this.pagina() + 1 < this.totalDePaginas());

  protected quando(operacao: OperacaoDoExtrato): string {
    return formatarDataHora(operacao.dataHora);
  }

  protected quantidade(operacao: OperacaoDoExtrato): string {
    return formatarNumero(operacao.quantidade, 0);
  }

  protected preco(operacao: OperacaoDoExtrato): string {
    return formatarMoeda(operacao.precoUnitario, operacao.moeda);
  }

  protected total(operacao: OperacaoDoExtrato): string {
    return formatarMoeda(operacao.valorTotal, operacao.moeda);
  }

  /** Carteira fora da listagem carregada aparece pelo identificador, nunca em branco. */
  protected carteira(operacao: OperacaoDoExtrato): string {
    const achada = this.carteiras().find((carteira) => carteira.id === operacao.carteiraId);
    return achada ? achada.nome : `Carteira ${operacao.carteiraId}`;
  }

  /** Ausente é ausente (ASM-038): a linha some com o campo, sem traço nem zero. */
  protected resultado(operacao: OperacaoDoExtrato): string | null {
    if (operacao.tipo !== 'VENDA' || operacao.lucroRealizado === undefined) {
      return null;
    }
    return formatarMoeda(operacao.lucroRealizado, operacao.moeda);
  }

  pedirExclusao(operacao: OperacaoDoExtrato): void {
    this.emExclusao.set(operacao);
  }

  cancelarExclusao(): void {
    this.emExclusao.set(null);
  }

  confirmarExclusao(): void {
    const operacao = this.emExclusao();
    if (operacao) {
      this.excluir.emit(operacao);
    }
  }

  fecharExclusao(): void {
    this.emExclusao.set(null);
  }

  irPara(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalDePaginas()) {
      this.mudarPagina.emit(pagina);
    }
  }
}
