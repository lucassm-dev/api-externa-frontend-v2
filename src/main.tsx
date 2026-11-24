import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from '@/app';
import { definirNavegacao } from '@/core/navegacao';
import { temaService } from '@/core/tema/tema.service';
import { rotas } from '@/rotas';
// As duas famílias dos tokens (--fonte, --fonte-numero), servidas pelo próprio app:
// sem elas o navegador caía na fonte do sistema. Só o subconjunto latino: o produto é
// pt-BR, e os demais alfabetos punham 57 @font-face (62 kB) no CSS inicial.
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/latin-600.css';
import '@fontsource/roboto/latin-700.css';
import '@fontsource/roboto/latin-800.css';
import '@fontsource/roboto-mono/latin-400.css';
import '@fontsource/roboto-mono/latin-700.css';
import './styles/global.css';

// O tema guardado é aplicado antes do primeiro desenho, como o provideAppInitializer.
temaService.tema();

const roteador = createBrowserRouter(rotas);
// O cliente HTTP navega pelo roteador ao encerrar a sessão (AUT-005/AUT-006).
definirNavegacao((url) => void roteador.navigate(url));

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App roteador={roteador} />
  </StrictMode>,
);
