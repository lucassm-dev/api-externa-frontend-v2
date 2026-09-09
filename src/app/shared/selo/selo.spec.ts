import { TestBed } from '@angular/core/testing';
import { Selo, VarianteSelo } from './selo';

describe('Selo de situação', () => {
  it('@spec:AC-222 todas as variantes comunicam por texto e símbolo além da cor', async () => {
    const variantes: VarianteSelo[] = ['alta', 'baixa', 'estavel', 'sucesso', 'aviso', 'erro'];
    const simbolos = new Set<string>();

    for (const variante of variantes) {
      TestBed.resetTestingModule();
      const fixture = TestBed.createComponent(Selo);
      fixture.componentRef.setInput('variante', variante);
      fixture.componentRef.setInput('texto', `Situação ${variante}`);
      await fixture.whenStable();

      const elemento = fixture.nativeElement.querySelector('[data-selo]') as HTMLElement;
      const icone = elemento.querySelector('svg[data-icone]');
      expect(elemento.textContent).toContain(`Situação ${variante}`);
      expect(icone?.getAttribute('aria-hidden')).toBe('true');
      expect(elemento.getAttribute('data-variante')).toBe(variante);
      simbolos.add(icone?.getAttribute('data-icone') ?? '');
    }

    expect(simbolos.has('')).toBe(false);
    expect(simbolos.size).toBe(6);
  });
});
