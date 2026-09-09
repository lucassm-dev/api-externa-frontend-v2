import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ROTA_LOGIN } from '../sessao/sessao.model';
import { SessaoService } from '../sessao/sessao.service';
import { ErroTraduzido } from './tradutor-erro';
import { erroInterceptor } from './erro.interceptor';

describe('Erro que encerra a sessão', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let sessao: SessaoService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'entrar', children: [] }]),
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoService);
    router = TestBed.inject(Router);
    sessao.iniciar({
      token: 'token',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 3_600_000).toISOString()
    }, 'lucas@exemplo.com');
  });

  function dispararErro(codigo: string, status: number): Promise<ErroTraduzido> {
    const promessa = new Promise<ErroTraduzido>((resolve) => {
      http.get('/carteiras').subscribe({ error: resolve });
    });
    controle.expectOne('/carteiras').flush(
      {
        timestamp: '2026-09-08T12:00:00Z',
        status,
        codigo,
        error: 'Unauthorized',
        message: 'token',
        path: '/carteiras',
      },
      { status, statusText: 'Unauthorized' },
    );
    return promessa;
  }

  it('@spec:AC-005 AUT-006 encerra a sessão e leva ao login com a mensagem de expiração', async () => {
    const navegou = vi.spyOn(router, 'navigateByUrl');

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
  });
});
