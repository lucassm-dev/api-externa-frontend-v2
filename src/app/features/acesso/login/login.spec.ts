import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { SessaoService } from '../../../core/sessao/sessao.service';
import { ROTA_AREA_INTERNA } from '../acesso.model';
import { Login } from './login';

describe('Tela de login', () => {
  let fixture: ComponentFixture<Login>;
  let componente: Login;
  let controle: HttpTestingController;
  let sessao: SessaoService;
  let router: Router;

  async function montar(queryParams: Record<string, string> = {}) {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'entrar', children: [] },
          { path: 'painel', children: [] },
        ]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParams } } },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    sessao = TestBed.inject(SessaoService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Login);
    componente = fixture.componentInstance;
    await fixture.whenStable();
  }

  function recusar(codigo: string, status: number) {
    controle.expectOne('/auth/login').flush(
      {
        timestamp: '2026-09-08T12:00:00Z',
        status,
        codigo,
        error: 'Unauthorized',
        message: 'Credenciais inválidas para o e-mail lucas@exemplo.com',
        path: '/auth/login',
      },
      { status, statusText: 'erro' },
    );
  }

  it('@spec:AC-035 login válido guarda a sessão e leva à área interna', async () => {
    await montar();
    const navegou = vi.spyOn(router, 'navigateByUrl');
    componente.formulario.setValue({ email: 'lucas@exemplo.com', senha: 'segura123' });
    componente.enviar();
    await fixture.whenStable();

    controle.expectOne('/auth/login').flush({
      token: 'jwt-abc',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
    });
    await fixture.whenStable();

    expect(sessao.ativa()).toBe(true);
    expect(sessao.email()).toBe('lucas@exemplo.com');
    expect(String(navegou.mock.calls[0][0])).toContain(ROTA_AREA_INTERNA);
  });

  it('@spec:AC-036 credencial incorreta não revela qual campo errou nem se a conta existe', async () => {
    await montar();
    componente.formulario.setValue({ email: 'lucas@exemplo.com', senha: 'errada123' });
    componente.enviar();
    await fixture.whenStable();
    recusar('AUT-004', 401);
    await fixture.whenStable();

    expect(componente.mensagemGeral()).toBe('E-mail ou senha incorretos.');
    expect(componente.formulario.controls.email.errors).toBeNull();
    expect(componente.formulario.controls.senha.errors).toBeNull();
    expect(componente.formulario.value.email).toBe('lucas@exemplo.com');

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).not.toMatch(/não encontrad|não existe|senha incorreta para/i);
    expect(texto).not.toContain('Credenciais inválidas para o e-mail');
  });

  it('@spec:AC-037 o botão fica indisponível durante o envio e nenhuma segunda requisição sai', async () => {
    await montar();
    componente.formulario.setValue({ email: 'lucas@exemplo.com', senha: 'segura123' });
    componente.enviar();
    await fixture.whenStable();

    expect(componente.enviando()).toBe(true);
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]');
    expect(botao?.hasAttribute('disabled')).toBe(true);

    componente.enviar();
    controle.expectOne('/auth/login').flush({
      token: 'jwt-abc',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
    });
  });

  it('@spec:AC-038 a tela de login não oferece recuperação de senha', async () => {
    await montar();
    const html = (fixture.nativeElement as HTMLElement).innerHTML;

    expect(html).not.toMatch(/esqueci|recuperar senha|redefinir senha/i);
  });

  it('@spec:AC-025 quem vem do cadastro chega com o e-mail preenchido e a conta confirmada', async () => {
    await montar({ email: 'nova@exemplo.com', contaCriada: '1' });

    expect(componente.formulario.value.email).toBe('nova@exemplo.com');
    expect((fixture.nativeElement as HTMLElement).textContent).toMatch(/conta criada/i);
  });

  it('@spec:AC-045 quem chega por sessão expirada lê o motivo', async () => {
    await montar({ motivo: 'AUT-006' });

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Sua sessão expirou. Entre novamente.',
    );
  });

  it('@spec:AC-040 o login tem caminho de um clique para criar conta', async () => {
    await montar();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href="/criar-conta"]');

    expect(link).not.toBeNull();
  });

  it('@spec:AC-254 só mostra a orientação do e-mail inválido depois que o campo perde foco', async () => {
    await montar();
    const raiz = fixture.nativeElement as HTMLElement;
    const email = raiz.querySelector('input[formcontrolname="email"]') as HTMLInputElement;

    expect(raiz.querySelector('mat-error')).toBeNull();
    email.value = 'email-invalido';
    email.dispatchEvent(new Event('input'));
    email.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(raiz.querySelector('mat-error')?.textContent).toMatch(/informe um e-mail válido/i);
  });

  it('@spec:AC-256 deixa o primeiro campo pronto para digitar quando a tela abre', async () => {
    await montar();
    const email = (fixture.nativeElement as HTMLElement).querySelector(
      'input[formcontrolname="email"]',
    ) as HTMLInputElement;

    expect(email.hasAttribute('autofocus')).toBe(true);
    expect(email).toBe((fixture.nativeElement as HTMLElement).querySelector('form input'));
  });

  it('@spec:AC-257 mantém o rótulo Entrar ao lado do indicador durante o envio', async () => {
    await montar();
    componente.formulario.setValue({ email: 'lucas@exemplo.com', senha: 'segura123' });
    componente.enviar();
    await fixture.whenStable();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(botao.disabled).toBe(true);
    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(botao.querySelector('[data-indicador-envio]')).not.toBeNull();
    expect(botao.textContent?.trim()).toBe('Entrar');

    controle.expectOne('/auth/login').flush({
      token: 'jwt-abc',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
    });
  });

  it('@spec:AC-258 exibe nível e código definidos pelo catálogo, ignorando o texto cru', async () => {
    await montar();
    componente.formulario.setValue({ email: 'lucas@exemplo.com', senha: 'errada123' });
    componente.enviar();
    await fixture.whenStable();
    recusar('AUT-004', 401);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('[data-nivel="erro"]')).not.toBeNull();
    expect(raiz.querySelector('[data-codigo]')?.textContent).toContain('AUT-004');
    expect(raiz.textContent).not.toContain('Credenciais inválidas para o e-mail');
  });
});
