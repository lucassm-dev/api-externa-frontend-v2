/**
 * Backend de mentira para os testes de tela: o papel do HttpTestingController.
 * Cada chamada fica registrada; a resposta sai na hora ou quando o teste mandar.
 */
export interface Chamada {
  metodo: string;
  url: string;
  corpo: unknown;
  cabecalhos: Headers;
}

type Responder = (chamada: Chamada) => Response | Promise<Response>;

export function json(corpo: unknown, status = 200): Response {
  // 204 e 205 não admitem corpo nenhum, nem vazio.
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Corpo do ErroPadrao (ADR-009) com o texto cru que a tela nunca deve mostrar. */
export function erroPadrao(codigo: string, status: number, extra: Record<string, unknown> = {}): Response {
  return json(
    { timestamp: '2026-09-08T12:00:00Z', status, codigo, error: 'erro', message: 'mensagem crua do servidor', path: '/', ...extra },
    status,
  );
}

export function simularServidor(responder: Responder) {
  const chamadas: Chamada[] = [];
  const pendentes: Array<(resposta: Response) => void> = [];

  const fetchFalso = vi.fn(async (url: string, inicio: RequestInit = {}) => {
    const chamada: Chamada = {
      metodo: inicio.method ?? 'GET',
      url: String(url),
      corpo: typeof inicio.body === 'string' ? JSON.parse(inicio.body) : undefined,
      cabecalhos: new Headers(inicio.headers),
    };
    chamadas.push(chamada);
    return responder(chamada);
  });
  vi.stubGlobal('fetch', fetchFalso);

  return {
    chamadas,
    /** Para usar como responder: segura a resposta até `liberar`. */
    segurar: () => new Promise<Response>((resolver) => pendentes.push(resolver)),
    liberar: (resposta: Response) => pendentes.shift()?.(resposta),
    para: (trecho: string) => chamadas.filter((chamada) => chamada.url.includes(trecho)),
  };
}

/** Espera o elemento aparecer e o devolve (o `waitFor` só espera quando a função falha). */
export async function esperarElemento(buscar: () => Element | null): Promise<Element> {
  const { waitFor } = await import('@testing-library/react');
  return waitFor(() => {
    const elemento = buscar();
    if (!elemento) throw new Error('elemento ainda não apareceu');
    return elemento;
  });
}
