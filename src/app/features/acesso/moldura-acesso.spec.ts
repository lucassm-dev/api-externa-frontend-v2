import { readFileSync } from 'node:fs';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MolduraAcesso } from './moldura-acesso';

@Component({
  imports: [MolduraAcesso],
  template: `
    <app-moldura-acesso>
      <form><input aria-label="Primeiro campo" /><button>Continuar</button></form>
    </app-moldura-acesso>
  `,
})
class HospedeDaMoldura {}

describe('Moldura das telas de acesso', () => {
  it('@spec:AC-251 separa o formulário da região de marca e limita a largura de leitura', async () => {
    const fixture = TestBed.createComponent(HospedeDaMoldura);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;

    expect(elemento.querySelector('[data-regiao-formulario] form')).not.toBeNull();
    expect(elemento.querySelector('[data-regiao-marca]')).not.toBeNull();

    const estilo = readFileSync('src/app/features/acesso/moldura-acesso.scss', 'utf8');
    expect(estilo).toMatch(/grid-template-columns:/);
    expect(estilo).toMatch(/width:\s*min\(100%,\s*440px\)/);
  });

  it('@spec:AC-252 mantém a marca fora da tabulação e deixa os controles no formulário', async () => {
    const fixture = TestBed.createComponent(HospedeDaMoldura);
    await fixture.whenStable();
    const elemento = fixture.nativeElement as HTMLElement;
    const marca = elemento.querySelector('[data-regiao-marca]') as HTMLElement;

    expect(marca.getAttribute('aria-hidden')).toBe('true');
    expect(marca.querySelectorAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
    expect(elemento.querySelector('[data-regiao-formulario] input')).not.toBeNull();
  });

  it('@spec:AC-253 desliga o movimento opcional e anima somente transformação e opacidade', () => {
    const estilo = readFileSync('src/app/features/acesso/moldura-acesso.scss', 'utf8');
    const animacoes = [...estilo.matchAll(/@keyframes[\s\S]*?\n}/g)].map(([bloco]) => bloco).join('\n');
    const movimentoReduzido = estilo.slice(estilo.indexOf('prefers-reduced-motion: reduce'));

    expect(movimentoReduzido).toMatch(/animation:\s*none/);
    expect(animacoes).toMatch(/transform:/);
    expect(animacoes).toMatch(/opacity:/);
    expect(animacoes).not.toMatch(/(?:width|height|left|right|top|bottom|margin|padding):/);
  });
});
