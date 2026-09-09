import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogoConfirmacao } from './dialogo-confirmacao';

describe('Diálogo de confirmação', () => {
  let fixture: ComponentFixture<DialogoConfirmacao>;

  async function montar() {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(DialogoConfirmacao);
    fixture.componentRef.setInput('titulo', 'Remover esta corretora?');
    fixture.componentRef.setInput(
      'consequencia',
      'A corretora sai do catálogo para todos os investidores.',
    );
    fixture.componentRef.setInput('rotuloConfirmar', 'Remover');
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-087 descreve a consequência e oferece exatamente dois botões', async () => {
    const elemento = await montar();

    expect(elemento.querySelector('[data-titulo]')?.textContent).toContain(
      'Remover esta corretora?',
    );
    expect(elemento.querySelector('[data-consequencia]')?.textContent).toContain(
      'A corretora sai do catálogo para todos os investidores.',
    );

    const botoes = elemento.querySelectorAll('button');
    expect(botoes.length).toBe(2);
    expect(elemento.querySelector('[data-confirmar]')?.textContent).toContain('Remover');
    expect(elemento.querySelector('[data-cancelar]')).toBeTruthy();
  });

  it('@spec:AC-087 não pede que o investidor digite o nome do que será removido', async () => {
    const elemento = await montar();

    expect(elemento.querySelectorAll('input').length).toBe(0);
    expect(elemento.querySelectorAll('textarea').length).toBe(0);
  });

  it('@spec:AC-087 cada botão avisa quem abriu o diálogo', async () => {
    const elemento = await montar();
    const componente = fixture.componentInstance;

    let confirmou = 0;
    let cancelou = 0;
    componente.confirmar.subscribe(() => confirmou++);
    componente.cancelar.subscribe(() => cancelou++);

    (elemento.querySelector('[data-confirmar]') as HTMLButtonElement).click();
    (elemento.querySelector('[data-cancelar]') as HTMLButtonElement).click();

    expect(confirmou).toBe(1);
    expect(cancelou).toBe(1);
  });
});
