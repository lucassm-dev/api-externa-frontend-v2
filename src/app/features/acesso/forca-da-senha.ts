import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { senhaValidator } from './validadores';

interface RequisitoDaSenha {
  id: string;
  rotulo: string;
  atendido: boolean;
}

@Component({
  selector: 'app-forca-da-senha',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forca-da-senha.html',
  styleUrl: './forca-da-senha.scss',
})
export class ForcaDaSenha {
  readonly senha = input('');

  protected readonly requisitos = computed<RequisitoDaSenha[]>(() => {
    const valor = this.senha();
    return [
      { id: 'tamanho', rotulo: '8 ou mais caracteres', atendido: valor.length >= 8 },
      { id: 'letra', rotulo: 'Ao menos uma letra', atendido: /[A-Za-z]/.test(valor) },
      { id: 'numero', rotulo: 'Ao menos um número', atendido: /\d/.test(valor) },
    ];
  });

  protected readonly progresso = computed(
    () => (this.requisitos().filter((requisito) => requisito.atendido).length / 3) * 100,
  );

  /** A decisão final vem do mesmo validador usado pelo formulário. */
  readonly aceitavel = computed(() => senhaValidator(new FormControl(this.senha())) === null);
}
