import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ROTA_LOGIN } from '../sessao/sessao.model';
import { SessaoService } from '../sessao/sessao.service';
import { traduzirErro } from './tradutor-erro';

/**
 * Traduz todo erro de API uma vez só, e encerra a sessão quando o código diz
 * que ela acabou (AUT-005, AUT-006). As telas recebem o erro já traduzido.
 */
export const erroInterceptor: HttpInterceptorFn = (requisicao, proxima) => {
  const sessao = inject(SessaoService);
  const router = inject(Router);

  return proxima(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      const traduzido = traduzirErro(erro);

      if (traduzido.encerraSessao) {
        sessao.encerrar();
        router.navigateByUrl(`${ROTA_LOGIN}?motivo=${traduzido.codigo}`);
      }

      return throwError(() => traduzido);
    }),
  );
};
