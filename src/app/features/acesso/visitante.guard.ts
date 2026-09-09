import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessaoService } from '../../core/sessao/sessao.service';
import { ROTA_AREA_INTERNA } from './acesso.model';

/** Login e cadastro só existem para quem ainda não entrou. */
export const visitanteGuard: CanActivateFn = () => {
  const sessao = inject(SessaoService);
  return sessao.ativa() ? inject(Router).createUrlTree([ROTA_AREA_INTERNA]) : true;
};
