import { redirect } from 'react-router';
import { sessao } from '@/core/sessao/sessao.service';
import { ROTA_AREA_INTERNA } from './acesso.model';

/** Login e cadastro só existem para quem ainda não entrou. */
export function visitante(): null {
  if (sessao.ativa()) {
    throw redirect(ROTA_AREA_INTERNA);
  }
  return null;
}
