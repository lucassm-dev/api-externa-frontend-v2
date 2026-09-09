import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-botao-icone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './botao-icone.html',
  styleUrl: './botao-icone.scss',
})
export class BotaoIcone {
  readonly rotulo = input.required<string>();
  readonly tipo = input<'button' | 'submit'>('button');
  readonly desabilitado = input(false);
  readonly pressionado = output<void>();
}
