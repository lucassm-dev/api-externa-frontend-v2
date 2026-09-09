import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { traduzirErro } from '../../../core/erros/tradutor-erro';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NovaOperacao, TipoOperacao } from '../operacoes.model';
import { FormularioOperacao } from './formulario-operacao';

const CARTEIRAS = {
  content: [
    {
      id: 9,
      investidorId: 1,
      corretoraId: 7,
      nomeCorretora: 'XP',
      mercado: 'BR',
      moeda: 'BRL',
      nome: 'Dividendos',
      ativa: true,
    },
    {
      id: 10,
      investidorId: 1,
      corretoraId: 7,
      nomeCorretora: 'XP',
      mercado: 'BR',
      moeda: 'BRL',
      nome: 'Cripto',
      ativa: true,
    },
  ],
  totalElements: 2,
  totalPages: 1,
  number: 0,
  size: 20,
};

const CATALOGO = {
  content: [
    {
      id: 1,
      ticker: 'PETR4',
      nomeEmpresa: 'Petrobras',
      mercado: 'BR',
      moeda: 'BRL',
      cotacaoAtual: 32.5,
      dataHoraCotacao: new Date().toISOString(),
    },
    {
      id: 2,
      ticker: 'VALE3',
      nomeEmpresa: 'Vale',
      mercado: 'BR',
      moeda: 'BRL',
      cotacaoAtual: 60,
      dataHoraCotacao: new Date().toISOString(),
    },
    {
      id: 3,
      ticker: 'MGLU3',
      nomeEmpresa: 'Magazine Luiza',
      mercado: 'BR',
      moeda: 'BRL',
      cotacaoAtual: 2,
      dataHoraCotacao: new Date().toISOString(),
    },
  ],
  totalElements: 3,
  totalPages: 1,
  number: 0,
  size: 20,
};

function posicao(ticker: string, quantidade: number) {
  return {
    id: 1,
    ticker,
    nomeEmpresa: `Empresa ${ticker}`,
    quantidade,
    precoMedio: 10,
    cotacaoAtual: 12,
    dataHoraCotacao: new Date().toISOString(),
    rentabilidadeNaoRealizada: 0,
  };
}

