import { lazy, Suspense } from 'react';
import { RouterProvider, type createBrowserRouter } from 'react-router';
import { PainelFeedback } from '@/core/feedback/painel-feedback';

// Fora do bundle inicial: nenhuma tela abre aviso flutuante no primeiro carregamento (#60).
const Toaster = lazy(() => import('sonner').then((modulo) => ({ default: modulo.Toaster })));

/** A raiz, como o app.ts do Angular: as rotas, a fila de mensagens e os avisos flutuantes. */
export function App({ roteador }: { roteador: ReturnType<typeof createBrowserRouter> }) {
  return (
    <>
      <RouterProvider router={roteador} />
      <PainelFeedback />
      <Suspense fallback={null}>
        <Toaster position="top-right" />
      </Suspense>
    </>
  );
}
