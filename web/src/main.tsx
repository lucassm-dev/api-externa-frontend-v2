import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from '@/app';
import { definirNavegacao } from '@/core/navegacao';
import { temaService } from '@/core/tema/tema.service';
import { rotas } from '@/rotas';
// As duas famílias dos tokens (--fonte, --fonte-numero), servidas pelo próprio app:
// sem elas o navegador caía na fonte do sistema. Cada peso só baixa os glifos usados.
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/600.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto/800.css';
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
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
