import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';

/**
 * Botão que revela e oculta o conteúdo de um campo de senha.
 *
 * O estado mora no formulário que hospeda o campo, não aqui: é ele que liga o
 * `type` do `input` ao sinal. Assim dois campos na mesma tela — senha e
 * confirmação — têm cada um o seu estado, e revelar um não revela o outro
 * (AC-297).
 */
@Component({
  selector: 'app-visibilidade-senha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideEye, LucideEyeOff],
  templateUrl: './visibilidade-senha.html',
  styleUrl: './visibilidade-senha.scss',
})
export class VisibilidadeSenha {
  /** Duplo sentido: o formulário lê para montar o `type` e o botão escreve. */
  readonly visivel = model(false);

  /**
   * Como o campo se chama na frase do rótulo. Com dois campos na tela, "Mostrar
   * senha" nos dois deixaria o leitor de tela sem saber qual é qual.
   */
  readonly campo = input('senha');

  protected readonly rotulo = computed(
    () => `${this.visivel() ? 'Ocultar' : 'Mostrar'} ${this.campo()}`,
  );

  protected alternar(): void {
    this.visivel.update((atual) => !atual);
  }
}
