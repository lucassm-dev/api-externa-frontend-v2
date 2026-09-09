import { HttpErrorResponse } from '@angular/common/http';
import { ErroPadrao, ehErroPadrao } from '../api/erro-padrao';
import { NivelFeedback } from '../feedback/feedback.model';
import {
  CATALOGO_ERROS,
  ComportamentoTela,
  MENSAGEM_GENERICA,
  MENSAGEM_SEM_RESPOSTA,
} from './catalogo-erros';

export type ContextoErro = Record<string, string | number>;

export interface ErroTraduzido {
  /** Código do servidor, ou null quando não houve resposta. */
  codigo: string | null;
  mensagem: string;
  nivel: NivelFeedback;
  comportamento: ComportamentoTela;
  /** Mensagens de VAL-001, uma por campo do formulário. */
  porCampo: Record<string, string>;
  campoDestacado: string | null;
  /** O código vai no rodapé da mensagem, discreto (PRD-009). */
  exibirCodigo: boolean;
  conhecido: boolean;
  encerraSessao: boolean;
  original: HttpErrorResponse | null;
}

function preencher(modelo: string, contexto: ContextoErro): string {
  return modelo.replace(/\{(\w+)\}/g, (marcador, chave: string) =>
    chave in contexto ? String(contexto[chave]) : marcador,
  );
}

const SEM_RESPOSTA: Omit<ErroTraduzido, 'original'> = {
  codigo: null,
  mensagem: MENSAGEM_SEM_RESPOSTA,
  nivel: 'erro',
  comportamento: 'permanecer-no-formulario',
  porCampo: {},
  campoDestacado: null,
  exibirCodigo: false,
  conhecido: true,
  encerraSessao: false,
};

/**
 * Traduz a resposta do backend na mensagem que o investidor lê. Quem decide o
 * texto e o comportamento é o `codigo` — o texto do servidor nunca é
 * consultado para decidir nada (ADR-009).
 */
export function traduzirErro(
  erro: HttpErrorResponse,
  contexto: ContextoErro = {},
): ErroTraduzido {
  const corpo: unknown = erro.error;

  if (erro.status === 0 || !ehErroPadrao(corpo)) {
    return erro.status === 0
      ? { ...SEM_RESPOSTA, original: erro }
      : {
          ...SEM_RESPOSTA,
          mensagem: MENSAGEM_GENERICA,
          conhecido: false,
          original: erro,
        };
  }

  const padrao: ErroPadrao = corpo;
  const entrada = CATALOGO_ERROS[padrao.codigo];

  if (!entrada) {
    return {
      codigo: padrao.codigo,
      mensagem: MENSAGEM_GENERICA,
      nivel: 'erro',
      comportamento: 'permanecer-no-formulario',
      porCampo: {},
      campoDestacado: null,
      exibirCodigo: true,
      conhecido: false,
      encerraSessao: false,
      original: erro,
    };
  }

  const porCampo: Record<string, string> = {};
  for (const campo of padrao.fieldErrors ?? []) {
    porCampo[campo.field] = campo.message;
  }

  const mensagem = entrada.incluiMotivoDoServidor
    ? `${preencher(entrada.mensagem, contexto)} ${padrao.message}`.trim()
    : preencher(entrada.mensagem, contexto);

  return {
    codigo: padrao.codigo,
    mensagem,
    nivel: entrada.nivel ?? 'erro',
    comportamento: entrada.comportamento,
    porCampo,
    campoDestacado: entrada.campoDestacado ?? null,
    exibirCodigo: true,
    conhecido: true,
    encerraSessao: entrada.encerraSessao ?? false,
    original: erro,
  };
}
