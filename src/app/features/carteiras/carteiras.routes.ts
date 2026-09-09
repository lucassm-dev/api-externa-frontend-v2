import { Routes } from '@angular/router';

/** As três telas da área. `nova` vem antes de `:id` para não virar detalhe. */
export const ROTAS_CARTEIRAS: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista/lista-carteiras').then((m) => m.ListaCarteiras),
  },
  {
    path: 'nova',
    loadComponent: () => import('./criacao/criar-carteira').then((m) => m.CriarCarteira),
  },
  {
    path: ':id',
    loadComponent: () => import('./detalhe/detalhe-carteira').then((m) => m.DetalheCarteira),
  },
];
