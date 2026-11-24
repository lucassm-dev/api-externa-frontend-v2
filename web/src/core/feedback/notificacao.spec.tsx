import { fireEvent, render, screen } from '@testing-library/react';
import { isValidElement, type ReactElement } from 'react';
import { toast } from 'sonner';
import { ConteudoNotificacao, notificacao } from './notificacao';

vi.mock('sonner', () => ({ toast: { custom: vi.fn(), dismiss: vi.fn() } }));

const abrir = vi.mocked(toast.custom);

function ultimaChamada() {
  const [fabrica, configuracao] = abrir.mock.calls.at(-1)!;
  const elemento = fabrica('id-1') as ReactElement<{ dados: unknown }>;
  expect(isValidElement(elemento)).toBe(true);
  return { dados: elemento.props.dados, configuracao };
}

describe('Notificação de feedback', () => {
  beforeEach(() => abrir.mockReset());

  it('@spec:AC-213 sucesso usa a mensagem comum e desaparece sozinho em cerca de cinco segundos', () => {
    notificacao.sucesso('Carteira criada.');

    const { dados, configuracao } = ultimaChamada();
    expect(configuracao?.duration).toBe(5000);
    expect(dados).toEqual({ nivel: 'sucesso', mensagem: 'Carteira criada.', codigo: null });
  });

  it('@spec:AC-214 erro conserva o código e não recebe duração automática', () => {
    notificacao.erro('Não foi possível registrar a operação.', 'OPE-409');

    const { dados, configuracao } = ultimaChamada();
    expect(dados).toEqual({ nivel: 'erro', mensagem: 'Não foi possível registrar a operação.', codigo: 'OPE-409' });
    // No sonner, "sem duração automática" é duração infinita: só sai quando dispensado.
    expect(configuracao?.duration).toBe(Number.POSITIVE_INFINITY);
  });

  it('@spec:AC-214 erro persistente oferece dispensa manual com nome acessível', () => {
    const dispensar = vi.fn();
    const { container } = render(
      <ConteudoNotificacao dados={{ nivel: 'erro', mensagem: 'Falhou.', codigo: 'SYS-001' }} aoDispensar={dispensar} />,
    );

    expect(container.querySelector('[data-nivel="erro"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar mensagem' }));
    expect(dispensar).toHaveBeenCalledOnce();
  });
});
