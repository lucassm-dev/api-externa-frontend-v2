import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CarteiraResumida } from '../painel.model';

/**
 * Um cartão por carteira. A ordem é a que o servidor devolveu — mais recente
 * primeiro, por identificador — e o cliente não reordena: o valor de mercado
 * muda com o preço e faria a carteira pular de lugar sozinha (PRD-003).
 */
@Component({
  selector: 'app-carteiras-do-investidor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './carteiras-do-investidor.html',
  styleUrl: './carteiras-do-investidor.scss',
})
export class CarteirasDoInvestidor {
  readonly carteiras = input.required<CarteiraResumida[]>();
}
