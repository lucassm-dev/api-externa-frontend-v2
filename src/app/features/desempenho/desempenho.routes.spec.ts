import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rota do desempenho', () => {
  it('@spec:AC-210 a área de desempenho tem tela própria, e não mais o destino de área em construção', async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(SessaoService).iniciar(
      { token: 'jwt', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() },
      'lucas@exemplo.com',
    );
    const router = TestBed.inject(Router);
    TestBed.inject(HttpTestingController);
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/desempenho');

    expect(router.url).toBe('/desempenho');
    const tela = harness.routeNativeElement as HTMLElement;
    expect(tela.textContent).not.toMatch(/ainda vai ser construída/i);
    expect(tela.textContent).toContain('Desempenho');
  });
});
