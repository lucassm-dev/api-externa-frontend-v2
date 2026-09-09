import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatarDataHora, formatarMoeda, formatarNumero } from '../../../core/formatacao/formatacao';
import { Monograma } from '../../../shared/monograma/monograma';
import { Selo, VarianteSelo } from '../../../shared/selo/selo';
import { MOVIMENTACOES_NO_PAINEL, Movimentacao } from '../painel.model';

/**
 * Cinco linhas, nunca mais: cabem sem empurrar as carteiras para fora da
 * primeira dobra, e quem quer mais vai ao extrato (PRD-003). Campo que o
 * servidor não mandou some da linha em vez de virar traço sem explicação.
 */
@Component({
  selector: 'app-ultimas-movimentacoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Monograma, Selo],
  templateUrl: './ultimas-movimentacoes.html',
  styleUrl: './ultimas-movimentacoes.scss',
})
export class UltimasMovimentacoes {
  readonly movimentacoes = input.required<Movimentacao[]>();

  protected readonly limite = MOVIMENTACOES_NO_PAINEL;

  protected quando(movimentacao: Movimentacao): string {
    return formatarDataHora(movimentacao.dataHora);
  }

  protected varianteDoTipo(movimentacao: Movimentacao): VarianteSelo {
    if (movimentacao.tipo === 'COMPRA') {
      return 'alta';
    }
    if (movimentacao.tipo === 'VENDA') {
      return 'baixa';
    }
    return 'estavel';
  }

  protected quantidade(movimentacao: Movimentacao): string | null {
    return movimentacao.quantidade === undefined ? null : formatarNumero(movimentacao.quantidade, 0);
  }

  protected total(movimentacao: Movimentacao): string | null {
    if (movimentacao.valorTotal === undefined) {
      return null;
    }
    return formatarMoeda(movimentacao.valorTotal, movimentacao.moeda ?? 'BRL');
  }
}
