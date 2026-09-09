import { Routes } from '@angular/router';

/**
 * Uma tela só (Q-019): `/operacoes` é ao mesmo tempo onde se registra e onde se
 * lê o extrato. É o endereço que os links já existentes usam — o do detalhe da
 * carteira, com `?carteira=&tipo=`, e o "ver o extrato completo".
 */
export const ROTAS_OPERACOES: Routes = [
  {
    path: '',
    loadComponent: () => import('./operacoes').then((m) => m.Operacoes),
  },
];
