import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pagina } from '../../core/api/pagina';
import { CarteiraResumida } from './painel.model';
import { Painel } from './painel';

function pagina<T>(itens: T[], total = itens.length): Pagina<T> {
  return { content: itens, totalElements: total, totalPages: 1, number: 0, size: 20 };
}

function carteira(id: number, nome: string): CarteiraResumida {
  return {
    id,
    investidorId: 1,
    corretoraId: 1,
    nomeCorretora: 'XP',
    mercado: 'BR',
    moeda: 'BRL',
    nome,
    ativa: true,
  };
}

const BARRA = {
  itens: [
    { simbolo: 'PETR4', nome: 'Petrobras', preco: 38.4, variacaoPercentual: 1.2, logoUrl: null },
  ],
  atualizadoEm: new Date().toISOString(),
  avisos: [],
};

const CONSOLIDADO = {
  valorInvestido: 10_000,
  valorDeMercado: 11_000,
  lucroNaoRealizado: 1000,
  taxaCambioAtual: 5.4,
  dataHoraTaxaCambio: new Date().toISOString(),
  avisos: [],
};

describe('Painel inicial', () => {
  let fixture: ComponentFixture<Painel>;
  let controle: HttpTestingController;

  function abrir() {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Painel);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  async function responder(opcoes: {
    barraFalha?: boolean;
    temCorretora?: boolean;
    carteiras?: CarteiraResumida[];
    operacoes?: number;
  }) {
    const { barraFalha = false, temCorretora = true, carteiras = [], operacoes = 0 } = opcoes;

    const barra = controle.expectOne('/mercado/barra-cotacoes');
    if (barraFalha) {
      barra.flush(null, { status: 503, statusText: 'Service Unavailable' });
    } else {
      barra.flush(BARRA);
    }

    controle
      .expectOne((r) => r.url === '/corretoras')
      .flush(pagina(temCorretora ? [{ id: 1 }] : [], temCorretora ? 1 : 0));
    controle.expectOne((r) => r.url === '/carteiras').flush(pagina(carteiras));
    controle
      .expectOne((r) => r.url === '/operacoes')
      .flush(
        pagina(
          Array.from({ length: operacoes }, (_, i) => ({
            id: i + 1,
            dataHora: new Date().toISOString(),
            tipo: 'COMPRA',
          })),
        ),
      );

    if (carteiras.length > 0) {
      controle.expectOne(`/carteiras/${carteiras[0].id}/consolidado`).flush(CONSOLIDADO);
    }

    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => controle.verify());

  it('@spec:AC-065 enquanto as leituras não voltam a tela mostra esqueleto dos blocos, nunca um indicador de tela inteira', async () => {
    const elemento = abrir();

    expect(elemento.querySelector('[data-esqueleto-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-esqueleto-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelector('mat-spinner, mat-progress-spinner, [role="progressbar"]')).toBeNull();
    expect(elemento.querySelector('[data-proximo-passo]')).toBeNull();

    await responder({ carteiras: [carteira(9, 'Longo prazo')], operacoes: 3 });
    expect(elemento.querySelector('[data-esqueleto-carteiras]')).toBeNull();
  });

  it('@spec:AC-063 com corretora, carteira e operação o painel mostra consolidado, carteiras e movimentações, sem convite', async () => {
    const elemento = abrir();
    await responder({
      temCorretora: true,
      carteiras: [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')],
      operacoes: 3,
    });

    expect(elemento.querySelector('[data-proximo-passo]')).toBeNull();
    expect(elemento.querySelector('[data-consolidado]')).not.toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelectorAll('[data-movimentacao]')).toHaveLength(3);
  });

  it('@spec:AC-064 com um próximo passo ativo o convite ocupa o corpo da tela e a barra de mercado continua', async () => {
    const elemento = abrir();
    await responder({ temCorretora: false, carteiras: [], operacoes: 0 });

    expect(elemento.querySelector('[data-proximo-passo]')?.getAttribute('data-passo')).toBe(
      'cadastrar-corretora',
    );
    expect(elemento.querySelector('[data-consolidado]')).toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).toBeNull();
    expect(elemento.querySelector('[data-barra-mercado]')).not.toBeNull();
  });

  it('@spec:AC-051 barra de mercado fora do ar não derruba o painel', async () => {
    const elemento = abrir();
    await responder({
      barraFalha: true,
      carteiras: [carteira(9, 'Longo prazo')],
      operacoes: 2,
    });

    expect(elemento.querySelector('[data-barra-mercado]')).toBeNull();
    expect(elemento.querySelector('[data-consolidado]')).not.toBeNull();
    expect(elemento.querySelector('[data-carteiras]')).not.toBeNull();
    expect(elemento.querySelector('[data-movimentacoes]')).not.toBeNull();
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
  });

  it('@spec:AC-053 o consolidado é pedido só da carteira escolhida, uma por vez, sem somar nada', async () => {
    abrir();
    await responder({ carteiras: [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')], operacoes: 1 });

    // a segunda carteira não foi consolidada junto: nenhuma requisição pendente sobrou
    controle.verify();

    const seletor = fixture.nativeElement.querySelector(
      '[data-seletor-carteira]',
    ) as HTMLSelectElement;
    seletor.value = '4';
    seletor.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    controle.expectOne('/carteiras/4/consolidado').flush(CONSOLIDADO);
  });

  it('@spec:AC-054 a carteira escolhida numa visita é a consolidada na visita seguinte', async () => {
    abrir();
    await responder({ carteiras: [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')], operacoes: 1 });

    const seletor = fixture.nativeElement.querySelector(
      '[data-seletor-carteira]',
    ) as HTMLSelectElement;
    seletor.value = '4';
    seletor.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    controle.expectOne('/carteiras/4/consolidado').flush(CONSOLIDADO);

    // visita seguinte: o painel abre de novo, sem ninguém escolher nada
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Painel);
    fixture.detectChanges();

    controle.expectOne('/mercado/barra-cotacoes').flush(BARRA);
    controle.expectOne((r) => r.url === '/corretoras').flush(pagina([{ id: 1 }], 1));
    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush(pagina([carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')]));
    controle.expectOne((r) => r.url === '/operacoes').flush(pagina([]));

    controle.expectOne('/carteiras/4/consolidado').flush(CONSOLIDADO);
  });
});
