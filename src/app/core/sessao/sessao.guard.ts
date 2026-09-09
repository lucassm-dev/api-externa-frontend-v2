import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROTA_LOGIN } from './sessao.model';
import { SessaoService } from './sessao.service';

/**
 * Nenhuma tela interna renderiza sem sessão, nem por um instante: a guarda
 * decide antes de a rota ativar.
 */
export const sessaoGuard: CanActivateFn = (_rota, estado) => {
  const sessao = inject(SessaoService);
  const router = inject(Router);

  if (sessao.ativa()) {
    return true;
  }

  sessao.encerrar();
  return router.createUrlTree([ROTA_LOGIN], {
    queryParams: { destino: estado.url },
  });
};
