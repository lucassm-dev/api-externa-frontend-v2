import { ErroTraduzido } from './tradutor-erro';

export interface ErroNoFormulario {
  /** Mensagem do servidor por campo, só dos campos que o formulário tem. */
  porCampo: Record<string, string>;
  /** Texto a exibir fora dos campos, ou null quando tudo coube neles. */
  geral: string | null;
}

/**
 * Distribui o erro do servidor pelo formulário, sem nunca limpar o que foi
 * digitado. VAL-001 vai campo a campo; um código que aponta um campo destaca
 * aquele campo; o resto vira mensagem geral. Mesma regra do Angular, agora
 * devolvendo o resultado em vez de escrever num FormGroup.
 */
export function aplicarErroNoFormulario(erro: ErroTraduzido, campos: readonly string[]): ErroNoFormulario {
  const camposComErro = Object.entries(erro.porCampo);

  if (camposComErro.length > 0) {
    const porCampo: Record<string, string> = {};
    for (const [campo, mensagem] of camposComErro) {
      if (campos.includes(campo)) porCampo[campo] = mensagem;
    }
    return { porCampo, geral: null };
  }

  if (erro.campoDestacado && campos.includes(erro.campoDestacado)) {
    return { porCampo: { [erro.campoDestacado]: erro.mensagem }, geral: null };
  }

  return { porCampo: {}, geral: erro.mensagem };
}
