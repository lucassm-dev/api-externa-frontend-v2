import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { decidirProximoPasso } from '../proximo-passo';
import { ConviteProximoPasso } from './convite-proximo-passo';

describe('Convite do próximo passo', () => {
  let fixture: ComponentFixture<ConviteProximoPasso>;

  async function montar(estado: {
    catalogoTemCorretora: boolean;
    temCarteira: boolean;
    temOperacao: boolean;
  }) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(ConviteProximoPasso);
    fixture.componentRef.setInput('passo', decidirProximoPasso(estado));
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-060 sem corretora no catálogo o convite é cadastrar corretora, com o atalho', async () => {
    const elemento = await montar({
      catalogoTemCorretora: false,
      temCarteira: false,
      temOperacao: false,
    });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe(
      'cadastrar-corretora',
    );
    expect(elemento.querySelector('[data-titulo]')?.textContent).toContain('corretora');
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/corretoras');
  });

  it('@spec:AC-061 com corretora e sem carteira o convite é criar carteira', async () => {
    const elemento = await montar({
      catalogoTemCorretora: true,
      temCarteira: false,
      temOperacao: false,
    });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe(
      'criar-carteira',
    );
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/carteiras');
  });

  it('@spec:AC-062 com carteira e sem operação o convite é registrar a primeira compra', async () => {
    const elemento = await montar({
      catalogoTemCorretora: true,
      temCarteira: true,
      temOperacao: false,
    });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe(
      'registrar-compra',
    );
    expect(elemento.querySelector('[data-acao]')?.getAttribute('href')).toBe('/operacoes');
  });

  it('@spec:AC-064 o convite é um só, nunca uma lista de pendências', async () => {
    const elemento = await montar({
      catalogoTemCorretora: false,
      temCarteira: false,
      temOperacao: false,
    });

    expect(elemento.querySelectorAll('[data-proximo-passo]')).toHaveLength(1);
    expect(elemento.querySelectorAll('[data-acao]')).toHaveLength(1);
  });
});
