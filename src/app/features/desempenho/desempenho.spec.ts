import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Pagina } from '../../core/api/pagina';
import { Carteira } from '../carteiras/carteiras.model';
import { CHAVE_CARTEIRA_PREFERIDA } from '../painel/carteira-preferida';
import { Desempenho } from './desempenho';

function pagina<T>(itens: T[]): Pagina<T> {
  return { content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: 200 };
}

function carteira(id: number, nome: string): Carteira {
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

const AGORA = new Date().toISOString();

const CONSOLIDADO = {
  valorInvestido: 3500,
  valorDeMercado: 4000,
  lucroNaoRealizado: 500,
  taxaCambioAtual: 5,
  dataHoraTaxaCambio: AGORA,
  avisos: [] as string[],
};

const POSICOES = [
  {
    id: 1,
    ticker: 'PETR4',
    nomeEmpresa: 'Petrobras',
    quantidade: 100,
    precoMedio: 28,
    cotacaoAtual: 30,
    dataHoraCotacao: AGORA,
    rentabilidadeNaoRealizada: 200,
  },
  {
    id: 2,
    ticker: 'AAPL',
    nomeEmpresa: 'Apple',
    quantidade: 10,
    precoMedio: 18,
    cotacaoAtual: 20,
    dataHoraCotacao: AGORA,
    rentabilidadeNaoRealizada: 20,
  },
];

const ACOES = [
  { id: 1, ticker: 'PETR4', nomeEmpresa: 'Petrobras', mercado: 'BR', moeda: 'BRL', cotacaoAtual: 30, dataHoraCotacao: AGORA },
  { id: 2, ticker: 'AAPL', nomeEmpresa: 'Apple', mercado: 'US', moeda: 'USD', cotacaoAtual: 20, dataHoraCotacao: AGORA },
];

describe('Tela de desempenho', () => {
  let fixture: ComponentFixture<Desempenho>;
  let controle: HttpTestingController;

  function abrir(lembrada?: number) {
    localStorage.clear();
    if (lembrada !== undefined) {
      localStorage.setItem(CHAVE_CARTEIRA_PREFERIDA, String(lembrada));
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Desempenho);
  }

  function responderCarteiras(carteiras: Carteira[]) {
    controle.expectOne((pedido) => pedido.url === '/carteiras').flush(pagina(carteiras));
  }

  function responderDados(
    carteiraId: number,
    opcoes: {
      consolidado?: typeof CONSOLIDADO | null;
      posicoes?: typeof POSICOES | null;
      lucro?: { total: number; porTicker: Record<string, number> } | null;
    } = {},
  ) {
    const { consolidado = CONSOLIDADO, posicoes = POSICOES, lucro = { total: 0, porTicker: {} } } = opcoes;

    const pedidoConsolidado = controle.expectOne(`/carteiras/${carteiraId}/consolidado`);
    consolidado
      ? pedidoConsolidado.flush(consolidado)
      : pedidoConsolidado.flush({ codigo: 'GEN-001' }, { status: 500, statusText: 'Erro' });

    const pedidoPosicoes = controle.expectOne(`/carteiras/${carteiraId}/posicoes`);
    posicoes
      ? pedidoPosicoes.flush(posicoes)
      : pedidoPosicoes.flush({ codigo: 'GEN-001' }, { status: 500, statusText: 'Erro' });

    const pedidoLucro = controle.expectOne(`/carteiras/${carteiraId}/lucro-realizado`);
    lucro
      ? pedidoLucro.flush(lucro)
      : pedidoLucro.flush({ codigo: 'GEN-001' }, { status: 500, statusText: 'Erro' });

    controle.expectOne((pedido) => pedido.url === '/acoes').flush(pagina(ACOES));
  }

  async function elemento() {
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-189 o seletor lista as carteiras e a escolha troca os dados da tela', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')]);
    responderDados(9);

    let tela = await elemento();
    const seletor = tela.querySelector('[data-seletor-carteira]') as HTMLSelectElement;
    expect([...seletor.options].map((opcao) => opcao.textContent?.trim())).toEqual([
      'Longo prazo',
      'Dividendos',
    ]);

    seletor.value = '4';
    seletor.dispatchEvent(new Event('change'));
    responderDados(4);

    tela = await elemento();
    expect(tela.querySelector('[data-numeros-desempenho]')).not.toBeNull();
    controle.verify();
  });

  it('@spec:AC-190 a carteira escolhida numa visita anterior é a que abre', async () => {
    abrir(4);
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')]);
    responderDados(4);

    const tela = await elemento();
    const seletor = tela.querySelector('[data-seletor-carteira]') as HTMLSelectElement;
    expect(seletor.value).toBe('4');
    controle.verify();
  });

  it('@spec:AC-190 escolher uma carteira guarda a escolha para a próxima visita', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')]);
    responderDados(9);
    await fixture.whenStable();

    const tela = await elemento();
    const seletor = tela.querySelector('[data-seletor-carteira]') as HTMLSelectElement;
    seletor.value = '4';
    seletor.dispatchEvent(new Event('change'));
    responderDados(4);
    await fixture.whenStable();

    expect(localStorage.getItem(CHAVE_CARTEIRA_PREFERIDA)).toBe('4');
    controle.verify();
  });

  it('@spec:AC-191 todas as opções são carteiras concretas: não há visão somada de todas', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')]);
    responderDados(9);

    const tela = await elemento();
    const opcoes = [...tela.querySelectorAll('[data-seletor-carteira] option')];
    expect(opcoes.length).toBe(2);
    expect(opcoes.map((opcao) => opcao.getAttribute('value'))).toEqual(['9', '4']);
    expect(tela.textContent ?? '').not.toMatch(/todas as carteiras|carteiras somadas|consolidado geral/i);
    controle.verify();
  });

  it('@spec:AC-209 carteira sem posição e sem venda convida a registrar a primeira compra, sem gráficos', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo')]);
    responderDados(9, {
      consolidado: { ...CONSOLIDADO, valorInvestido: 0, valorDeMercado: 0, lucroNaoRealizado: 0 },
      posicoes: [],
      lucro: { total: 0, porTicker: {} },
    });

    const tela = await elemento();
    expect(tela.querySelector('[data-convite-primeira-compra]')?.textContent).toContain(
      'Registre sua primeira compra',
    );
    expect(tela.querySelector('[data-grafico-composicao]')).toBeNull();
    expect(tela.querySelector('[data-grafico-contribuicao]')).toBeNull();
    expect(tela.querySelector('[data-grafico-realizado]')).toBeNull();
    controle.verify();
  });

  it('@spec:AC-210 investidor sem carteira nenhuma é convidado a criar a primeira', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([]);

    const tela = await elemento();
    expect(tela.querySelector('[data-convite-carteira]')?.textContent).toContain(
      'Crie sua primeira carteira',
    );
    expect(tela.querySelector('[data-seletor-carteira]')).toBeNull();
    controle.verify();
  });

  it('@spec:AC-211 leitura do realizado que falha não derruba os outros blocos', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo')]);
    responderDados(9, { lucro: null });

    const tela = await elemento();
    expect(tela.querySelector('[data-numeros-desempenho]')).not.toBeNull();
    expect(tela.querySelector('[data-grafico-composicao]')).not.toBeNull();
    expect(tela.querySelector('[data-realizado-indisponivel]')?.textContent).toContain(
      'Não foi possível ler',
    );
    controle.verify();
  });

  it('@spec:AC-193 a posição em dólar entra nos gráficos convertida, e a composição fecha com o valor de mercado', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo')]);
    responderDados(9);

    const tela = await elemento();
    // PETR4: 100 × R$ 30 = R$ 3.000. AAPL: 10 × US$ 20 × 5 = R$ 1.000. Total R$ 4.000.
    expect(tela.querySelector('[data-fatia="AAPL"] [data-fatia-valor]')?.textContent).toContain(
      '1.000,00',
    );
    expect(tela.querySelector('[data-soma-composicao]')?.textContent).toContain('4.000,00');
    expect(tela.querySelector('[data-ressalva-composicao]')).toBeNull();
    // Contribuição: AAPL US$ 20 × 5 = R$ 100, abaixo de PETR4 (R$ 200).
    const contribuicoes = [...tela.querySelectorAll('[data-contribuicao-ticker]')].map((no) =>
      no.textContent?.trim(),
    );
    expect(contribuicoes).toEqual(['PETR4', 'AAPL']);
    controle.verify();
  });

  it('@spec:AC-205 os avisos de dividendos e de snapshot estão sempre visíveis na tela', async () => {
    abrir();
    fixture.detectChanges();
    responderCarteiras([carteira(9, 'Longo prazo')]);
    responderDados(9);

    const tela = await elemento();
    expect(tela.querySelector('[data-aviso-dividendos]')?.textContent).toContain(
      'não inclui dividendos nem JCP',
    );
    expect(tela.querySelector('[data-aviso-snapshot]')?.textContent).toContain('snapshots');
    controle.verify();
  });
});
