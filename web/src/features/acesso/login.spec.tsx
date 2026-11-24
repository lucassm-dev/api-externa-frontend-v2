import { fireEvent, waitFor } from '@testing-library/react';
import { sessao } from '@/core/sessao/sessao.service';
import { erroPadrao, json, simularServidor } from '@/test/servidor';
import { ROTA_AREA_INTERNA } from './acesso.model';
import { montarTela } from '@/test/telas-acesso';

const SESSAO = () => json({ token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + 86_400_000).toISOString() });
const recusa = () => erroPadrao('AUT-004', 401, { message: 'Credenciais inválidas para o e-mail lucas@exemplo.com' });

afterEach(() => {
  vi.unstubAllGlobals();
  sessao.encerrar();
});

function preencher(raiz: HTMLElement, email: string, senha: string) {
  fireEvent.change(raiz.querySelector('input[name="email"]')!, { target: { value: email } });
  fireEvent.change(raiz.querySelector('input[name="senha"]')!, { target: { value: senha } });
}

const enviar = (raiz: HTMLElement) => fireEvent.submit(raiz.querySelector('form')!);
const botao = (raiz: HTMLElement) => raiz.querySelector('button[type="submit"]') as HTMLButtonElement;

describe('Tela de login', () => {
  it('@spec:AC-035 login válido guarda a sessão e leva à área interna', async () => {
    simularServidor(SESSAO);
    const { raiz, roteador } = await montarTela('/entrar');

    preencher(raiz, 'lucas@exemplo.com', 'segura123');
    enviar(raiz);

    await waitFor(() => expect(roteador.state.location.pathname).toBe(ROTA_AREA_INTERNA));
    expect(sessao.ativa()).toBe(true);
    expect(sessao.email()).toBe('lucas@exemplo.com');
  });

  it('@spec:AC-036 credencial incorreta não revela qual campo errou nem se a conta existe', async () => {
    simularServidor(recusa);
    const { raiz } = await montarTela('/entrar');

    preencher(raiz, 'lucas@exemplo.com', 'errada123');
    enviar(raiz);

    await waitFor(() => expect(raiz.querySelector('[data-mensagem]')?.textContent).toBe('E-mail ou senha incorretos.'));
    expect(raiz.querySelectorAll('[data-erro]')).toHaveLength(0);
    expect((raiz.querySelector('input[name="email"]') as HTMLInputElement).value).toBe('lucas@exemplo.com');
    expect(raiz.textContent).not.toMatch(/não encontrad|não existe|senha incorreta para/i);
    expect(raiz.textContent).not.toContain('Credenciais inválidas para o e-mail');
  });

  it('@spec:AC-037 o botão fica indisponível durante o envio e nenhuma segunda requisição sai', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = await montarTela('/entrar');

    preencher(raiz, 'lucas@exemplo.com', 'segura123');
    enviar(raiz);

    await waitFor(() => expect(botao(raiz).hasAttribute('disabled')).toBe(true));
    enviar(raiz);
    expect(servidor.para('/auth/login')).toHaveLength(1);
    servidor.liberar(SESSAO());
  });

  it('@spec:AC-038 a tela de login não oferece recuperação de senha', async () => {
    const { raiz } = await montarTela('/entrar');

    expect(raiz.innerHTML).not.toMatch(/esqueci|recuperar senha|redefinir senha/i);
  });

  it('@spec:AC-025 quem vem do cadastro chega com o e-mail preenchido e a conta confirmada', async () => {
    const { raiz } = await montarTela('/entrar?email=nova%40exemplo.com&contaCriada=1');

    expect((raiz.querySelector('input[name="email"]') as HTMLInputElement).value).toBe('nova@exemplo.com');
    expect(raiz.textContent).toMatch(/conta criada/i);
  });

  it('@spec:AC-045 quem chega por sessão expirada lê o motivo', async () => {
    const { raiz } = await montarTela('/entrar?motivo=AUT-006');

    expect(raiz.textContent).toContain('Sua sessão expirou. Entre novamente.');
  });

  it('@spec:AC-040 o login tem caminho de um clique para criar conta', async () => {
    const { raiz } = await montarTela('/entrar');

    expect(raiz.querySelector('a[href="/criar-conta"]')).not.toBeNull();
  });

  it('@spec:AC-254 só mostra a orientação do e-mail inválido depois que o campo perde foco', async () => {
    const { raiz } = await montarTela('/entrar');
    const email = raiz.querySelector('input[name="email"]') as HTMLInputElement;

    expect(raiz.querySelector('[data-erro]')).toBeNull();
    fireEvent.change(email, { target: { value: 'email-invalido' } });
    expect(raiz.querySelector('[data-erro]')).toBeNull();
    fireEvent.blur(email);

    expect(raiz.querySelector('[data-erro]')?.textContent).toMatch(/informe um e-mail válido/i);
  });

  it('@spec:AC-256 deixa o primeiro campo pronto para digitar quando a tela abre', async () => {
    const { raiz } = await montarTela('/entrar');
    const email = raiz.querySelector('input[name="email"]');

    expect(email).toBe(raiz.querySelector('form input'));
    expect(document.activeElement).toBe(email);
  });

  it('@spec:AC-257 mantém o rótulo Entrar ao lado do indicador durante o envio', async () => {
    const servidor = simularServidor(() => servidor.segurar());
    const { raiz } = await montarTela('/entrar');

    preencher(raiz, 'lucas@exemplo.com', 'segura123');
    enviar(raiz);

    await waitFor(() => expect(botao(raiz).disabled).toBe(true));
    expect(botao(raiz).getAttribute('aria-busy')).toBe('true');
    expect(botao(raiz).querySelector('[data-giro]')).not.toBeNull();
    expect(botao(raiz).textContent?.trim()).toBe('Entrar');
    servidor.liberar(SESSAO());
  });

  it('@spec:AC-258 exibe nível e código definidos pelo catálogo, ignorando o texto cru', async () => {
    simularServidor(recusa);
    const { raiz } = await montarTela('/entrar');

    preencher(raiz, 'lucas@exemplo.com', 'errada123');
    enviar(raiz);

    await waitFor(() => expect(raiz.querySelector('[data-nivel="erro"]')).not.toBeNull());
    expect(raiz.querySelector('[data-codigo]')?.textContent).toContain('AUT-004');
    expect(raiz.textContent).not.toContain('Credenciais inválidas para o e-mail');
  });
});
