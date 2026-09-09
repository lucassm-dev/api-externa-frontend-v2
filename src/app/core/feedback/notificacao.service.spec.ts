import { TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { ConteudoNotificacao, NotificacaoService } from './notificacao.service';

describe('Notificação de feedback', () => {
  const abrir = vi.fn();

  function servico(): NotificacaoService {
    abrir.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: { openFromComponent: abrir } }] });
    return TestBed.inject(NotificacaoService);
  }

  it('@spec:AC-213 sucesso usa a mensagem comum e desaparece sozinho em cerca de cinco segundos', () => {
    servico().sucesso('Carteira criada.');

    expect(abrir).toHaveBeenCalledWith(
      ConteudoNotificacao,
      expect.objectContaining({
        duration: 5000,
        data: { nivel: 'sucesso', mensagem: 'Carteira criada.', codigo: null },
      }),
    );
  });

  it('@spec:AC-214 erro conserva o código e não recebe duração automática', () => {
    servico().erro('Não foi possível registrar a operação.', 'OPE-409');

    const configuracao = abrir.mock.calls[0][1];
    expect(configuracao.data).toEqual({
      nivel: 'erro',
      mensagem: 'Não foi possível registrar a operação.',
      codigo: 'OPE-409',
    });
    expect(configuracao.duration).toBeUndefined();
  });

  it('@spec:AC-214 erro persistente oferece dispensa manual com nome acessível', async () => {
    const dispensar = vi.fn();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: { nivel: 'erro', mensagem: 'Falhou.', codigo: 'SYS-001' } },
        { provide: MatSnackBarRef, useValue: { dismiss: dispensar } },
      ],
    });
    const fixture = TestBed.createComponent(ConteudoNotificacao);
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('app-mensagem-feedback')).toBeTruthy();
    const botao = elemento.querySelector('button[aria-label="Dispensar mensagem"]') as HTMLButtonElement;
    botao.click();
    expect(dispensar).toHaveBeenCalledOnce();
  });
});
