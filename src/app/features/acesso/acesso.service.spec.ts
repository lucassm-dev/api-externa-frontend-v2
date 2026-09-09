import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CHAVE_SESSAO } from '../../core/sessao/sessao.model';
import { SessaoService } from '../../core/sessao/sessao.service';
import { AcessoService } from './acesso.service';

describe('Acesso ao sistema', () => {
  let acesso: AcessoService;
  let sessao: SessaoService;
  let controle: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    acesso = TestBed.inject(AcessoService);
    sessao = TestBed.inject(SessaoService);
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  it('@spec:AC-025 o cadastro envia os quatro campos para a rota pública de cadastro', () => {
    let criado: { id: number; email: string } | undefined;
    acesso
      .cadastrar({ nome: 'Lucas', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' })
      .subscribe((resposta) => (criado = resposta));

    const requisicao = controle.expectOne('/auth/cadastro');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({
      nome: 'Lucas',
      email: 'lucas@exemplo.com',
      cpf: '12345678901',
      senha: 'segura123',
    });

    requisicao.flush({ id: 7, nome: 'Lucas', email: 'lucas@exemplo.com' });
    expect(criado?.id).toBe(7);
  });

  it('@spec:AC-026 cadastrar não cria sessão nem guarda a senha em lugar nenhum', () => {
    acesso
      .cadastrar({ nome: 'Lucas', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' })
      .subscribe();
    controle.expectOne('/auth/cadastro').flush({ id: 7, nome: 'Lucas', email: 'lucas@exemplo.com' });

    expect(sessao.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('segura123');
  });

  it('@spec:AC-035 entrar guarda a sessão devolvida pelo login', () => {
    const expiraEm = new Date(Date.now() + 86_400_000).toISOString();
    acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' }).subscribe();

    const requisicao = controle.expectOne('/auth/login');
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual({ email: 'lucas@exemplo.com', senha: 'segura123' });
    requisicao.flush({ token: 'jwt-abc', tipo: 'Bearer', expiraEm });

    expect(sessao.ativa()).toBe(true);
    expect(sessao.token()).toBe('jwt-abc');
  });

  it('@spec:AC-046 a sessão guarda o e-mail digitado, e a senha não sobra em lugar nenhum', () => {
    acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' }).subscribe();
    controle.expectOne('/auth/login').flush({
      token: 'jwt-abc',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
    });

    expect(sessao.email()).toBe('lucas@exemplo.com');
    expect(localStorage.getItem(CHAVE_SESSAO)).not.toContain('segura123');
  });

  it('@spec:AC-041 sair não deixa nada da sessão guardado', () => {
    acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' }).subscribe();
    controle.expectOne('/auth/login').flush({
      token: 'jwt-abc',
      tipo: 'Bearer',
      expiraEm: new Date(Date.now() + 86_400_000).toISOString(),
    });

    acesso.sair();

    expect(sessao.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });
});
