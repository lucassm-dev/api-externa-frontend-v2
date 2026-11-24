import { CHAVE_TEMA, TemaService } from './tema.service';

describe('Tema', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-tema');
  });

  it('@spec:AC-022 a escolha de tema é aplicada ao documento e lembrada na volta', () => {
    const servico = new TemaService();
    servico.definir('escuro');

    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
    expect(localStorage.getItem(CHAVE_TEMA)).toBe('escuro');

    document.documentElement.removeAttribute('data-tema');
    const outraVisita = new TemaService();

    expect(outraVisita.tema()).toBe('escuro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('escuro');
  });

  it('@spec:AC-022 sem escolha guardada o tema claro é o ponto de partida', () => {
    const servico = new TemaService();

    expect(servico.tema()).toBe('claro');
    expect(document.documentElement.getAttribute('data-tema')).toBe('claro');
  });
});
