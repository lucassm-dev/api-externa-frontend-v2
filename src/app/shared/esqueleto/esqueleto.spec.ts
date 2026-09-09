import { readFileSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { Esqueleto } from './esqueleto';

describe('Esqueleto de carregamento', () => {
  it('@spec:AC-221 expõe formatos com silhuetas distintas e fica oculto da árvore acessível', async () => {
    for (const formato of ['linha', 'bloco', 'tabela'] as const) {
      TestBed.resetTestingModule();
      const fixture = TestBed.createComponent(Esqueleto);
      fixture.componentRef.setInput('formato', formato);
      await fixture.whenStable();

      const elemento = fixture.nativeElement.querySelector('[data-esqueleto]') as HTMLElement;
      expect(elemento.getAttribute('data-formato')).toBe(formato);
      expect(elemento.getAttribute('aria-hidden')).toBe('true');
      expect(elemento.querySelectorAll('[data-linha]').length).toBe(formato === 'tabela' ? 5 : 1);
    }
  });

  it('@spec:AC-229 desliga a animação quando o sistema pede movimento reduzido', () => {
    const estilo = readFileSync('src/app/shared/esqueleto/esqueleto.scss', 'utf8');
    expect(estilo).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(estilo).toMatch(/animation:\s*none/);
  });

  it('@spec:AC-230 anima somente transform e opacity, sem propriedades de layout', () => {
    const estilo = readFileSync('src/app/shared/esqueleto/esqueleto.scss', 'utf8');
    const animacao = estilo.match(/@keyframes[\s\S]*?\n}/)?.[0] ?? '';
    expect(animacao).toMatch(/transform:/);
    expect(animacao).toMatch(/opacity:/);
    expect(animacao).not.toMatch(/(?:width|height|left|right|top|bottom|margin|padding):/);
  });
});
