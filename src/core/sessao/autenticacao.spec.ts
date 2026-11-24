import { http } from '../api/http';
import { sessao } from './sessao.service';

describe('Envio do token', () => {
  let enviada: Request | null;

  beforeEach(() => {
    enviada = null;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, inicio: RequestInit) => {
        enviada = new Request(new URL(url, 'http://localhost'), inicio);
        return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessao.encerrar();
  });

  it('@spec:AC-017 com sessão, a requisição leva Authorization: Bearer <token>', async () => {
    sessao.iniciar(
      { token: 'abc123', tipo: 'Bearer', expiraEm: new Date(Date.now() + 3_600_000).toISOString() },
      'lucas@exemplo.com',
    );

    await http.get('/carteiras');

    expect(enviada?.url).toContain('/carteiras');
    expect(enviada?.headers.get('Authorization')).toBe('Bearer abc123');
  });

  it('@spec:AC-018 sem sessão, nenhum cabeçalho Authorization é adicionado', async () => {
    await http.post('/auth/login', {});

    expect(enviada?.url).toContain('/auth/login');
    expect(enviada?.headers.has('Authorization')).toBe(false);
  });
});
