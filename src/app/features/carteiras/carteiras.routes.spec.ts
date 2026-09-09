import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rotas das carteiras', () => {
  let harness: RouterTestingHarness;
  let router: Router;

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
    TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  }

  it('@spec:AC-098 a área de carteiras tem lista, criação e detalhe com endereço próprio', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/carteiras');
    expect(router.url).toBe('/carteiras');
    expect((harness.routeNativeElement as HTMLElement).textContent).not.toMatch(
      /ainda vai ser construída/i,
    );

    await harness.navigateByUrl('/carteiras/nova');
    expect(router.url).toBe('/carteiras/nova');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Criar carteira');
  });

  it('@spec:AC-094 o detalhe da carteira tem endereço próprio, e `nova` não é lido como identificador', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/carteiras/9');
    expect(router.url).toBe('/carteiras/9');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain(
      'Voltar às carteiras',
    );
  });
});
