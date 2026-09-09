import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Monograma } from './monograma';

describe('Monograma do ativo', () => {
  async function montar(ticker: string, logoUrl: string | null = null): Promise<ComponentFixture<Monograma>> {
    TestBed.resetTestingModule();
    const fixture = TestBed.createComponent(Monograma);
    fixture.componentRef.setInput('ticker', ticker);
    fixture.componentRef.setInput('logoUrl', logoUrl);
    await fixture.whenStable();
    return fixture;
  }

  it('@spec:AC-218 usa as iniciais do ticker quando não há logo curado', async () => {
    const fixture = await montar('PETR4');
    const fallback = fixture.nativeElement.querySelector('[data-monograma]') as HTMLElement;

    expect(fallback.textContent?.trim()).toBe('PE');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('@spec:AC-219 deriva uma cor de série estável para o mesmo ticker', async () => {
    const primeiro = (await montar('PETR4')).nativeElement.querySelector('[data-monograma]') as HTMLElement;
    const segundo = (await montar('petr4')).nativeElement.querySelector('[data-monograma]') as HTMLElement;

    expect(primeiro.getAttribute('data-serie')).toBe(segundo.getAttribute('data-serie'));
    expect(primeiro.style.getPropertyValue('--cor-monograma')).toMatch(/^var\(--cor-serie-[1-8]\)$/);
  });

  it('@spec:AC-220 anuncia o ticker no fallback e no logo curado', async () => {
    const fallback = (await montar('VALE3')).nativeElement.querySelector('[data-monograma]') as HTMLElement;
    expect(fallback.getAttribute('role')).toBe('img');
    expect(fallback.getAttribute('aria-label')).toContain('VALE3');

    const comLogo = await montar('VALE3', '/ativos/VALE3.svg');
    const imagem = comLogo.nativeElement.querySelector('img') as HTMLImageElement;
    expect(imagem.alt).toContain('VALE3');
  });
});
