import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CarteiraResumida } from '../painel.model';
import { CarteirasDoInvestidor } from './carteiras-do-investidor';

function carteira(id: number, nome: string, nomeCorretora: string): CarteiraResumida {
  return {
    id,
    investidorId: 1,
    corretoraId: 1,
    nomeCorretora,
    mercado: 'BR',
    moeda: 'BRL',
    nome,
    ativa: true,
  };
}

describe('Cartões das carteiras', () => {
  let fixture: ComponentFixture<CarteirasDoInvestidor>;

  async function montar(carteiras: CarteiraResumida[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(CarteirasDoInvestidor);
    fixture.componentRef.setInput('carteiras', carteiras);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-057 os cartões saem na ordem recebida, da mais recente para a mais antiga', async () => {
    const elemento = await montar([
      carteira(9, 'Longo prazo', 'XP'),
      carteira(4, 'Dividendos', 'Rico'),
      carteira(2, 'Primeira', 'Clear'),
    ]);

    const ordem = [...elemento.querySelectorAll('[data-carteira]')].map((cartao) =>
      cartao.getAttribute('data-carteira'),
    );
    expect(ordem).toEqual(['9', '4', '2']);
  });

  it('@spec:AC-058 cada cartão traz nome, corretora e o atalho que abre aquela carteira', async () => {
    const elemento = await montar([carteira(9, 'Longo prazo', 'XP')]);

    const cartao = elemento.querySelector('[data-carteira="9"]') as HTMLElement;
    expect(cartao.querySelector('[data-nome]')?.textContent).toContain('Longo prazo');
    expect(cartao.querySelector('[data-corretora]')?.textContent).toContain('XP');
    expect(cartao.querySelector('[data-abrir]')?.getAttribute('href')).toBe('/carteiras/9');
  });
});
