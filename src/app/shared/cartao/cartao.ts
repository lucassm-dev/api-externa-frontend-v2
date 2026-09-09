import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let proximoCartao = 0;

@Component({
  selector: 'app-cartao',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cartao.html',
  styleUrl: './cartao.scss',
})
export class Cartao {
  readonly titulo = input.required<string>();
  readonly apoio = input<string | null>(null);
  protected readonly tituloId = `cartao-titulo-${++proximoCartao}`;
}
