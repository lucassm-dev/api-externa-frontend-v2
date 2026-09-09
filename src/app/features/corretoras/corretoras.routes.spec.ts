import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rotas das corretoras', () => {
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

  it('@spec:AC-079 a área de corretoras tem lista, cadastro e detalhe com endereço próprio', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/corretoras');
    expect(router.url).toBe('/corretoras');
    expect((harness.routeNativeElement as HTMLElement).textContent).not.toMatch(
      /ainda vai ser construída/i,
    );

    await harness.navigateByUrl('/corretoras/nova');
    expect(router.url).toBe('/corretoras/nova');
    expect((harness.routeNativeElement as HTMLElement).textContent).toContain('Cadastrar corretora');

    controle.match(() => true).forEach((r) => r.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 }));
  });

  it('@spec:AC-086 o detalhe abre por identificador na URL', async () => {
    await montarComSessao();

    await harness.navigateByUrl('/corretoras/7');
    expect(router.url).toBe('/corretoras/7');

    const requisicao = controle.expectOne('/corretoras/7');
    expect(requisicao.request.method).toBe('GET');
    requisicao.flush({
      id: 7,
      cnpj: '02332886000104',
      razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.',
      nomeFantasia: null,
      email: null,
      telefone: null,
      cep: null,
      logradouro: null,
      numero: null,
      complemento: null,
      bairro: null,
      cidade: 'São Paulo',
      uf: 'SP',
      situacaoCadastral: 'ATIVA',
      validadaNaCvm: true,
      dataBaseCvm: '2026-09-08',
      dataCadastro: '2026-09-09T10:00:00',
    });
    await harness.fixture.whenStable();

    expect((harness.routeNativeElement as HTMLElement).textContent).toContain(
      'XP INVESTIMENTOS CCTVM S.A.',
    );
  });
});
