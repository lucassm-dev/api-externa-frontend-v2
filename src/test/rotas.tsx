import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

/** Monta telas sob um roteador de memória: a URL e a navegação são as de verdade. */
export function montarEm(rotas: Record<string, ReactElement>, url: string) {
  const roteador = createMemoryRouter(
    Object.entries(rotas).map(([path, element]) => ({ path, element })),
    { initialEntries: [url] },
  );
  const { container } = render(<RouterProvider router={roteador} />);
  return { raiz: container, roteador, caminho: () => roteador.state.location.pathname };
}
