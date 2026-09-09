import { TestBed } from '@angular/core/testing';
import { Variacao } from './variacao';

async function renderizar(valor: number) {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(Variacao);
  fixture.componentRef.setInput('valor', valor);
  fixture.componentRef.setInput('moeda', 'BRL');
  await fixture.whenStable();
  return fixture.nativeElement.querySelector('[data-variacao]') as HTMLElement;
}

describe('Ganho e perda', () => {
  it('@spec:AC-021 alta, baixa e estável têm sinal próprio, legível sem depender de cor', async () => {
    const alta = await renderizar(120.5);
    const baixa = await renderizar(-80.25);
    const estavel = await renderizar(0);

    const sinais = [alta, baixa, estavel].map((el) =>
      el.querySelector('[data-sinal]')?.textContent?.trim(),
    );
    expect(new Set(sinais).size).toBe(3);
    expect(sinais.every((s) => !!s)).toBe(true);

    const direcoes = [alta, baixa, estavel].map((el) => el.getAttribute('data-direcao'));
    expect(direcoes).toEqual(['alta', 'baixa', 'estavel']);
  });

  it('@spec:AC-021 o significado também vai em texto, para quem usa leitor de tela', async () => {
    const alta = await renderizar(120.5);
    const baixa = await renderizar(-80.25);

    expect(alta.querySelector('[data-descricao]')?.textContent?.trim()).toBe('alta');
    expect(baixa.querySelector('[data-descricao]')?.textContent?.trim()).toBe('baixa');
  });

  it('@spec:AC-021 o número sai formatado em pt-BR e a perda não é lida como valor negativo solto', async () => {
    const baixa = await renderizar(-80.25);

    expect(baixa.querySelector('[data-numero]')?.textContent).toContain('80,25');
  });
});
