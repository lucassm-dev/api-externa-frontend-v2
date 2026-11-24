import { cleanup, render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { exigirSessao } from '@/core/sessao/sessao.guard';
import { ROTA_LOGIN } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { rotas } from './rotas';

const AREAS = ['/painel', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/desempenho'];

function entrar(minutos = 1_440) {
  sessao.iniciar(
    { token: 'jwt-abc', tipo: 'Bearer', expiraEm: new Date(Date.now() + minutos * 60_000).toISOString() },
    'lucas@exemplo.com',
  );
}

function abrir(url: string) {
  const roteador = createMemoryRouter(rotas, { initialEntries: [url] });
  render(<RouterProvider router={roteador} />);
  return roteador;
}

const caminho = (roteador: ReturnType<typeof abrir>) => roteador.state.location.pathname;

afterEach(() => sessao.encerrar());

describe('Rotas da aplicação React', () => {
  it('@spec:AC-299 cada endereço abre a mesma área de antes, e sem sessão o investidor vai para o login', async () => {
    for (const area of AREAS) {
      const roteador = abrir(area);
      await waitFor(() => expect(caminho(roteador)).toBe(ROTA_LOGIN));
      expect(document.querySelector('[data-casca]')).toBeNull();
      cleanup();
    }

    entrar();
    for (const area of AREAS) {
      const roteador = abrir(area);
      await waitFor(() => expect(document.querySelector('[data-casca]')).not.toBeNull());
      expect(caminho(roteador)).toBe(area);
      expect(document.querySelector(`[data-area="${area}"]`)?.getAttribute('aria-current')).toBe('page');
      cleanup();
    }

    const raiz = abrir('/');
    await waitFor(() => expect(caminho(raiz)).toBe('/painel'));
    cleanup();

    sessao.encerrar();
    const desconhecido = abrir('/endereco-que-nao-existe');
    await waitFor(() => expect(caminho(desconhecido)).toBe(ROTA_LOGIN));
  });

  it('@spec:AC-042 sem sessão, um endereço interno não renderiza e para no login', async () => {
    const roteador = abrir('/painel');

    await waitFor(() => expect(caminho(roteador)).toBe(ROTA_LOGIN));
    expect(document.body.textContent).not.toMatch(/painel/i);
  });

  it('@spec:AC-042 depois de sair, voltar ao endereço interno continua barrado', async () => {
    entrar();
    const roteador = abrir('/painel');
    await waitFor(() => expect(caminho(roteador)).toBe('/painel'));

    // sair leva ao login; o botão voltar do navegador tenta o endereço interno de novo
    sessao.encerrar();
    await roteador.navigate('/entrar');
    await roteador.navigate('/painel');

    await waitFor(() => expect(caminho(roteador)).toBe(ROTA_LOGIN));
  });

  it('@spec:AC-039 quem já tem sessão não fica na tela de login', async () => {
    entrar();
    const roteador = abrir('/entrar');

    await waitFor(() => expect(caminho(roteador)).toBe('/painel'));
  });

  it('@spec:AC-040 login e cadastro têm endereço próprio e público', async () => {
    const roteador = abrir('/criar-conta');
    await waitFor(() => expect(roteador.state.navigation.state).toBe('idle'));
    expect(caminho(roteador)).toBe('/criar-conta');

    await roteador.navigate('/entrar');
    expect(caminho(roteador)).toBe('/entrar');
  });
});

describe('Guarda das telas internas', () => {
  const executarGuarda = () => exigirSessao({ request: new Request('http://localhost/painel'), params: {}, context: {} } as never);

  it('@spec:AC-015 sem sessão, o acesso é negado e o destino vira o login', () => {
    let resposta: unknown = null;
    try {
      executarGuarda();
    } catch (redirecionamento) {
      resposta = redirecionamento;
    }

    expect(resposta).toBeInstanceOf(Response);
    expect((resposta as Response).headers.get('Location')).toContain(ROTA_LOGIN);
  });

  it('@spec:AC-015 sessão com prazo vencido também é barrada', () => {
    sessao.iniciar({ token: 'vencido', tipo: 'Bearer', expiraEm: new Date(Date.now() - 1_000).toISOString() }, 'lucas@exemplo.com');

    expect(() => executarGuarda()).toThrow();
  });

  it('@spec:AC-016 com sessão válida, o acesso é liberado sem redirecionamento', () => {
    entrar(60);

    expect(executarGuarda()).toBeNull();
  });
});
