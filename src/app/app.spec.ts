import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { appConfig } from './app.config';

describe('Fundação da aplicação', () => {
  it('@spec:AC-024 o navegador enxerga a API na mesma origem, encaminhada para o backend', () => {
    const proxy = JSON.parse(readFileSync('proxy.conf.json', 'utf8')) as Array<{
      context: string[];
      target: string;
      changeOrigin: boolean;
    }>;

    const raizes = proxy.flatMap((regra) => regra.context);
    const esperadas = ['/auth', '/investidores', '/corretoras', '/carteiras', '/acoes', '/operacoes', '/mercado'];

    for (const raiz of esperadas) {
      expect(raizes).toContain(raiz);
    }
    for (const regra of proxy) {
      expect(regra.target).toBe('http://localhost:8080');
      expect(regra.changeOrigin).toBe(true);
    }
  });

  it('@spec:AC-020 a aplicação registra pt-BR como idioma único, uma vez só', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    expect(TestBed.inject(LOCALE_ID)).toBe('pt-BR');
  });
});
