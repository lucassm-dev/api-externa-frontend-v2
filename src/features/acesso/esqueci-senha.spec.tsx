import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from '@/rotas';
import { Chamada, erroPadrao, json, simularServidor } from '@/test/servidor';

const EMAIL = 'lucas@exemplo.com';

function responder({ url }: Chamada): Response {
  if (url === '/auth/esqueci-senha') return json(undefined, 202);
  if (url === '/auth/redefinir-senha') return json(undefined, 204);
  return json(null);
}

function abrir(url: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
  render(<RouterProvider router={roteador} />);
  return { caminho: () => roteador.state.location.pathname, busca: () => roteador.state.location.search };
}

const formulario = (campo: string) =>
  waitFor(() => {
    const form = document.querySelector('form');
    if (!form?.querySelector(`input[name="${campo}"]`)) throw new Error(`sem campo ${campo}`);
    return form;
  });
const preencher = (form: Element, campo: string, valor: string) =>
  fireEvent.change(form.querySelector(`input[name="${campo}"]`)!, { target: { value: valor } });
const erroDoCampo = (form: Element, campo: string) => {
  const id = form.querySelector(`input[name="${campo}"]`)?.getAttribute('aria-describedby');
  return id ? (document.getElementById(id)?.textContent ?? '') : '';
};

async function pedirCodigo() {
  const form = await formulario('email');
  preencher(form, 'email', EMAIL);
  fireEvent.submit(form);
  return formulario('codigo');
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessao.encerrar();
});

describe('Esqueci a senha', () => {
  it('@spec:AC-329 o login leva à recuperação levando o e-mail digitado', async () => {
    simularServidor(responder);
    const { caminho } = abrir('/entrar');
    const login = await formulario('senha');
    preencher(login, 'email', EMAIL);

    const link = [...document.querySelectorAll('a')].find((a) => a.textContent?.includes('Esqueci a senha'));
    expect(link).toBeDefined();
    fireEvent.click(link!);

    await waitFor(() => expect(caminho()).toBe('/esqueci-senha'));
    const form = await formulario('email');
    expect((form.querySelector('input[name="email"]') as HTMLInputElement).value).toBe(EMAIL);
  });

  it('@spec:AC-330 pedir o código diz a mesma coisa exista ou não o e-mail e abre o segundo passo', async () => {
    const servidor = simularServidor(responder);
    abrir('/esqueci-senha');

    const passo2 = await pedirCodigo();

    expect(servidor.para('/auth/esqueci-senha')[0]).toMatchObject({ metodo: 'POST', corpo: { email: EMAIL } });
    expect(document.body.textContent).toContain('Se o e-mail existir, enviamos um código');
    expect(passo2.querySelector('input[name="novaSenha"]')).not.toBeNull();
  });

  it('@spec:AC-331 código certo redefine a senha e leva ao login com o e-mail e o aviso', async () => {
    const servidor = simularServidor(responder);
    const { caminho, busca } = abrir('/esqueci-senha');
    const form = await pedirCodigo();

    preencher(form, 'codigo', '123456');
    preencher(form, 'novaSenha', 'nova12345');
    preencher(form, 'confirmarSenha', 'nova12345');
    fireEvent.submit(form);

    await waitFor(() => expect(caminho()).toBe('/entrar'));
    expect(servidor.para('/auth/redefinir-senha')[0].corpo).toEqual({ email: EMAIL, codigo: '123456', novaSenha: 'nova12345' });
    expect(new URLSearchParams(busca()).get('email')).toBe(EMAIL);
    await waitFor(() => expect(document.body.textContent).toContain('Senha redefinida'));
  });

  it('@spec:AC-332 código fora do formato não sai; código recusado pelo servidor vai ao campo', async () => {
    const servidor = simularServidor((chamada) =>
      chamada.url === '/auth/redefinir-senha' ? erroPadrao('AUT-013', 422) : responder(chamada),
    );
    abrir('/esqueci-senha');
    const form = await pedirCodigo();

    preencher(form, 'codigo', '12a4');
    preencher(form, 'novaSenha', 'nova12345');
    preencher(form, 'confirmarSenha', 'nova12345');
    fireEvent.submit(form);
    await waitFor(() => expect(erroDoCampo(form, 'codigo')).toContain('6 dígitos'));
    expect(servidor.para('/auth/redefinir-senha')).toHaveLength(0);

    preencher(form, 'codigo', '654321');
    fireEvent.submit(form);
    await waitFor(() => expect(erroDoCampo(form, 'codigo')).toContain('Código inválido ou expirado'));
  });
});
