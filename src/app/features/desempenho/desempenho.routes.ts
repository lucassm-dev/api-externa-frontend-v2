import { Routes } from '@angular/router';

/** Uma tela só: a última área do produto a sair da construção (Q-008). */
export const ROTAS_DESEMPENHO: Routes = [
  {
    path: '',
    loadComponent: () => import('./desempenho').then((m) => m.Desempenho),
  },
];
