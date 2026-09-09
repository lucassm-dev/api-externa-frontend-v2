import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rotas das operações', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let controle: HttpTestingController;

  async function montarComSessao() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(SessaoService).iniciar(
      { token: 'jwt', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() },
      'lucas@exemplo.com',
    );
    router = TestBed.inject(Router);
    controle = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  }

  function responderTudo() {
    controle
      .match(() => true)
      .forEach((r) => {
        if (r.request.url.endsWith('/posicoes')) {
          r.flush([]);
          return;
        }
        r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
      });
  }

  it('@spec:AC-150 /operacoes abre a tela real, com o seletor de tipo à vista', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/operacoes');
    expect(router.url).toBe('/operacoes');
    responderTudo();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const tela = harness.routeNativeElement as HTMLElement;
    expect(tela.textContent).not.toMatch(/ainda vai ser construída/i);
    expect(tela.querySelector('[data-seletor-tipo]')).toBeTruthy();
  });

  it('@spec:AC-172 a tela do extrato continua atendendo o link que já existe no produto', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/operacoes?carteira=9&tipo=VENDA');
    expect(router.url).toContain('/operacoes');
    responderTudo();
    await harness.fixture.whenStable();
    harness.detectChanges();

    const tela = harness.routeNativeElement as HTMLElement;
    expect(tela.querySelector('[data-extrato]')).toBeTruthy();
    responderTudo();
  });
});
