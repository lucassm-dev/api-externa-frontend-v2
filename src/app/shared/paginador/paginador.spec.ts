import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paginador } from './paginador';

describe('Paginador', () => {
  let fixture: ComponentFixture<Paginador>;

  async function montar(pagina: number) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(Paginador);
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('totalPaginas', 14);
    fixture.componentRef.setInput('totalItens', 135);
    fixture.componentRef.setInput('itensPorPagina', 10);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-224 informa posição, faixa e desabilita os controles nos limites', async () => {
    let elemento = await montar(1);
    let anterior = elemento.querySelector('[data-anterior]') as HTMLButtonElement;
    let proxima = elemento.querySelector('[data-proxima]') as HTMLButtonElement;

    expect(elemento.querySelector('[data-pagina]')?.textContent).toContain('Página 1 de 14');
    expect(elemento.querySelector('[data-faixa]')?.textContent).toContain('1–10 de 135');
    expect(anterior.disabled).toBe(true);
    expect(proxima.disabled).toBe(false);

    elemento = await montar(14);
    anterior = elemento.querySelector('[data-anterior]') as HTMLButtonElement;
    proxima = elemento.querySelector('[data-proxima]') as HTMLButtonElement;
    expect(elemento.querySelector('[data-faixa]')?.textContent).toContain('131–135 de 135');
    expect(anterior.disabled).toBe(false);
    expect(proxima.disabled).toBe(true);
  });

  it('@spec:AC-224 emite a nova página apenas quando o avanço está disponível', async () => {
    const elemento = await montar(2);
    const paginas: number[] = [];
    fixture.componentInstance.paginaMudou.subscribe((pagina) => paginas.push(pagina));

    (elemento.querySelector('[data-anterior]') as HTMLButtonElement).click();
    (elemento.querySelector('[data-proxima]') as HTMLButtonElement).click();
    expect(paginas).toEqual([1, 3]);
  });
});
