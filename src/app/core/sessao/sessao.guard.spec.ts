import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { sessaoGuard } from './sessao.guard';
import { ROTA_LOGIN } from './sessao.model';
import { SessaoService } from './sessao.service';

function executarGuarda(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    sessaoGuard({} as ActivatedRouteSnapshot, { url: '/painel' } as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('Guarda das telas internas', () => {
  let sessao: SessaoService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    sessao = TestBed.inject(SessaoService);
    router = TestBed.inject(Router);
  });

  it('@spec:AC-015 sem sessão, o acesso é negado e o destino vira o login', () => {
    const resultado = executarGuarda();

    expect(resultado).not.toBe(true);
    expect(resultado instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(resultado as UrlTree)).toContain(ROTA_LOGIN);
  });

  it('@spec:AC-015 sessão com prazo vencido também é barrada', () => {
    sessao.iniciar({
      token: 'vencido',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() - 1_000).toISOString()
    }, 'lucas@exemplo.com');

    expect(executarGuarda()).not.toBe(true);
  });

  it('@spec:AC-016 com sessão válida, o acesso é liberado sem redirecionamento', () => {
    sessao.iniciar({
      token: 'valido',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 3_600_000).toISOString()
    }, 'lucas@exemplo.com');

    expect(executarGuarda()).toBe(true);
  });
});
