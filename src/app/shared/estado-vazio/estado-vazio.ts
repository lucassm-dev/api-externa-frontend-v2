import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideArrowRight, LucideInbox } from '@lucide/angular';
import { Botao } from '../botao/botao';

let proximoEstadoVazio = 0;

@Component({
  selector: 'app-estado-vazio',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideArrowRight, LucideInbox, Botao],
  templateUrl: './estado-vazio.html',
  styleUrl: './estado-vazio.scss',
})
export class EstadoVazio {
  readonly titulo = input.required<string>();
  readonly descricao = input.required<string>();
  readonly rotuloAcao = input.required<string>();
  readonly acao = output<void>();
  protected readonly tituloId = `estado-vazio-titulo-${++proximoEstadoVazio}`;
}
