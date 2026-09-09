import { readFileSync } from 'node:fs';
import { TestBed } from '@angular/core/testing';
import { BotaoIcone } from './botao-icone';

describe('Botão de ícone', () => {
  it('@spec:AC-216 exige e aplica um nome acessível enquanto oculta o ícone', async () => {
    const fixture = TestBed.createComponent(BotaoIcone);
    fixture.componentRef.setInput('rotulo', 'Editar operação');
    await fixture.whenStable();

    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('button')?.getAttribute('aria-label')).toBe('Editar operação');
    expect(elemento.querySelector('[data-icone]')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('@spec:AC-217 mantém área acionável de pelo menos 24 por 24 pixels', () => {
    const estilo = readFileSync('src/app/shared/botao-icone/botao-icone.scss', 'utf8');
    expect(estilo).toMatch(/min-width:\s*(?:2[4-9]|[3-9]\d)px/);
    expect(estilo).toMatch(/min-height:\s*(?:2[4-9]|[3-9]\d)px/);
  });

  it('@spec:AC-228 declara foco de teclado visível sem remover o contorno', () => {
    const estilo = readFileSync('src/app/shared/botao-icone/botao-icone.scss', 'utf8');
    const foco = estilo.match(/:focus-visible\s*{[^}]+}/s)?.[0] ?? '';
    expect(foco).toMatch(/outline:\s*[^;]*var\(--cor-acento\)/);
    expect(foco).not.toMatch(/outline:\s*(?:none|0)/);
  });
});
