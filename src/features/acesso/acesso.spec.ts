import { CHAVE_SESSAO } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { json, simularServidor } from '@/test/servidor';
import { acesso } from './acesso';
import { REGRA_CPF, REGRA_SENHA, validarCpf, validarSenha } from './validadores';

const SESSAO_DO_SERVIDOR = () => ({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });

afterEach(() => {
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Acesso ao sistema', () => {
  it('@spec:AC-025 o cadastro envia os quatro campos para a rota pública de cadastro', async () => {
    const servidor = simularServidor(() => json({ id: 7, nome: 'Lucas', email: 'lucas@exemplo.com' }));

    const criado = await acesso.cadastrar({ nome: 'Lucas', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' });

    const [requisicao] = servidor.para('/auth/cadastro');
    expect(requisicao.metodo).toBe('POST');
    expect(requisicao.corpo).toEqual({ nome: 'Lucas', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' });
    expect(criado.id).toBe(7);
  });

  it('@spec:AC-026 cadastrar não cria sessão nem guarda a senha em lugar nenhum', async () => {
    simularServidor(() => json({ id: 7, nome: 'Lucas', email: 'lucas@exemplo.com' }));

    await acesso.cadastrar({ nome: 'Lucas', email: 'lucas@exemplo.com', cpf: '12345678901', senha: 'segura123' });

    expect(sessao.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
    expect(JSON.stringify(localStorage)).not.toContain('segura123');
  });

  it('@spec:AC-035 entrar guarda a sessão devolvida pelo login', async () => {
    const servidor = simularServidor(() => json(SESSAO_DO_SERVIDOR()));

    await acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' });

    const [requisicao] = servidor.para('/auth/login');
    expect(requisicao.metodo).toBe('POST');
    expect(requisicao.corpo).toEqual({ email: 'lucas@exemplo.com', senha: 'segura123' });
    expect(sessao.ativa()).toBe(true);
    expect(sessao.token()).toBe('jwt-abc');
  });

  it('@spec:AC-046 a sessão guarda o e-mail digitado, e a senha não sobra em lugar nenhum', async () => {
    simularServidor(() => json(SESSAO_DO_SERVIDOR()));

    await acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' });

    expect(sessao.email()).toBe('lucas@exemplo.com');
    expect(localStorage.getItem(CHAVE_SESSAO)).not.toContain('segura123');
  });

  it('@spec:AC-041 sair não deixa nada da sessão guardado', async () => {
    simularServidor(() => json(SESSAO_DO_SERVIDOR()));
    await acesso.entrar({ email: 'lucas@exemplo.com', senha: 'segura123' });

    acesso.sair();

    expect(sessao.ativa()).toBe(false);
    expect(localStorage.getItem(CHAVE_SESSAO)).toBeNull();
  });
});

describe('Validação antes do envio', () => {
  it('@spec:AC-027 CPF precisa ter exatamente 11 dígitos numéricos', () => {
    for (const valor of ['1234567890', '123456789012', '1234567890a', 'abcdefghijk', '123.456.789-0', '']) {
      expect(validarCpf(valor), `aceitou ${valor}`).not.toBeNull();
    }

    // A máscara é apresentação: pontuado ou corrido, o que vale são os dígitos.
    expect(validarCpf('12345678901')).toBeNull();
    expect(validarCpf('123.456.789-01')).toBeNull();
  });

  it('@spec:AC-028 senha precisa de 8 caracteres, com ao menos uma letra e um número', () => {
    for (const valor of ['curta1', 'somenteletras', '12345678', 'Abc12', '        ']) {
      expect(validarSenha(valor), `aceitou ${valor}`).not.toBeNull();
    }

    expect(validarSenha('segura123')).toBeNull();
    expect(validarSenha('A1bcdefg')).toBeNull();
  });

  it('@spec:AC-034 as regras que o investidor precisa ler estão escritas, não só codificadas', () => {
    expect(REGRA_CPF).toContain('11');
    expect(REGRA_SENHA).toContain('8');
    expect(REGRA_SENHA).toMatch(/letra/i);
    expect(REGRA_SENHA).toMatch(/número/i);
  });
});
