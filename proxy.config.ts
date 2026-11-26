import type { IncomingMessage } from 'node:http';

// Mesmas raízes do proxy.conf.json do Angular (AC-024, ASM-073): o navegador
// fala com a própria origem e o servidor de desenvolvimento encaminha ao backend.
export const RAIZES_DO_BACKEND = ['/auth', '/investidores', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/mercado', '/admin'];

export const BACKEND = 'http://localhost:8080';

/**
 * `/carteiras` é ao mesmo tempo tela e raiz da API. Recarregar a tela pede HTML
 * e deve receber o app; só as chamadas da API seguem para o backend. (No Angular
 * o recarregamento caía no backend.)
 */
export function ehNavegacaoDePagina(requisicao: Pick<IncomingMessage, 'headers'>): boolean {
  return requisicao.headers.accept?.includes('text/html') ?? false;
}

export const proxyDoBackend = Object.fromEntries(
  RAIZES_DO_BACKEND.map((raiz) => [
    raiz,
    {
      target: BACKEND,
      changeOrigin: true,
      secure: false,
      bypass: (requisicao: IncomingMessage) => (ehNavegacaoDePagina(requisicao) ? '/index.html' : undefined),
      // Como o `proxy_set_header Origin ""` do nginx: o navegador manda Origin em todo POST, e o
      // backend do docker-compose (perfil prod, CORS_ALLOWED_ORIGINS vazio) recusaria com 403.
      configure: (proxy: { on: (evento: 'proxyReq', ouvinte: (pedido: { removeHeader: (nome: string) => void }) => void) => void }) =>
        proxy.on('proxyReq', (pedido) => pedido.removeHeader('origin')),
    },
  ]),
);
