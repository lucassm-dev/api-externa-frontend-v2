import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarraDeMercado } from '../painel.model';
import { BarraMercado } from './barra-mercado';

describe('Barra de mercado', () => {
  let fixture: ComponentFixture<BarraMercado>;

  async function montar(barra: BarraDeMercado | null) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(BarraMercado);
    fixture.componentRef.setInput('barra', barra);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const cheia: BarraDeMercado = {
    itens: [
      { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.25, logoUrl: null },
      { simbolo: 'VALE3', nome: 'Vale', preco: 61.9, variacaoPercentual: -0.8, logoUrl: null },
    ],
    atualizadoEm: '2026-09-08T13:05:00',
    avisos: [],
  };

  it('@spec:AC-050 cada item traz símbolo, preço e variação, e a barra traz o horário do dado', async () => {
    const elemento = await montar(cheia);

    const petr = elemento.querySelector('[data-item="PETR4"]') as HTMLElement;
    expect(petr.querySelector('[data-simbolo]')?.textContent).toContain('PETR4');
    expect(petr.querySelector('[data-preco]')?.textContent).toContain('38,40');
    expect(petr.textContent).toContain('1,25%');

    expect(elemento.querySelector('[data-item="VALE3"]')?.textContent).toContain('0,80%');
    expect(elemento.querySelector('[data-atualizado-em]')?.textContent).toContain('13:05');
  });

  it('@spec:AC-050 item que a fonte não devolveu simplesmente não aparece', async () => {
    const elemento = await montar({ ...cheia, itens: [cheia.itens[0]] });

    expect(elemento.querySelectorAll('[data-item]')).toHaveLength(1);
    expect(elemento.querySelector('[data-item="VALE3"]')).toBeNull();
  });

  it('@spec:AC-052 o que faltou vira aviso, e nada na barra é apresentado como erro', async () => {
    const elemento = await montar({
      ...cheia,
      avisos: ['Não foi possível obter a cotação do dólar.'],
    });

    const aviso = elemento.querySelector('[data-aviso-mercado] [data-nivel]');
    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(aviso?.textContent).toContain('Não foi possível obter a cotação do dólar.');
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelector('[role="alert"]')).toBeNull();
  });

  it('@spec:AC-051 sem barra nenhuma o bloco não renderiza nada e não quebra', async () => {
    const elemento = await montar(null);

    expect(elemento.querySelector('[data-barra-mercado]')).toBeNull();
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
  });
});
