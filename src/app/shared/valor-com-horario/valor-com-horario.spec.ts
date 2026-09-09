import { TestBed } from '@angular/core/testing';
import { LIMITE_DEFASAGEM_MINUTOS, estaDefasado, idadeEmMinutos } from '../../core/dados/idade-dado';
import { ValorComHorario } from './valor-com-horario';

const AGORA = new Date();
const minutosAtras = (minutos: number, segundos = 0) =>
  new Date(AGORA.getTime() - minutos * 60_000 - segundos * 1_000);

async function renderizar(obtidoEm: Date) {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(ValorComHorario);
  fixture.componentRef.setInput('valor', 32.15);
  fixture.componentRef.setInput('moeda', 'BRL');
  fixture.componentRef.setInput('obtidoEm', obtidoEm);
  await fixture.whenStable();
  return fixture.nativeElement.querySelector('[data-valor-com-horario]') as HTMLElement;
}

describe('Valor com horário de obtenção', () => {
  it('@spec:AC-008 o valor nunca aparece sozinho: vem com o momento em que foi obtido', async () => {
    const elemento = await renderizar(minutosAtras(2));

    expect(elemento.querySelector('[data-numero]')?.textContent).toContain('32,15');
    expect(elemento.querySelector('[data-numero]')?.textContent).toContain('R$');
    expect(elemento.querySelector('[data-horario]')?.textContent?.trim()).toBeTruthy();
    expect(elemento.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-009 passados 15 minutos o dado ganha marcação, além do horário em texto', async () => {
    const recente = await renderizar(minutosAtras(2));
    const velho = await renderizar(minutosAtras(40));

    expect(recente.getAttribute('data-defasado')).toBe('false');
    expect(velho.getAttribute('data-defasado')).toBe('true');
    expect(velho.querySelector('[data-marcacao-defasado]')?.textContent?.trim()).toBeTruthy();
    expect(recente.querySelector('[data-marcacao-defasado]')).toBeNull();
  });

  it('@spec:AC-010 o limite de 15 minutos é exato', () => {
    expect(LIMITE_DEFASAGEM_MINUTOS).toBe(15);
    expect(estaDefasado(minutosAtras(15), AGORA)).toBe(false);
    expect(estaDefasado(minutosAtras(15, 1), AGORA)).toBe(true);
    expect(estaDefasado(minutosAtras(0), AGORA)).toBe(false);
  });

  it('@spec:AC-010 a idade é contada em minutos a partir do momento de obtenção', () => {
    expect(idadeEmMinutos(minutosAtras(0), AGORA)).toBe(0);
    expect(idadeEmMinutos(minutosAtras(90), AGORA)).toBe(90);
    expect(idadeEmMinutos(new Date(AGORA.getTime() + 60_000), AGORA)).toBe(0);
  });
});
