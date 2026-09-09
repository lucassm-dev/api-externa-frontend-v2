import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { Acao } from '../acoes.model';
import { CadastroAcao } from './cadastro-acao';

const PETR4: Acao = {
  id: 12,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  mercado: 'BR',
  moeda: 'BRL',
  cotacaoAtual: 38.42,
  dataHoraCotacao: '2026-09-09T13:20:00',
};

function erroDoServidor(codigo: string, status: number, message: string) {
  return {
    corpo: {
      timestamp: '2026-09-09T12:00:00Z',
      status,
      codigo,
      error: 'erro',
      message,
      path: '/acoes',
    },
    opcoes: { status, statusText: 'erro' },
  };
}

describe('Cadastro de ação', () => {
  let fixture: ComponentFixture<CadastroAcao>;
  let componente: CadastroAcao;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'acoes', children: [] },
          { path: 'acoes/:ticker', children: [] },
          { path: 'carteiras/nova', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CadastroAcao);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
  });

  /** A tela pergunta ao servidor se o investidor tem carteira antes de tudo. */
  async function responderCarteiras(totalElements: number) {
    await fixture.whenStable();
    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({ content: [], totalElements, totalPages: 1, number: 0, size: 1 });
    await fixture.whenStable();
  }

  async function falharCarteiras() {
    await fixture.whenStable();
    controle
      .expectOne((r) => r.url === '/carteiras')
      .flush({ message: 'fora do ar' }, { status: 500, statusText: 'erro' });
    await fixture.whenStable();
  }

  async function enviar(ticker = 'PETR4', mercado: 'BR' | 'US' = 'BR') {
    componente.formulario.setValue({ ticker, mercado });
    componente.enviar();
    await fixture.whenStable();
  }

  async function recusar(codigo: string, status: number, message: string) {
    await enviar();
    const { corpo, opcoes } = erroDoServidor(codigo, status, message);
    controle.expectOne('/acoes').flush(corpo, opcoes);
    await fixture.whenStable();
  }

  it('@spec:AC-126 sem carteira, nenhum campo é renderizado e o atalho para criar carteira aparece', async () => {
    await responderCarteiras(0);

    expect(elemento.querySelectorAll('input, select, textarea').length).toBe(0);
    const bloqueio = elemento.querySelector('[data-sem-carteira]');
    expect(bloqueio).not.toBeNull();
    expect(bloqueio!.textContent).toContain('Crie uma carteira antes de cadastrar ações.');
    expect(elemento.querySelector('[data-criar-carteira]')?.getAttribute('href')).toContain(
      '/carteiras/nova',
    );
  });

  it('@spec:AC-126 sem carteira, nenhuma requisição de cadastro sai da tela', async () => {
    await responderCarteiras(0);

    componente.enviar();
    await fixture.whenStable();

    controle.expectNone('/acoes');
  });

  it('@spec:AC-127 com carteira, o formulário abre sem mensagem de pré-requisito', async () => {
    await responderCarteiras(1);

    expect(elemento.querySelector('[data-sem-carteira]')).toBeNull();
    expect(elemento.querySelector('[data-campo-ticker]')).not.toBeNull();
    expect(elemento.querySelector('[data-campo-mercado]')).not.toBeNull();
  });

  it('@spec:AC-121 o formulário tem exatamente dois campos, ticker e mercado', async () => {
    await responderCarteiras(1);

    const campos = [...elemento.querySelectorAll('input, select, textarea')];
    expect(campos.length).toBe(2);
    expect(Object.keys(componente.formulario.controls)).toEqual(['ticker', 'mercado']);

    // Nenhum rótulo de campo pede o que a fonte traz: empresa, moeda ou cotação.
    const rotulos = [...elemento.querySelectorAll('mat-label, .rotulo')]
      .map((rotulo) => (rotulo.textContent ?? '').toLowerCase())
      .join(' ');
    expect(rotulos).toContain('ticker');
    expect(rotulos).toContain('mercado');
    expect(rotulos).not.toContain('empresa');
    expect(rotulos).not.toContain('moeda');
    expect(rotulos).not.toContain('cotação');
  });

  it('@spec:AC-128 consulta de carteiras que falhou não vira bloqueio', async () => {
    await falharCarteiras();

    expect(elemento.querySelector('[data-sem-carteira]')).toBeNull();
    expect(elemento.querySelector('[data-campo-ticker]')).not.toBeNull();
  });

  it('@spec:AC-122 cadastro aceito leva à ação com nome, moeda e cotação datada', async () => {
    await responderCarteiras(1);
    await enviar();

    const requisicao = controle.expectOne('/acoes');
    expect(requisicao.request.body).toEqual({ ticker: 'PETR4', mercado: 'BR' });
    requisicao.flush(PETR4);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/acoes/PETR4');
  });

  it('@spec:AC-123 clicar de novo durante a consulta não dispara requisição extra', async () => {
    await responderCarteiras(1);
    await enviar();

    componente.enviar();
    componente.enviar();
    await fixture.whenStable();

    controle.expectOne('/acoes').flush(PETR4);
    expect(componente.consultando()).toBe(false);
  });

  it('@spec:AC-124 EXT-008 mantém ticker e mercado no formulário, sem criar ação', async () => {
    await responderCarteiras(1);
    await recusar('EXT-008', 404, 'ticker não encontrado');

    expect(componente.formulario.getRawValue()).toEqual({ ticker: 'PETR4', mercado: 'BR' });
    expect(componente.textoDoErro()).toBe(
      'Não encontramos este ticker no mercado selecionado. Confira o código e o mercado.',
    );
    expect(componente.formulario.controls.ticker.errors).not.toBeNull();
    expect(componente.acaoExistente()).toBeNull();
    controle.expectNone((r) => r.url.startsWith('/acoes/ticker/'));
  });

  it('@spec:AC-125 ACA-002 busca a ação existente e oferece abri-la', async () => {
    await responderCarteiras(1);
    await recusar('ACA-002', 409, 'ticker duplicado');

    controle.expectOne('/acoes/ticker/PETR4').flush(PETR4);
    await fixture.whenStable();

    expect(componente.textoDoErro()).toBe('Este ticker já está cadastrado.');
    const cartao = elemento.querySelector('[data-existente]');
    expect(cartao?.textContent).toContain('PETR4');
    expect(cartao?.textContent).toContain('Petróleo Brasileiro S.A.');
    expect(elemento.querySelector('[data-abrir]')?.getAttribute('href')).toContain('/acoes/PETR4');
  });

  it('@spec:AC-129 ACA-004 do backend continua tratado, com o atalho para criar carteira', async () => {
    await responderCarteiras(1);
    await recusar('ACA-004', 422, 'sem carteira');

    expect(componente.textoDoErro()).toBe('Crie uma carteira antes de cadastrar ações.');
    expect(elemento.querySelector('[data-criar-carteira]')?.getAttribute('href')).toContain(
      '/carteiras/nova',
    );
  });
});
