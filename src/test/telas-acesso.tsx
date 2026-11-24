import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Cadastro } from '@/features/acesso/cadastro';
import { Login } from '@/features/acesso/login';

/** Monta login e cadastro sob um roteador de memória, como nas rotas reais. */
export async function montarTela(url: string) {
  const roteador = createMemoryRouter(
    [
      { path: '/entrar', element: <Login /> },
      { path: '/criar-conta', element: <Cadastro /> },
      { path: '/painel', element: <p data-painel /> },
    ],
    { initialEntries: [url] },
  );
  const { container } = render(<RouterProvider router={roteador} />);
  await waitFor(() => expect(container.querySelector('form')).not.toBeNull());
  return { raiz: container, roteador };
}
