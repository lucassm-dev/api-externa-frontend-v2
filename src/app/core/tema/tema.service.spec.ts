import { TestBed } from '@angular/core/testing';
import { CHAVE_TEMA, TemaService } from './tema.service';

describe('Tema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
    TestBed.resetTestingModule();
  });

  it('@spec:AC-022 a escolha de tema é aplicada ao documento e lembrada na volta', () => {
    const servico = TestBed.inject(TemaService);
    servico.definir('escuro');

    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro');

    document.documentElement.removeAttribute('data-tema');
    TestBed.resetTestingModule();
    const outraVisita = TestBed.inject(TemaService);

    expect(outraVisita.tema()).toBe('escuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
  });

  it('@spec:AC-022 sem escolha guardada o tema claro é o ponto de partida', () => {
    const servico = TestBed.inject(TemaService);

    expect(servico.tema()).toBe('claro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
  });
});
