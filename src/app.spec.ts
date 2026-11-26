import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { LOCALE_PADRAO, formatarMoeda } from '@/core/formatacao/formatacao';
import { BACKEND, RAIZES_DO_BACKEND, ehNavegacaoDePagina, proxyDoBackend } from '../proxy.config';

describe('Fundação da aplicação', () => {
  // ASM-073: o "servidor de desenvolvimento do Angular" do AC-024 passa a ser o do Vite.
  it('@spec:AC-024 o navegador enxerga a API na mesma origem, encaminhada para o backend', () => {
    const esperadas = ['/auth', '/investidores', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/mercado', '/admin'];
    expect([...RAIZES_DO_BACKEND].sort()).toEqual([...esperadas].sort());
    expect(BACKEND).toBe('http://localhost:8080');

    for (const raiz of esperadas) {
      expect(proxyDoBackend[raiz]?.target).toBe('http://localhost:8080');
      expect(proxyDoBackend[raiz]?.changeOrigin).toBe(true);
    }
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/proxy:\s*proxyDoBackend/);
  });

  it('@spec:AC-024 recarregar uma tela que divide o endereço com a API recebe o app, não o backend', () => {
    expect(ehNavegacaoDePagina({ headers: { accept: 'text/html,application/xhtml+xml' } })).toBe(true);
    expect(ehNavegacaoDePagina({ headers: { accept: 'application/json, text/plain, */*' } })).toBe(false);
    expect(ehNavegacaoDePagina({ headers: {} })).toBe(false);
  });

  it('@spec:AC-024 o proxy apaga o Origin antes do backend, como o nginx, para o CORS não recusar o POST', () => {
    for (const raiz of RAIZES_DO_BACKEND) {
      const proxy = new EventEmitter();
      const removidos: string[] = [];
      proxyDoBackend[raiz].configure?.(proxy as never);
      proxy.emit('proxyReq', { removeHeader: (nome: string) => removidos.push(nome) });
      expect(removidos, raiz).toContain('origin');
    }
    expect(readFileSync('nginx/padrao.conf.template', 'utf8')).toMatch(/proxy_set_header Origin "";/);
  });

  it('@spec:AC-024 o nginx de produção encaminha as mesmas raízes do Vite e entrega o app a quem pede HTML', () => {
    const nginx = readFileSync('nginx/padrao.conf.template', 'utf8');
    const [, lista = ''] = /location ~ \^\/\(([^)]+)\)\(\/\|\$\)/.exec(nginx) ?? [];
    expect(lista.split('|').map((raiz) => `/${raiz}`).sort()).toEqual([...RAIZES_DO_BACKEND].sort());
    // Recarregar uma tela que divide o endereço com a API: como o ehNavegacaoDePagina do Vite.
    expect(nginx).toMatch(/if \(\$http_accept ~\* "text\/html"\) \{\s*rewrite \^ \/index\.html last;\s*\}/);
  });

  it('@spec:AC-020 a aplicação registra pt-BR como idioma único, uma vez só', () => {
    expect(LOCALE_PADRAO).toBe('pt-BR');
    expect(readFileSync('index.html', 'utf8')).toMatch(/<html lang="pt-BR">/);
    expect(formatarMoeda(1, 'BRL')).toMatch(/R\$/);
  });
});
