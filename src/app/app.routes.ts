import { Routes } from '@angular/router';
import { sessaoGuard } from './core/sessao/sessao.guard';
import { ROTAS_ACESSO } from './features/acesso/acesso.routes';
import { ROTAS_ACOES } from './features/acoes/acoes.routes';
import { ROTAS_CARTEIRAS } from './features/carteiras/carteiras.routes';
import { ROTAS_CORRETORAS } from './features/corretoras/corretoras.routes';
import { ROTAS_DESEMPENHO } from './features/desempenho/desempenho.routes';
import { ROTAS_OPERACOES } from './features/operacoes/operacoes.routes';

/**
 * Sem sessão só existem login e cadastro. Tudo o que fica sob a casca passa
 * pela guarda e não renderiza sem sessão válida, nem por um instante.
 *
 * Todas as seis áreas têm tela própria: o destino mínimo de área em construção
 * saiu com o desempenho, a última delas (Q-008).
 */

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'painel' },
  ...ROTAS_ACESSO,
  {
    path: '',
    canActivate: [sessaoGuard],
    loadComponent: () => import('./layout/casca').then((m) => m.Casca),
    children: [
      {
        path: 'painel',
        loadComponent: () => import('./features/painel/painel').then((m) => m.Painel),
      },
      { path: 'corretoras', children: ROTAS_CORRETORAS },
      { path: 'carteiras', children: ROTAS_CARTEIRAS },
      { path: 'acoes', children: ROTAS_ACOES },
      { path: 'operacoes', children: ROTAS_OPERACOES },
      { path: 'desempenho', children: ROTAS_DESEMPENHO },
    ],
  },
  { path: '**', redirectTo: 'entrar' },
];
