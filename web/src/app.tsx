import { RouterProvider, type createBrowserRouter } from 'react-router';
import { Toaster } from 'sonner';
import { PainelFeedback } from '@/core/feedback/painel-feedback';

/** A raiz, como o app.ts do Angular: as rotas, a fila de mensagens e os avisos flutuantes. */
export function App({ roteador }: { roteador: ReturnType<typeof createBrowserRouter> }) {
  return (
    <>
      <RouterProvider router={roteador} />
      <PainelFeedback />
      <Toaster position="top-right" />
    </>
  );
}
