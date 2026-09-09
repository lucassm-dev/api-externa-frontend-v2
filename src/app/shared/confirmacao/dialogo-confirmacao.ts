import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * A confirmação simples do PRD-009: título, consequência em texto e dois
 * botões. Nada de digitar o nome do que será removido — o atrito extra não se
 * justifica num produto sem dinheiro real, e o vínculo ativo já protege o resto.
 */
@Component({
  selector: 'app-dialogo-confirmacao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule],
  templateUrl: './dialogo-confirmacao.html',
  styleUrl: './dialogo-confirmacao.scss',
})
export class DialogoConfirmacao {
  readonly titulo = input.required<string>();
  readonly consequencia = input.required<string>();
  readonly rotuloConfirmar = input('Confirmar');
  readonly rotuloCancelar = input('Cancelar');
  readonly ocupado = input(false);

  readonly confirmar = output<void>();
  readonly cancelar = output<void>();
}
