import { Routes } from '@angular/router';

/** As três telas do catálogo. `nova` vem antes de `:ticker` para não virar detalhe. */
export const ROTAS_ACOES: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista/lista-acoes').then((m) => m.ListaAcoes),
  },
  {
    path: 'nova',
    loadComponent: () => import('./cadastro/cadastro-acao').then((m) => m.CadastroAcao),
  },
  {
    path: ':ticker',
    loadComponent: () => import('./detalhe/detalhe-acao').then((m) => m.DetalheAcao),
  },
];
