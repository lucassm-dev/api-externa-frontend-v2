import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { CHAVE_SESSAO } from '../../../core/sessao/sessao.model';
import { SessaoService } from '../../../core/sessao/sessao.service';
import { Cadastro } from './cadastro';

const VALIDO = {
  nome: 'Lucas Mendes',
  email: 'lucas@exemplo.com',
  cpf: '12345678901',
  senha: 'segura123',
};

function erroDoServidor(codigo: string, status: number, fieldErrors?: { field: string; message: string }[]) {
  return {
    corpo: {
      timestamp: '2026-09-08T12:00:00Z',
      status,
      codigo,
      error: 'Conflict',
      message: 'mensagem crua do servidor',
      path: '/auth/cadastro',
      ...(fieldErrors ? { fieldErrors } : {}),
    },
    opcoes: { status, statusText: 'erro' },
  };
}

describe('Tela de cadastro', () => {
  let fixture: ComponentFixture<Cadastro>;
  let componente: Cadastro;
  let controle: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'entrar', children: [] }]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Cadastro);
    componente = fixture.componentInstance;
    await fixture.whenStable();
  });

  function preencher(dados: Partial<typeof VALIDO> = {}) {
    componente.formulario.setValue({ ...VALIDO, ...dados });
  }

  async function enviar() {
    componente.enviar();
    await fixture.whenStable();
  }

  it('@spec:AC-034 as regras de CPF, senha e e-mail já estão na tela antes de qualquer erro', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toMatch(/11 dígitos/i);
    expect(texto).toMatch(/8 caracteres/i);
    expect(texto).toMatch(/letra/i);
    expect(texto).toMatch(/número/i);
    expect(texto).toMatch(/nome@dominio/i);
  });

  it('@spec:AC-027 CPF fora do formato barra o envio antes de chamar o backend', async () => {
    preencher({ cpf: '123' });
    await enviar();

    controle.expectNone('/auth/cadastro');
    expect(componente.formulario.controls.cpf.invalid).toBe(true);
  });

  it('@spec:AC-148 o campo mostra o CPF pontuado enquanto o investidor digita', async () => {
    const campo = (fixture.nativeElement as HTMLElement).querySelector(
      'input[formcontrolname="cpf"]',
    ) as HTMLInputElement;

    for (const [digitado, esperado] of [
      ['123', '123'],
      ['123456', '123.456'],
      ['123456789', '123.456.789'],
      ['12345678901', '123.456.789-01'],
    ] as const) {
      campo.value = digitado;
      campo.dispatchEvent(new Event('input'));
      await fixture.whenStable();

      expect(campo.value).toBe(esperado);
      expect(componente.formulario.controls.cpf.value).toBe(esperado);
    }
  });

  it('@spec:AC-148 o campo não aceita nada além de dígitos, e o CPF completo continua válido', async () => {
    const campo = (fixture.nativeElement as HTMLElement).querySelector(
      'input[formcontrolname="cpf"]',
    ) as HTMLInputElement;

    campo.value = '123abc456!789-01x';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(campo.value).toBe('123.456.789-01');
    expect(componente.formulario.controls.cpf.valid).toBe(true);
  });

  it('@spec:AC-149 o servidor recebe os 11 dígitos, sem a máscara', async () => {
    preencher({ cpf: '123.456.789-01' });
    await enviar();

    const requisicao = controle.expectOne('/auth/cadastro');
    expect(requisicao.request.body.cpf).toBe('12345678901');
    requisicao.flush({ id: 1, nome: VALIDO.nome, email: VALIDO.email });
    await fixture.whenStable();
  });

  it('@spec:AC-028 senha fora da política barra o envio antes de chamar o backend', async () => {
    preencher({ senha: 'semnumero' });
    await enviar();

    controle.expectNone('/auth/cadastro');
    expect(componente.formulario.controls.senha.invalid).toBe(true);
  });

  it('@spec:AC-029 e-mail fora de formato barra o envio antes de chamar o backend', async () => {
    preencher({ email: 'lucas-arroba-exemplo' });
    await enviar();

    controle.expectNone('/auth/cadastro');
    expect(componente.formulario.controls.email.invalid).toBe(true);
  });

  it('@spec:AC-025 cadastro válido leva ao login com o e-mail preenchido e a conta confirmada', async () => {
    const navegou = vi.spyOn(router, 'navigate');
    preencher();
    await enviar();

    const requisicao = controle.expectOne('/auth/cadastro');
    expect(requisicao.request.body).toEqual(VALIDO);
    requisicao.flush({ id: 7, nome: VALIDO.nome, email: VALIDO.email });
    await fixture.whenStable();

    expect(navegou).toHaveBeenCalled();
    const [destino, extras] = navegou.mock.calls[0] as [string[], { queryParams: Record<string, string> }];
    expect(destino).toEqual(['/entrar']);
    expect(extras.queryParams['email']).toBe(VALIDO.email);
    expect(extras.queryParams['contaCriada']).toBeTruthy();
  });

  it('@spec:AC-026 cadastro concluído não cria sessão nem guarda a senha', async () => {
    preencher();
    await enviar();
    controle.expectOne('/auth/cadastro').flush({ id: 7, nome: VALIDO.nome, email: VALIDO.email });
    await fixture.whenStable();

    expect(TestBed.inject(SessaoService).ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain(VALIDO.senha);
  });

  it('@spec:AC-030 e-mail duplicado preserva o que foi digitado e destaca só o campo do e-mail', async () => {
    preencher();
    await enviar();
    const { corpo, opcoes } = erroDoServidor('AUT-001', 409);
    controle.expectOne('/auth/cadastro').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.formulario.value).toEqual(VALIDO);
    expect(componente.formulario.controls.email.errors?.['servidor']).toBe('Este e-mail já está em uso.');
    expect(componente.formulario.controls.cpf.errors).toBeNull();
    expect(componente.formulario.controls.senha.errors).toBeNull();
    expect(componente.formulario.controls.nome.errors).toBeNull();
  });

  it('@spec:AC-031 CPF duplicado destaca só o CPF, sem limpar o formulário', async () => {
    preencher();
    await enviar();
    const { corpo, opcoes } = erroDoServidor('AUT-002', 409);
    controle.expectOne('/auth/cadastro').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.formulario.controls.cpf.errors?.['servidor']).toBe('Este CPF já está em uso.');
    expect(componente.formulario.controls.email.errors).toBeNull();
    expect(componente.formulario.value.nome).toBe(VALIDO.nome);
  });

  it('@spec:AC-032 senha recusada pelo servidor destaca a senha', async () => {
    preencher();
    await enviar();
    const { corpo, opcoes } = erroDoServidor('AUT-008', 422);
    controle.expectOne('/auth/cadastro').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.formulario.controls.senha.errors?.['servidor']).toBe(
      'A senha precisa ter ao menos 8 caracteres, com letra e número.',
    );
    expect(componente.formulario.value.senha).toBe(VALIDO.senha);
  });

  it('@spec:AC-033 erro de validação do servidor se distribui pelos campos, sem balão de topo', async () => {
    preencher();
    await enviar();
    const { corpo, opcoes } = erroDoServidor('VAL-001', 400, [
      { field: 'nome', message: 'Nome é obrigatório' },
      { field: 'cpf', message: 'CPF deve conter 11 dígitos numéricos' },
    ]);
    controle.expectOne('/auth/cadastro').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.formulario.controls.nome.errors?.['servidor']).toBe('Nome é obrigatório');
    expect(componente.formulario.controls.cpf.errors?.['servidor']).toBe('CPF deve conter 11 dígitos numéricos');
    expect(componente.mensagemGeral()).toBeNull();
  });

  it('@spec:AC-040 o cadastro tem caminho de um clique de volta para o login', () => {
    const link = (fixture.nativeElement as HTMLElement).querySelector('a[href="/entrar"]');
    expect(link).not.toBeNull();
  });

  it('@spec:AC-254 só mostra a orientação do nome obrigatório depois que o campo perde foco', async () => {
    const raiz = fixture.nativeElement as HTMLElement;
    const nome = raiz.querySelector('input[formcontrolname="nome"]') as HTMLInputElement;

    expect(raiz.querySelector('mat-error')).toBeNull();
    nome.dispatchEvent(new Event('blur'));
    await fixture.whenStable();

    expect(raiz.querySelector('mat-error')?.textContent).toMatch(/informe seu nome/i);
  });

  it('@spec:AC-255 liga o campo de senha ao medidor da política vigente', async () => {
    const senha = (fixture.nativeElement as HTMLElement).querySelector(
      'input[formcontrolname="senha"]',
    ) as HTMLInputElement;
    senha.value = 'segura123';
    senha.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-forca-senha]')
        ?.getAttribute('data-aceitavel'),
    ).toBe('true');
  });

  it('@spec:AC-256 deixa o primeiro campo pronto para digitar quando a tela abre', () => {
    const raiz = fixture.nativeElement as HTMLElement;
    const nome = raiz.querySelector('input[formcontrolname="nome"]') as HTMLInputElement;

    expect(nome.hasAttribute('autofocus')).toBe(true);
    expect(nome).toBe(raiz.querySelector('form input'));
  });

  it('@spec:AC-257 mantém o rótulo Criar conta ao lado do indicador durante o envio', async () => {
    preencher();
    await enviar();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button[type="submit"]') as HTMLButtonElement;

    expect(botao.disabled).toBe(true);
    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(botao.querySelector('[data-indicador-envio]')).not.toBeNull();
    expect(botao.textContent?.trim()).toBe('Criar conta');

    controle.expectOne('/auth/cadastro').flush({ id: 7, nome: VALIDO.nome, email: VALIDO.email });
  });

  it('@spec:AC-258 exibe nível e código definidos pelo catálogo, ignorando o texto cru', async () => {
    preencher();
    await enviar();
    const { corpo, opcoes } = erroDoServidor('SYS-001', 500);
    controle.expectOne('/auth/cadastro').flush(corpo, opcoes);
    await fixture.whenStable();
    const raiz = fixture.nativeElement as HTMLElement;

    expect(raiz.querySelector('[data-nivel="erro"]')).not.toBeNull();
    expect(raiz.querySelector('[data-codigo]')?.textContent).toContain('SYS-001');
    expect(raiz.textContent).not.toContain('mensagem crua do servidor');
  });
});
