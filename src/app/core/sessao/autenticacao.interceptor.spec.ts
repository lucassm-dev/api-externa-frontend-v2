import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { autenticacaoInterceptor } from './autenticacao.interceptor';
import { SessaoService } from './sessao.service';

describe('Envio do token', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let sessao: SessaoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([autenticacaoInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoService);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-017 com sessão, a requisição leva Authorization: Bearer <token>', () => {
    sessao.iniciar({
      token: 'abc123',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 3_600_000).toISOString()
    }, 'lucas@exemplo.com');

    http.get('/carteiras').subscribe();

    const requisicao = controle.expectOne('/carteiras');
    expect(requisicao.request.headers.get('Authorization')).toBe('Bearer abc123');
    requisicao.flush({});
  });

  it('@spec:AC-018 sem sessão, nenhum cabeçalho Authorization é adicionado', () => {
    http.post('/auth/login', {}).subscribe();

    const requisicao = controle.expectOne('/auth/login');
    expect(requisicao.request.headers.has('Authorization')).toBe(false);
    requisicao.flush({});
  });
});
