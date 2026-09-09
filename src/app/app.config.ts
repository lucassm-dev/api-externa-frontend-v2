import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { erroInterceptor } from './core/erros/erro.interceptor';
import { autenticacaoInterceptor } from './core/sessao/autenticacao.interceptor';
import { LOCALE_PADRAO } from './core/formatacao/formatacao';
import { TemaService } from './core/tema/tema.service';

// Idioma único do produto (PRD-001): pt-BR configurado uma vez, aqui.
registerLocaleData(localePt, LOCALE_PADRAO);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimationsAsync(),
    // A ordem importa: o token entra na requisição antes de o erro ser traduzido.
    provideHttpClient(withInterceptors([autenticacaoInterceptor, erroInterceptor])),
    { provide: LOCALE_ID, useValue: LOCALE_PADRAO },
    provideAppInitializer(() => {
      inject(TemaService);
    }),
  ],
};
