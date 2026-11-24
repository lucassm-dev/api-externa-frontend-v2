import { traduzirErro } from '../erros/tradutor-erro';
import { irPara } from '../navegacao';
import { ROTA_LOGIN } from '../sessao/sessao.model';
import { sessao } from '../sessao/sessao.service';

export type Parametros = Record<string, string | number | boolean>;

export interface Opcoes {
  params?: Parametros;
  corpo?: unknown;
  /** Cancela a leitura quando a tela sai ou a escolha muda. */
  sinal?: AbortSignal;
}

function endereco(url: string, params?: Parametros): string {
  if (!params) return url;
  const busca = new URLSearchParams(Object.entries(params).map(([chave, valor]) => [chave, String(valor)]));
  return `${url}?${busca}`;
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  const texto = await resposta.text();
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

/**
 * Os dois interceptadores do Angular num lugar só, na mesma ordem: o token
 * entra antes de o erro ser traduzido. Toda falha sai como ErroTraduzido, e
 * AUT-005/AUT-006 encerram a sessão e levam ao login (AC-005, AC-017, AC-018).
 * Cancelamento (AbortError) passa adiante sem tradução: não é erro do produto.
 */
export async function requisitar<T>(metodo: string, url: string, opcoes: Opcoes = {}): Promise<T> {
  const cabecalhos = new Headers();
  const token = sessao.token();
  if (token) cabecalhos.set('Authorization', `Bearer ${token}`);
  // Como o HttpClient: corpo null (o PUT de atualizar cotação) não vira "null" no fio.
  const temCorpo = opcoes.corpo !== undefined && opcoes.corpo !== null;
  if (temCorpo) cabecalhos.set('Content-Type', 'application/json');

  let resposta: Response;
  try {
    resposta = await fetch(endereco(url, opcoes.params), {
      method: metodo,
      headers: cabecalhos,
      body: temCorpo ? JSON.stringify(opcoes.corpo) : undefined,
      signal: opcoes.sinal,
    });
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro;
    throw traduzirErro({ status: 0, error: erro, url });
  }

  const corpo = await lerCorpo(resposta);
  if (resposta.ok) return corpo as T;

  const traduzido = traduzirErro({ status: resposta.status, error: corpo, url });
  if (traduzido.encerraSessao) {
    sessao.encerrar();
    irPara(`${ROTA_LOGIN}?motivo=${traduzido.codigo}`);
  }
  throw traduzido;
}

export const http = {
  get: <T>(url: string, opcoes?: Omit<Opcoes, 'corpo'>) => requisitar<T>('GET', url, opcoes),
  post: <T>(url: string, corpo?: unknown, opcoes?: Omit<Opcoes, 'corpo'>) =>
    requisitar<T>('POST', url, { ...opcoes, corpo }),
  patch: <T>(url: string, corpo?: unknown, opcoes?: Omit<Opcoes, 'corpo'>) =>
    requisitar<T>('PATCH', url, { ...opcoes, corpo }),
  put: <T>(url: string, corpo?: unknown, opcoes?: Omit<Opcoes, 'corpo'>) =>
    requisitar<T>('PUT', url, { ...opcoes, corpo }),
  delete: <T>(url: string, opcoes?: Omit<Opcoes, 'corpo'>) => requisitar<T>('DELETE', url, opcoes),
};
