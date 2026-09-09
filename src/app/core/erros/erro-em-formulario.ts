import { FormGroup } from '@angular/forms';
import { ErroTraduzido } from './tradutor-erro';

/**
 * Distribui o erro do servidor pelo formulário, sem nunca limpar o que foi
 * digitado. VAL-001 vai campo a campo; um código que aponta um campo destaca
 * aquele campo; o resto vira mensagem geral.
 *
 * Devolve o texto a exibir fora dos campos, ou null quando tudo coube neles.
 */
export function aplicarErroNoFormulario(
  erro: ErroTraduzido,
  formulario: FormGroup,
): string | null {
  const camposComErro = Object.entries(erro.porCampo);

  if (camposComErro.length > 0) {
    for (const [campo, mensagem] of camposComErro) {
      formulario.get(campo)?.setErrors({ servidor: mensagem });
    }
    return null;
  }

  const campo = erro.campoDestacado ? formulario.get(erro.campoDestacado) : null;
  if (campo) {
    campo.setErrors({ servidor: erro.mensagem });
    return null;
  }

  return erro.mensagem;
}
