import { http } from '../api/http';
import { definirNavegacao } from '../navegacao';
import { ROTA_LOGIN } from '../sessao/sessao.model';
import { sessao } from '../sessao/sessao.service';
import { ErroTraduzido } from './tradutor-erro';

describe('Erro que encerra a sessão', () => {
  const navegou = vi.fn();

  beforeEach(() => {
    navegou.mockReset();
    definirNavegacao(navegou);
    sessao.iniciar(
      { token: 'token', tipo: 'Bearer', expiraEm: new Date(Date.now() + 3_600_000).toISOString() },
      'lucas@exemplo.com',
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    sessao.encerrar();
  });

  async function dispararErro(codigo: string, status: number): Promise<ErroTraduzido> {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            timestamp: '2026-09-08T12:00:00Z',
            status,
            codigo,
            error: 'Unauthorized',
            message: 'token',
            path: '/carteiras',
          }),
          { status, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    return http.get('/carteiras').then(
      () => {
        throw new Error('a requisição deveria ter falhado');
      },
      (erro: ErroTraduzido) => erro,
    );
  }

  it('@spec:AC-005 AUT-006 encerra a sessão e leva ao login com a mensagem de expiração', async () => {
    const traduzido = await dispararErro('AUT-006', 401);

    expect(sessao.ativa()).toBe(false);
    expect(traduzido.mensagem).toBe('Sua sessão expirou. Entre novamente.');
    expect(navegou).toHaveBeenCalled();
    expect(String(navegou.mock.calls[0][0])).toContain(ROTA_LOGIN);
  });

  it('@spec:AC-005 AUT-005 também encerra a sessão, com a mensagem do próprio código', async () => {
    const traduzido = await dispararErro('AUT-005', 401);

    expect(sessao.ativa()).toBe(false);
    expect(traduzido.mensagem).toBe('Sua sessão não é mais válida. Entre novamente.');
  });

  it('@spec:AC-005 erro de outro código não derruba a sessão', async () => {
    const traduzido = await dispararErro('CAR-001', 404);

    expect(sessao.ativa()).toBe(true);
    expect(traduzido.encerraSessao).toBe(false);
    expect(navegou).not.toHaveBeenCalled();
  });
});
