import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';
import { SessaoService } from '../../core/sessao/sessao.service';

describe('Rotas de acesso e da área interna', () => {
  let harness: RouterTestingHarness;
  let sessao: SessaoService;
  let router: Router;

  async function montar() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    sessao = TestBed.inject(SessaoService);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  }

  function entrar() {
    sessao.iniciar(
      {
        token: 'jwt-abc',
        tipo: 'Bearer',
        expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
      },
      'lucas@exemplo.com',
    );
  }

  // Prazo próprio: é a primeira navegação da suíte e ela paga o carregamento
  // preguiçoso das rotas internas. O custo é de arranque, não da asserção — os
  // testes seguintes deste mesmo arquivo terminam em milissegundos.
  it(
    '@spec:AC-042 sem sessão, um endereço interno não renderiza e para no login',
    async () => {
      await montar();

      await harness.navigateByUrl('/painel');

      expect(router.url).toContain('/entrar');
      expect((harness.routeNativeElement as HTMLElement).textContent).not.toMatch(/painel/i);
    },
    30_000,
  );

  it('@spec:AC-042 depois de sair, voltar ao endereço interno continua barrado', async () => {
    await montar();
    entrar();
    await harness.navigateByUrl('/painel');
    expect(router.url).toBe('/painel');

    // sair leva ao login; o botão voltar do navegador tenta o endereço interno de novo
    sessao.encerrar();
    await harness.navigateByUrl('/entrar');
    await harness.navigateByUrl('/painel');

    expect(router.url).toContain('/entrar');
  });

  it('@spec:AC-039 quem já tem sessão não fica na tela de login', async () => {
    await montar();
    entrar();

    await harness.navigateByUrl('/entrar');

    expect(router.url).toBe('/painel');
  });

  it('@spec:AC-040 login e cadastro têm endereço próprio e público', async () => {
    await montar();

    await harness.navigateByUrl('/criar-conta');
    expect(router.url).toBe('/criar-conta');

    await harness.navigateByUrl('/entrar');
    expect(router.url).toBe('/entrar');
  });
});
