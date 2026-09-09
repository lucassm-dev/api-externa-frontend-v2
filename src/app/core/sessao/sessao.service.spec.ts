import { TestBed } from '@angular/core/testing';
import { CHAVE_SESSAO, RespostaLogin } from './sessao.model';
import { SessaoService } from './sessao.service';

const AGORA = new Date('2026-09-08T12:00:00.000Z');

function login(minutosAteExpirar: number): RespostaLogin {
  return {
    token: 'token-de-teste',
    tipo: 'Bearer',
    expiraEm: new Date(AGORA.getTime() + minutosAteExpirar * 60_000).toISOString(),
  };
}

const EMAIL = 'lucas@exemplo.com';

function servicoNovo(): SessaoService {
  TestBed.resetTestingModule();
  return TestBed.inject(SessaoService);
}

describe('Sessão', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AGORA);
    localStorage.clear();
    TestBed.resetTestingModule();
  });

  afterEach(() => vi.useRealTimers());

  it('@spec:AC-011 a sessão sobrevive ao fechamento do navegador', () => {
    servicoNovo().iniciar(login(60), EMAIL);

    const depoisDeReabrir = servicoNovo();

    expect(depoisDeReabrir.ativa()).toBe(true);
    expect(depoisDeReabrir.token()).toBe('token-de-teste');
    expect(depoisDeReabrir.email()).toBe(EMAIL);
  });

  it('@spec:AC-012 sair apaga a sessão e nada dela permanece guardado', () => {
    const servico = servicoNovo();
    servico.iniciar(login(60), EMAIL);

    servico.encerrar();

    expect(servico.ativa()).toBe(false);
    expect(servico.token()).toBeNull();
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    expect(servicoNovo().ativa()).toBe(false);
  });

  it('@spec:AC-013 sessão com prazo vencido é tratada como ausência de sessão e o guardado é limpo', () => {
    servicoNovo().iniciar(login(-1), EMAIL);

    const aoCarregar = servicoNovo();

    expect(aoCarregar.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });

  it('@spec:AC-013 conteúdo corrompido no armazenamento não vira sessão', () => {
    localStorage.setItem(CHAVE_SESSAO, '{isto não é json');

    expect(servicoNovo().ativa()).toBe(false);
  });

  it('@spec:AC-014 a sessão avisa que está acabando a menos de 5 minutos do fim, sem consultar o servidor', () => {
    const servico = servicoNovo();
    servico.iniciar(login(6), EMAIL);
    expect(servico.acabando()).toBe(false);

    vi.setSystemTime(new Date(AGORA.getTime() + 61_000));
    expect(servico.acabando()).toBe(true);
    expect(servico.ativa()).toBe(true);

    vi.setSystemTime(new Date(AGORA.getTime() + 7 * 60_000));
    expect(servico.acabando()).toBe(false);
    expect(servico.ativa()).toBe(false);
  });

  it('@spec:AC-046 a sessão nasce de token, tipo e expiraEm, mais o e-mail digitado — e nada além', () => {
    const resposta = login(60);
    const servico = servicoNovo();

    servico.iniciar(resposta, EMAIL);

    const guardada = JSON.parse(localStorage.getItem(CHAVE_SESSAO) ?? '{}') as Record<string, unknown>;
    expect(Object.keys(guardada).sort()).toEqual(['email', 'expiraEm', 'tipo', 'token']);
    expect(guardada['token']).toBe(resposta.token);
    expect(guardada['tipo']).toBe('Bearer');
    expect(guardada['expiraEm']).toBe(resposta.expiraEm);
    expect(guardada['email']).toBe(EMAIL);
    expect(JSON.stringify(guardada)).not.toContain('senha');
  });
});
