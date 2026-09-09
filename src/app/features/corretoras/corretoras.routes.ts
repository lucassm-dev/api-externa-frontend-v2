import { Routes } from '@angular/router';

/** As três telas do catálogo. `nova` vem antes de `:id` para não virar detalhe. */
export const ROTAS_CORRETORAS: Routes = [
  {
    path: '',
    loadComponent: () => import('./lista/lista-corretoras').then((m) => m.ListaCorretoras),
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./cadastro/cadastro-corretora').then((m) => m.CadastroCorretora),
  },
  {
    path: ':id',
    loadComponent: () => import('./detalhe/detalhe-corretora').then((m) => m.DetalheCorretora),
  },
];
