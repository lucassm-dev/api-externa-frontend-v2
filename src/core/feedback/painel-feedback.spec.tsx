import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { feedback } from './feedback.service';
import { PainelFeedback } from './painel-feedback';

const textos = () => [...document.querySelectorAll('[data-nivel]')].map((mensagem) => mensagem.textContent ?? '');

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  feedback.limpar();
  vi.useRealTimers();
});

describe('Duração das mensagens do painel', () => {
  it('@spec:AC-406 informação e aviso saem sozinhos em 5 segundos', () => {
    render(<PainelFeedback />);
    act(() => {
      feedback.informar('Operação removida do extrato.');
      feedback.avisar('O preço usado é de 15 minutos atrás.');
    });
    expect(textos()).toHaveLength(2);

    act(() => vi.advanceTimersByTime(4900));
    expect(textos()).toHaveLength(2);
    act(() => vi.advanceTimersByTime(100));
    expect(textos()).toEqual([]);
  });

  it('@spec:AC-407 erro continua no painel depois de 5 segundos', () => {
    render(<PainelFeedback />);
    act(() => feedback.errar('Não foi possível conectar ao sistema.', 'SYS-001'));

    act(() => vi.advanceTimersByTime(60_000));
    expect(textos().join()).toContain('Não foi possível conectar');
  });

  it('@spec:AC-408 o botão Dispensar mensagem tira a mensagem na hora', () => {
    render(<PainelFeedback />);
    act(() => {
      feedback.errar('Não foi possível conectar ao sistema.', 'SYS-001');
      feedback.informar('Carteira alterada.');
    });

    fireEvent.click(document.querySelectorAll('button[aria-label="Dispensar mensagem"]')[0]);
    expect(textos()).toHaveLength(1);
    expect(textos()[0]).toContain('Carteira alterada.');
  });
});
