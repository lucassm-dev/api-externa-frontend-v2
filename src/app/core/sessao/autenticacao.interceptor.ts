import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessaoService } from './sessao.service';

/** Toda requisição autenticada leva o token; sem sessão, nada é adicionado. */
export const autenticacaoInterceptor: HttpInterceptorFn = (requisicao, proxima) => {
  const token = inject(SessaoService).token();
  if (!token) {
    return proxima(requisicao);
  }
  return proxima(
    requisicao.clone({ setHeaders: { Authorization: `Bearer ${token}` } }),
  );
};
