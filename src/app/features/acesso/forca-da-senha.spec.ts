import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ForcaDaSenha } from './forca-da-senha';
import { senhaValidator } from './validadores';

describe('Medidor da força da senha', () => {
  it('@spec:AC-255 concorda com o validador real para senhas aceitas e recusadas', async () => {
    for (const senha of ['', 'abc', 'abcdefgh', '12345678', 'abc123', 'segura123']) {
      TestBed.resetTestingModule();
      const fixture = TestBed.createComponent(ForcaDaSenha);
      fixture.componentRef.setInput('senha', senha);
      await fixture.whenStable();

      const medidor = fixture.nativeElement.querySelector('[data-forca-senha]') as HTMLElement;
      const aceitaNoFormulario = senhaValidator(new FormControl(senha)) === null;
      expect(medidor.getAttribute('data-aceitavel')).toBe(String(aceitaNoFormulario));
    }
  });

  it('@spec:AC-255 mostra por texto e preenchimento o progresso nos três requisitos', async () => {
    const fixture = TestBed.createComponent(ForcaDaSenha);
    fixture.componentRef.setInput('senha', 'abcdefg1');
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelectorAll('[data-requisito]')).toHaveLength(3);
    expect(elemento.textContent).toMatch(/8 ou mais caracteres.*atendido/i);
    expect(elemento.textContent).toMatch(/ao menos uma letra.*atendido/i);
    expect(elemento.textContent).toMatch(/ao menos um número.*atendido/i);
    expect((elemento.querySelector('.preenchimento') as HTMLElement).style.width).toBe('100%');
  });
});
