import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rotas das ações', () => {
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

  it('@spec:AC-133 a área de ações tem lista e cadastro com endereço próprio', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/acoes');
    expect(router.url).toBe('/acoes');
    expect((harness.routeNativeElement as HTMLElement).textContent).not.toMatch(
      /ainda vai ser construída/i,
    );

    await harness.navigateByUrl('/acoes/nova');
    expect(router.url).toBe('/acoes/nova');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Cadastrar ação');

    controle
      .match(() => true)
      .forEach((r) => r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }));
  });

  it('@spec:AC-147 o detalhe abre pelo ticker na URL', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/acoes/PETR4');
    expect(router.url).toBe('/acoes/PETR4');

    const requisicao = controle.expectOne('/acoes/ticker/PETR4');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      id: 12,
      ticker: 'PETR4',
      nomeEmpresa: 'Petróleo Brasileiro S.A.',
      mercado: 'BR',
      moeda: 'BRL',
      cotacaoAtual: 38.42,
      dataHoraCotacao: '2026-09-09T13:55:00',
    });
    await harness.fixture.whenStable();

    expect((harness.routeNativeElement as HTMLElement).textContent).toContain(
      'Petróleo Brasileiro S.A.',
    );
  });
});
