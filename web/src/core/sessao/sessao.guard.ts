import { redirect, type LoaderFunctionArgs } from 'react-router';
import { ROTA_LOGIN } from './sessao.model';
import { sessao } from './sessao.service';

/**
 * Nenhuma tela interna renderiza sem sessão, nem por um instante: o loader
 * decide antes de a rota montar, como o canActivate do Angular.
 */
export function exigirSessao({ request }: LoaderFunctionArgs): null {
  if (sessao.ativa()) {
    return null;
  }

  sessao.encerrar();
  const { pathname, search } = new URL(request.url);
  throw redirect(`${ROTA_LOGIN}?${new URLSearchParams({ destino: `${pathname}${search}` })}`);
}
