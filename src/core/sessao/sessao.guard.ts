import { redirect, type LoaderFunctionArgs } from 'react-router';
import { ROTA_INICIAL_ADMIN, ROTA_LOGIN } from './sessao.model';
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

/** Áreas de investidor: o ADMIN recebe 403 nelas, então nem chega a abrir (AC-315). */
export function exigirInvestidor(): null {
  if (sessao.papel() === 'ADMIN') throw redirect(ROTA_INICIAL_ADMIN);
  return null;
}

/** Painel administrativo: o investidor volta ao painel dele sem requisitar nada (AC-350). */
export function exigirPainelAdmin(): null {
  if (sessao.papel() !== 'ADMIN') throw redirect('/painel');
  return null;
}

/** Cadastrar corretora é só do ADMIN; o investidor volta à lista (AC-317). */
export function exigirAdmin(): null {
  if (sessao.papel() !== 'ADMIN') throw redirect('/corretoras');
  return null;
}