describe('Formulário de compra e venda', () => {
  let fixture: ComponentFixture<FormularioOperacao>;
  let componente: FormularioOperacao;
  let controle: HttpTestingController;
  let elemento: HTMLElement;
  let registradas: { tipo: TipoOperacao; operacao: NovaOperacao }[];

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(FormularioOperacao);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    registradas = [];
    componente.registrar.subscribe((evento) => registradas.push(evento));
    fixture.detectChanges();
    await fixture.whenStable();

    controle.expectOne((r) => r.url === '/carteiras').flush(CARTEIRAS);
    controle.expectOne((r) => r.url === '/acoes').flush(CATALOGO);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function escolherCarteira(id: number, posicoes = [posicao('PETR4', 100)]) {
    componente.escolherCarteira(id);
    fixture.detectChanges();
    controle.expectOne(`/carteiras/${id}/posicoes`).flush(posicoes);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => await montar());

  afterEach(() => controle.verify());

  it('@spec:AC-150 o tipo é um par de opções lado a lado, marcado sem interação', () => {
    const seletor = elemento.querySelector('[data-seletor-tipo]')!;
    expect(seletor).toBeTruthy();
    expect(seletor.tagName.toLowerCase()).not.toBe('select');
    expect(seletor.querySelector('select')).toBeNull();

    const opcoes = seletor.querySelectorAll('[data-tipo]');
    expect(opcoes.length).toBe(2);
    expect(seletor.querySelectorAll('[data-marcada="sim"]').length).toBe(1);
    expect(elemento.querySelector('[data-tipo="COMPRA"][data-marcada="sim"]')).toBeTruthy();
  });

  it('@spec:AC-151 trocar o tipo preserva a carteira e limpa quantidade e preço', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(100);
    componente.alternarPrecoManual(true);
    componente.precoManual.set(31.5);
    fixture.detectChanges();

    componente.escolherTipo('VENDA');
    fixture.detectChanges();

    expect(componente.carteiraId()).toBe(9);
    expect(componente.quantidade()).toBeNull();
    expect(componente.precoManual()).toBeNull();
    expect(componente.precoManualAtivo()).toBe(false);
  });

  it('@spec:AC-152 na compra a ação vem do catálogo inteiro', async () => {
    await escolherCarteira(9);
    const opcoes = [...elemento.querySelectorAll('[data-campo-acao] option')].map((o) =>
      o.getAttribute('value'),
    );

    expect(opcoes).toContain('PETR4');
    expect(opcoes).toContain('VALE3');
    expect(opcoes).toContain('MGLU3');
  });

  it('@spec:AC-153 o botão diz qual operação será registrada em cada tipo', async () => {
    const botao = () => elemento.querySelector('[data-confirmar]')!.textContent!.trim();
    expect(botao()).toBe('Registrar compra');

    componente.escolherTipo('VENDA');
    fixture.detectChanges();
    expect(botao()).toBe('Registrar venda');
  });

  it('@spec:AC-154 confirmar a compra emite carteira, ticker e quantidade, sem preço', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(100);
    fixture.detectChanges();

    componente.enviar();

    expect(registradas).toEqual([
      { tipo: 'COMPRA', operacao: { carteiraId: 9, ticker: 'PETR4', quantidade: 100 } },
    ]);
  });

  it('@spec:AC-157 na venda só aparecem ações com posição na carteira escolhida', async () => {
    componente.escolherTipo('VENDA');
    fixture.detectChanges();
    await escolherCarteira(9, [posicao('PETR4', 100), posicao('VALE3', 50)]);

    const opcoes = [...elemento.querySelectorAll('[data-campo-acao] option')]
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);

    expect(opcoes).toEqual(['PETR4', 'VALE3']);
    expect(opcoes).not.toContain('MGLU3');
  });

  it('@spec:AC-158 a venda mostra o disponível e impede exceder a posição', async () => {
    componente.escolherTipo('VENDA');
    fixture.detectChanges();
    await escolherCarteira(9, [posicao('PETR4', 100)]);

    componente.ticker.set('PETR4');
    componente.quantidade.set(150);
    fixture.detectChanges();

    expect(elemento.querySelector('[data-disponivel]')!.textContent).toContain('100');
    expect(elemento.querySelector('[data-excede-posicao]')).toBeTruthy();
    expect(elemento.querySelector<HTMLButtonElement>('[data-confirmar]')!.disabled).toBe(true);

    componente.enviar();
    expect(registradas).toEqual([]);
  });

  it('@spec:AC-159 trocar a carteira na venda descarta ação e quantidade anteriores', async () => {
    componente.escolherTipo('VENDA');
    fixture.detectChanges();
    await escolherCarteira(9, [posicao('PETR4', 100)]);
    componente.ticker.set('PETR4');
    componente.quantidade.set(10);
    fixture.detectChanges();

    await escolherCarteira(10, [posicao('VALE3', 20)]);

    expect(componente.ticker()).toBeNull();
    expect(componente.quantidade()).toBeNull();
    const opcoes = [...elemento.querySelectorAll('[data-campo-acao] option')]
      .map((o) => o.getAttribute('value'))
      .filter(Boolean);
    expect(opcoes).toEqual(['VALE3']);
  });

  it('@spec:AC-161 OPE-004 destaca a quantidade e mantém o formulário preenchido', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(150);
    fixture.detectChanges();

    const erro = traduzirErro(
      new HttpErrorResponse({
        status: 422,
        error: {
          timestamp: '2026-09-09T12:00:00Z',
          status: 422,
          codigo: 'OPE-004',
          error: 'erro',
          message: 'recusado',
          path: '/operacoes/venda',
        },
      }),
    );
    componente.aplicarErro(erro, 100);
    fixture.detectChanges();

    const destaque = elemento.querySelector('[data-erro-quantidade]')!;
    expect(destaque.textContent).toContain('100');
    expect(componente.ticker()).toBe('PETR4');
    expect(componente.quantidade()).toBe(150);
  });

  it('@spec:AC-162 o campo de preço não vem aberto — só o controle de opt-in', () => {
    expect(elemento.querySelector('[data-campo-preco]')).toBeNull();
    expect(elemento.querySelector('[data-preco-manual]')).toBeTruthy();
  });

  it('@spec:AC-163 ativar o preço manual abre o campo e o preço vai na operação', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(10);
    componente.alternarPrecoManual(true);
    componente.precoManual.set(31.5);
    fixture.detectChanges();

    expect(elemento.querySelector('[data-campo-preco]')).toBeTruthy();
    componente.enviar();
    expect(registradas[0].operacao.precoUnitario).toBe(31.5);
  });

  it('@spec:AC-163 desativar o preço manual devolve a operação ao preço de mercado', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(10);
    componente.alternarPrecoManual(true);
    componente.precoManual.set(31.5);
    componente.alternarPrecoManual(false);
    fixture.detectChanges();

    componente.enviar();
    expect('precoUnitario' in registradas[0].operacao).toBe(false);
  });

  it('@spec:AC-164 preço manual com três casas não sai da tela e é acusado', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(10);
    componente.alternarPrecoManual(true);
    componente.precoManual.set(31.555);
    fixture.detectChanges();

    expect(elemento.querySelector('[data-preco-casas]')!.textContent).toContain(
      'no máximo 2 casas decimais',
    );
    componente.enviar();
    expect(registradas).toEqual([]);
  });

  it('@spec:AC-165 a estimativa aparece com o horário da cotação e declarada como estimativa', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(100);
    fixture.detectChanges();

    const bloco = elemento.querySelector('[data-estimativa]')!;
    expect(bloco).toBeTruthy();
    expect(bloco.querySelector('app-valor-com-horario')).toBeTruthy();
    expect(elemento.querySelector('[data-total-estimado]')!.textContent).toContain('3.250,00');
    expect(elemento.querySelector('[data-ressalva-estimativa]')!.textContent).toContain(
      'estimativa',
    );
  });

  it('@spec:AC-156 preparar a próxima preserva a carteira e limpa a quantidade', async () => {
    await escolherCarteira(9);
    componente.ticker.set('PETR4');
    componente.quantidade.set(100);
    fixture.detectChanges();

    componente.prepararProxima();
    fixture.detectChanges();
    controle.expectOne('/carteiras/9/posicoes').flush([posicao('PETR4', 100)]);
    fixture.detectChanges();

    expect(componente.carteiraId()).toBe(9);
    expect(componente.quantidade()).toBeNull();
    expect(elemento.querySelector('[data-confirmar]')).toBeTruthy();
  });
});
