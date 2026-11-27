import { Navigate, useRouteError, type RouteObject } from 'react-router';
import { MENSAGEM_GENERICA } from '@/core/erros/catalogo-erros';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { exigirAdmin, exigirInvestidor, exigirPainelAdmin, exigirSessao } from '@/core/sessao/sessao.guard';
import { visitante } from '@/features/acesso/visitante';
import { Casca } from '@/layout/casca';

/** Falha inesperada de renderização: a mensagem genérica do catálogo, nunca a pilha. */
function ErroGeral() {
  useRouteError();
  return (
    <div className="p-5">
      <MensagemFeedback nivel="erro" mensagem={MENSAGEM_GENERICA} />
    </div>
  );
}

/**
 * Mesma tabela do app.routes.ts. Sem sessão só existem login, cadastro e esqueci a senha; tudo
 * o que fica sob a casca passa pela guarda e não renderiza sem sessão válida.
 */
export const rotas: RouteObject[] = [
  {
    errorElement: <ErroGeral />,
    // Enquanto a primeira tela preguiçosa carrega: o fundo do produto, sem piscar em branco.
    hydrateFallbackElement: <div aria-busy="true" className="min-h-dvh bg-fundo" />,
    children: [
      { index: true, element: <Navigate to="/painel" replace /> },
      {
        path: 'entrar',
        loader: visitante,
        lazy: async () => ({ Component: (await import('@/features/acesso/login')).Login }),
      },
      {
        path: 'criar-conta',
        loader: visitante,
        lazy: async () => ({ Component: (await import('@/features/acesso/cadastro')).Cadastro }),
      },
      {
        path: 'esqueci-senha',
        loader: visitante,
        lazy: async () => ({ Component: (await import('@/features/acesso/esqueci-senha')).EsqueciSenha }),
      },
      {
        loader: exigirSessao,
        element: <Casca />,
        children: [
          { path: 'admin/usuarios', loader: exigirPainelAdmin, lazy: async () => ({ Component: (await import('@/features/admin/usuarios')).Usuarios }) },
          { path: 'admin/uso', loader: exigirPainelAdmin, lazy: async () => ({ Component: (await import('@/features/admin/uso')).Uso }) },
          { path: 'admin/usuarios/novo', loader: exigirPainelAdmin, lazy: async () => ({ Component: (await import('@/features/admin/novo-admin')).NovoAdmin }) },
          { path: 'conta', lazy: async () => ({ Component: (await import('@/features/conta/minha-conta')).Conta }) },
          { path: 'painel', loader: exigirInvestidor, lazy: async () => ({ Component: (await import('@/features/painel/painel')).Painel }) },
          {
            path: 'corretoras',
            children: [
              { index: true, lazy: async () => ({ Component: (await import('@/features/corretoras/lista-corretoras')).ListaCorretoras }) },
              { path: 'nova', loader: exigirAdmin, lazy: async () => ({ Component: (await import('@/features/corretoras/cadastro-corretora')).CadastroCorretora }) },
              { path: ':id', lazy: async () => ({ Component: (await import('@/features/corretoras/detalhe-corretora')).DetalheCorretora }) },
            ],
          },
          {
            path: 'carteiras',
            loader: exigirInvestidor,
            children: [
              { index: true, lazy: async () => ({ Component: (await import('@/features/carteiras/lista-carteiras')).ListaCarteiras }) },
              { path: 'nova', lazy: async () => ({ Component: (await import('@/features/carteiras/criar-carteira')).CriarCarteira }) },
              { path: ':id', lazy: async () => ({ Component: (await import('@/features/carteiras/detalhe-carteira')).DetalheCarteira }) },
            ],
          },
          {
            path: 'acoes',
            children: [
              { index: true, lazy: async () => ({ Component: (await import('@/features/acoes/lista-acoes')).ListaAcoes }) },
              { path: 'nova', lazy: async () => ({ Component: (await import('@/features/acoes/cadastro-acao')).CadastroAcao }) },
              { path: ':ticker', lazy: async () => ({ Component: (await import('@/features/acoes/detalhe-acao')).DetalheAcao }) },
            ],
          },
          { path: 'operacoes', loader: exigirInvestidor, lazy: async () => ({ Component: (await import('@/features/operacoes/operacoes')).Operacoes }) },
          { path: 'relatorios', loader: exigirInvestidor, lazy: async () => ({ Component: (await import('@/features/relatorios/relatorios')).Relatorios }) },
          { path: 'desempenho', loader: exigirInvestidor, lazy: async () => ({ Component: (await import('@/features/desempenho/desempenho')).Desempenho }) },
        ],
      },
      { path: '*', element: <Navigate to="/entrar" replace /> },
    ],
  },
];
