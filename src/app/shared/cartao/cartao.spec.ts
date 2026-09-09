import { TestBed } from '@angular/core/testing';
import { Cartao } from './cartao';

describe('Cartão', () => {
  it('@spec:AC-225 agrupa título e conteúdo numa estrutura de seção previsível', async () => {
    const fixture = TestBed.createComponent(Cartao);
    fixture.componentRef.setInput('titulo', 'Resumo da carteira');
    fixture.componentRef.setInput('apoio', 'Atualizado às 11:45');
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    const titulo = elemento.querySelector('[data-cartao-titulo]');
    const conteudo = elemento.querySelector('[data-cartao-conteudo]');

    expect(titulo?.tagName).toBe('H2');
    expect(titulo?.textContent).toContain('Resumo da carteira');
    expect(elemento.querySelector('[data-cartao-apoio]')?.textContent).toContain('Atualizado às 11:45');
    expect(conteudo?.getAttribute('role')).toBe('region');
    expect(conteudo?.getAttribute('aria-labelledby')).toBe(titulo?.id);
    expect(elemento.querySelector('[data-cartao-acoes]')).toBeTruthy();
  });
});
