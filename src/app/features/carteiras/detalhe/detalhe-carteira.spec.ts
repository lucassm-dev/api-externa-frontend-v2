import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { Carteira } from '../carteiras.model';
import { DetalheCarteira } from './detalhe-carteira';

const CARTEIRA: Carteira = {
  id: 9,
  investidorId: 1,
  corretoraId: 7,
  nomeCorretora: 'XP Investimentos',
  mercado: 'BR',
  moeda: 'BRL',
  nome: 'Dividendos',
  ativa: true,
};

const CONSOLIDADO = {
  valorInvestido: 10_000,
  valorDeMercado: 11_500.5,
  lucroNaoRealizado: 1_500.5,
  taxaCambioAtual: 5.42,
  dataHoraTaxaCambio: new Date().toISOString(),
  avisos: [] as string[],
};

const POSICOES = [
  {
    id: 1,
    ticker: 'PETR4',
    nomeEmpresa: 'Petróleo Brasileiro S.A.',
    quantidade: 100,
    precoMedio: 10,
    cotacaoAtual: 12.5,
    dataHoraCotacao: new Date().toISOString(),
    rentabilidadeNaoRealizada: 250,
  },
];

const EXTRATO = {
  content: [
    { id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA', ticker: 'PETR4' },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 200,
};

function erroDoServidor(codigo: string, status: number) {
  return {
    corpo: {
      timestamp: '2026-09-09T12:00:00Z',
      status,
      codigo,
      error: 'erro',
      message: 'recusado',
      path: '/carteiras/9',
    },
    opcoes: { status, statusText: 'erro' },
  };
}

describe('Detalhe da carteira', () => {
  let fixture: ComponentFixture<DetalheCarteira>;
  let componente: DetalheCarteira;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'carteiras', children: [] },
          { path: 'operacoes', children: [] },
        ]),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '9']])) } },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalheCarteira);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function carregar(consolidado = CONSOLIDADO, carteiras = [CARTEIRA]) {
    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({
        content: carteiras,
        totalElements: carteiras.length,
        totalPages: 1,
        number: 0,
        size: 200,
      });
    await fixture.whenStable();

    if (carteiras.length === 0) {
      return;
    }

    controle.expectOne('/carteiras/9/posicoes').flush(POSICOES);
    controle.expectOne('/carteiras/9/consolidado').flush(consolidado);
    controle
      .expectOne('/carteiras/9/lucro-realizado')
      .flush({ total: 320.75, porTicker: { PETR4: 200, VALE3: 120.75 } });
    controle.expectOne((r) => r.url === '/operacoes').flush(EXTRATO);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await montar();
  });

  it('@spec:AC-101 o cabeçalho traz identificação e os quatro totais', async () => {
    await carregar();

    const cabecalho = elemento.querySelector('[data-cabecalho]') as HTMLElement;
    expect(cabecalho.textContent).toContain('Dividendos');
    expect(cabecalho.textContent).toContain('XP Investimentos');
    expect(cabecalho.textContent).toContain('Brasil');
    expect(cabecalho.querySelector('[data-investido]')?.textContent).toContain('10.000,00');
    expect(cabecalho.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(cabecalho.querySelector('[data-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(cabecalho.querySelector('[data-realizado]')?.textContent).toContain('320,75');
  });

  it('@spec:AC-102 os totais saem em real, com a taxa de câmbio e o horário dela', async () => {
    await carregar();

    const investido = elemento.querySelector('[data-investido]') as HTMLElement;
    expect(investido.textContent).toContain('R$');

    const cambio = elemento.querySelector(
      '[data-taxa-cambio] [data-valor-com-horario]',
    ) as HTMLElement;
    expect(cambio.querySelector('[data-numero]')?.textContent).toContain('5,42');
    expect(cambio.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-103 realizado e não realizado aparecem separados e nunca somados', async () => {
    await carregar();

    const cabecalho = elemento.querySelector('[data-cabecalho]') as HTMLElement;
    expect(cabecalho.querySelector('[data-nao-realizado]')).toBeTruthy();
    expect(cabecalho.querySelector('[data-realizado]')).toBeTruthy();
    expect(cabecalho.textContent).toMatch(/não realizado/i);
    expect(cabecalho.textContent).toMatch(/realizado/i);

    // 1.500,50 + 320,75 = 1.821,25 — esse número não pode existir em lugar nenhum.
    expect(elemento.textContent).not.toContain('1.821,25');
  });

  it('@spec:AC-104 aviso do consolidado é aviso e não bloqueia os totais', async () => {
    await carregar({ ...CONSOLIDADO, avisos: ['A cotação do dólar está indisponível.'] });

    const aviso = elemento.querySelector('[data-aviso-consolidado]') as HTMLElement;
    expect(aviso.textContent).toContain('A cotação do dólar está indisponível.');
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(elemento.querySelector('[data-erro]')).toBeNull();
  });

  it('@spec:AC-105 a tela oferece registrar compra e venda identificando esta carteira', async () => {
    await carregar();

    const compra = elemento.querySelector('[data-registrar-compra]') as HTMLAnchorElement;
    const venda = elemento.querySelector('[data-registrar-venda]') as HTMLAnchorElement;
    expect(compra.getAttribute('href')).toContain('/operacoes');
    expect(compra.getAttribute('href')).toContain('carteira=9');
    expect(venda.getAttribute('href')).toContain('carteira=9');
    expect(venda.getAttribute('href')).toContain('VENDA');
  });

  it('@spec:AC-115 a edição alcança só o nome', async () => {
    await carregar();

    componente.pedirRenomeacao();
    await fixture.whenStable();

    const edicao = elemento.querySelector('[data-edicao-nome]') as HTMLElement;
    expect(edicao.querySelectorAll('input, select, textarea').length).toBe(1);
    expect(edicao.querySelector('[data-campo-nome]')).toBeTruthy();
  });

  it('@spec:AC-116 renomear troca o nome e preserva totais, posições e movimentações', async () => {
    await carregar();

    componente.pedirRenomeacao();
    componente.nomeEditado.set('Longo prazo');
    componente.confirmarRenomeacao();
    await fixture.whenStable();

    const requisicao = controle.expectOne('/carteiras/9');
    expect(requisicao.request.method).toBe('PATCH');
    requisicao.flush({ ...CARTEIRA, nome: 'Longo prazo' });
    await fixture.whenStable();

    expect(elemento.querySelector('[data-cabecalho]')?.textContent).toContain('Longo prazo');
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(elemento.querySelector('[data-realizado]')?.textContent).toContain('320,75');
    expect(elemento.querySelector('[data-posicao="PETR4"]')).toBeTruthy();
    expect(elemento.querySelector('[data-encerrada="VALE3"]')).toBeTruthy();
    expect(elemento.querySelector('[data-movimentacao="1"]')).toBeTruthy();
    controle.verify();
  });

  it('@spec:AC-117 excluir pede confirmação simples com a consequência descrita', async () => {
    await carregar();

    componente.pedirExclusao();
    await fixture.whenStable();

    const dialogo = elemento.querySelector('app-dialogo-confirmacao') as HTMLElement;
    expect(dialogo.textContent).toMatch(/não há como desfazer/i);
    expect(dialogo.querySelectorAll('button').length).toBe(2);
    expect(dialogo.querySelectorAll('input').length).toBe(0);
    controle.expectNone('/carteiras/9');
  });

  it('@spec:AC-118 CAR-002 cancela a exclusão com a mensagem acionável', async () => {
    await carregar();

    componente.pedirExclusao();
    await fixture.whenStable();
    (elemento.querySelector('[data-confirmar]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const { corpo, opcoes } = erroDoServidor('CAR-002', 409);
    controle.expectOne('/carteiras/9').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(elemento.querySelector('[data-erro]')?.textContent).toContain(
      'Esta carteira ainda tem posições abertas. Venda ou zere as posições antes de excluí-la.',
    );
    expect(elemento.querySelector('[data-cabecalho]')?.textContent).toContain('Dividendos');
    expect(elemento.querySelector('app-dialogo-confirmacao')).toBeNull();
  });

  it('@spec:AC-120 CAR-002 não sugere que a carteira seja de outro investidor', async () => {
    await carregar();

    componente.pedirExclusao();
    await fixture.whenStable();
    (elemento.querySelector('[data-confirmar]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const { corpo, opcoes } = erroDoServidor('CAR-002', 409);
    controle.expectOne('/carteiras/9').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(elemento.textContent).not.toMatch(
      /outro investidor|de outra pessoa|permiss|inativ|dono/i,
    );
  });

  it('@spec:AC-120 carteira que não aparece na listagem devolve à lista com "Carteira não encontrada."', async () => {
    const router = TestBed.inject(Router);
    const feedback = TestBed.inject(FeedbackService);

    await carregar(CONSOLIDADO, []);

    expect(router.url).toBe('/carteiras');
    const mensagens = feedback.mensagens().map((m) => m.texto);
    expect(mensagens).toContain('Carteira não encontrada.');
    expect(mensagens.join(' ')).not.toMatch(/outro investidor|permiss|inativ|dono/i);
  });

  it('@spec:AC-120 CAR-001 vindo do servidor devolve à lista sem revelar de quem é a carteira', async () => {
    const router = TestBed.inject(Router);
    const feedback = TestBed.inject(FeedbackService);

    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({ content: [CARTEIRA], totalElements: 1, totalPages: 1, number: 0, size: 200 });
    await fixture.whenStable();

    const { corpo, opcoes } = erroDoServidor('CAR-001', 404);
    controle.expectOne('/carteiras/9/posicoes').flush(corpo, opcoes);
    controle.expectOne('/carteiras/9/consolidado').flush(corpo, opcoes);
    controle.expectOne('/carteiras/9/lucro-realizado').flush(corpo, opcoes);
    controle.expectOne((r) => r.url === '/operacoes').flush(EXTRATO);
    await fixture.whenStable();

    expect(router.url).toBe('/carteiras');
    expect(feedback.mensagens().map((m) => m.texto)).toContain('Carteira não encontrada.');
    expect(
      feedback
        .mensagens()
        .map((m) => m.texto)
        .join(' '),
    ).not.toMatch(/outro investidor|permiss|inativ|dono/i);
  });
});

describe('Correção de operações pelo detalhe da carteira', () => {
  let fixture: ComponentFixture<DetalheCarteira>;
  let componente: DetalheCarteira;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  const MOVIMENTACAO = {
    id: 1,
    carteiraId: 9,
    dataHora: '2026-09-09T10:00:00',
    tipo: 'COMPRA' as const,
    ticker: 'PETR4',
    quantidade: 100,
  };

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'carteiras', children: [] },
          { path: 'operacoes', children: [] },
        ]),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '9']])) } },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalheCarteira);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({ content: [CARTEIRA], totalElements: 1, totalPages: 1, number: 0, size: 200 });
    await fixture.whenStable();
    responderConteudo();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function responderConteudo(posicoes = POSICOES, lucro = 320.75, itens = [MOVIMENTACAO]) {
    controle.expectOne('/carteiras/9/posicoes').flush(posicoes);
    controle.expectOne('/carteiras/9/consolidado').flush(CONSOLIDADO);
    controle
      .expectOne('/carteiras/9/lucro-realizado')
      .flush({ total: lucro, porTicker: { PETR4: lucro } });
    controle
      .expectOne((r) => r.url === '/operacoes')
      .flush({
        content: itens,
        totalElements: itens.length,
        totalPages: 1,
        number: 0,
        size: 200,
      });
  }

  beforeEach(async () => await montar());

  it('@spec:AC-178 editar pela carteira relê posições, consolidado, resultado e movimentações', async () => {
    componente.abrirEdicaoDeOperacao(MOVIMENTACAO);
    fixture.detectChanges();
    expect(elemento.querySelector('app-editar-operacao')).toBeTruthy();

    componente.salvarEdicaoDeOperacao({ quantidade: 50 });
    const alteracao = controle.expectOne('/operacoes/1');
    expect(alteracao.request.method).toBe('PUT');
    alteracao.flush({ id: 1, quantidade: 50, avisos: [] });
    await fixture.whenStable();

    const posicaoNova = [{ ...POSICOES[0], quantidade: 50, rentabilidadeNaoRealizada: 125 }];
    responderConteudo(posicaoNova, 999, [{ ...MOVIMENTACAO, quantidade: 50 }]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(componente.posicoes()[0].quantidade).toBe(50);
    expect(componente.lucroRealizado()!.total).toBe(999);
    expect(elemento.querySelector('app-editar-operacao')).toBeNull();
    expect(elemento.querySelector('[data-movimentacao="1"]')!.textContent).toContain('50');
  });

  it('@spec:AC-181 excluir pela carteira relê os números recalculados sem recarga manual', async () => {
    componente.excluirOperacao(MOVIMENTACAO);
    const exclusao = controle.expectOne('/operacoes/1');
    expect(exclusao.request.method).toBe('DELETE');
    exclusao.flush(null);
    await fixture.whenStable();

    responderConteudo([], 0, []);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(componente.posicoes()).toEqual([]);
    expect(componente.lucroRealizado()!.total).toBe(0);
    expect(elemento.querySelector('[data-movimentacao="1"]')).toBeNull();
  });

  it('@spec:AC-181 a exclusão pela carteira pede confirmação com o aviso de recálculo', async () => {
    const secao = elemento.querySelector('app-movimentacoes-carteira')!;
    secao.querySelector<HTMLButtonElement>('[data-excluir]')!.click();
    fixture.detectChanges();

    const dialogo = elemento.querySelector('[data-confirmar-exclusao]')!;
    expect(dialogo.textContent).toContain('recalcular a posição e o resultado da carteira');
    expect(dialogo.textContent).toContain('Não há como desfazer');
    controle.expectNone('/operacoes/1');
  });
});
