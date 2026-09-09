import { Routes } from '@angular/router';
import { visitanteGuard } from './visitante.guard';

/** As duas únicas telas que existem sem sessão (PRD-002). */
export const ROTAS_ACESSO: Routes = [
  {
    path: 'entrar',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./login/login').then((m) => m.Login),
  },
  {
    path: 'criar-conta',
    canActivate: [visitanteGuard],
    loadComponent: () => import('./cadastro/cadastro').then((m) => m.Cadastro),
  },
];
