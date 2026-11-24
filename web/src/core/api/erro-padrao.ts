/** Erro por campo, presente apenas em VAL-001. */
export interface ErroDeCampo {
  field: string;
  message: string;
}

/**
 * Contrato único de erro do backend (ADR-009).
 * `fieldErrors` é omitido quando vazio — por isso é opcional.
 */
export interface ErroPadrao {
  timestamp: string;
  status: number;
  codigo: string;
  error: string;
  message: string;
  path: string;
  fieldErrors?: ErroDeCampo[];
}

export function ehErroPadrao(corpo: unknown): corpo is ErroPadrao {
  return (
    typeof corpo === 'object' &&
    corpo !== null &&
    typeof (corpo as ErroPadrao).codigo === 'string' &&
    typeof (corpo as ErroPadrao).status === 'number'
  );
}

/** Resposta de operação que deu certo trazendo ressalvas (ADR-006). */
export interface ComAvisos<T> {
  dados: T;
  avisos: string[];
}
