import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { Acao } from '../acoes.model';
import { DetalheAcao } from './detalhe-acao';

const AGORA = new Date('2026-09-09T14:00:00');

const PETR4: Acao = {
  id: 12,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  mercado: 'BR',
  moeda: 'BRL',
  cotacaoAtual: 38.42,
  dataHoraCotacao: '2026-09-09T13:55:00',
};

function erroDoServidor(codigo: string, status: number) {
  return {
    corpo: {
      timestamp: '2026-09-09T12:00:00Z',
      status,
      codigo,
      error: 'erro',
      message: 'mensagem do servidor',
      path: '/acoes',
    },
    opcoes: { status, statusText: 'erro' },
  };
}

describe('Detalhe da ação', () => {
  let fixture: ComponentFixture<DetalheAcao>;
  let componente: DetalheAcao;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AGORA);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'acoes', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ ticker: 'PETR4' })) },
        },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalheAcao);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => vi.useRealTimers());

  async function carregar(acao: Acao | null = PETR4) {
    await fixture.whenStable();
    const requisicao = controle.expectOne('/acoes/ticker/PETR4');
    if (acao) {
      requisicao.flush(acao);
    } else {
      const { corpo, opcoes } = erroDoServidor('ACA-001', 404);
      requisicao.flush(corpo, opcoes);
    }
    await fixture.whenStable();
  }

  async function atualizar() {
    componente.atualizarCotacao();
    await fixture.whenStable();
    return controle.expectOne((r) => r.url === '/acoes/12/atualizar-cotacao');
  }

  function precoNaTela(): string {
    return elemento.querySelector('[data-numero]')?.textContent ?? '';
  }

  it('@spec:AC-136 abrir o detalhe não dispara atualização de cotação nenhuma', async () => {
    await carregar();

    controle.expectNone((r) => r.url.includes('atualizar-cotacao'));

    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval', 'Date'] });
    vi.advanceTimersByTime(20 * 60_000);

    controle.expectNone((r) => r.url.includes('atualizar-cotacao'));
    controle.verify();
  });

  it('@spec:AC-135 cotação com mais de 15 minutos aparece marcada como defasada', async () => {
    await carregar({ ...PETR4, dataHoraCotacao: '2026-09-09T13:00:00' });

    const valor = elemento.querySelector('[data-valor-com-horario]');
    expect(valor?.getAttribute('data-defasado')).toBe('true');
    expect(valor?.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });

  it('@spec:AC-137 preço novo troca número e horário na tela', async () => {
    await carregar();
    (await atualizar()).flush({
      ...PETR4,
      cotacaoAtual: 39.9,
      dataHoraCotacao: '2026-09-09T14:00:00',
    });
    await fixture.whenStable();

    expect(precoNaTela()).toContain('39,90');
    expect(elemento.querySelector('[data-horario]')?.textContent).toContain('14:00');
    expect(componente.desfecho()).toBe('preco-novo');
    expect(elemento.querySelector('[data-resultado-atualizacao]')?.textContent).toContain(
      'atualizada',
    );
  });

  it('@spec:AC-138 mesmo preço por cache válido é comunicado como "continua atual"', async () => {
    await carregar();
    (await atualizar()).flush({ ...PETR4 });
    await fixture.whenStable();

    expect(componente.desfecho()).toBe('continua-atual');
    const aviso = elemento.querySelector('[data-resultado-atualizacao]');
    expect(aviso?.textContent).toContain('continua atual');
    expect(aviso?.textContent).toContain('13:55');
    expect((aviso?.textContent ?? '').toLowerCase()).not.toContain('erro');
    expect(precoNaTela()).toContain('38,42');
  });

  it('@spec:AC-139 EXT-009 mantém o último preço e nomeia o horário dele', async () => {
    await carregar();
    const { corpo, opcoes } = erroDoServidor('EXT-009', 429);
    (await atualizar()).flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.textoDoErro()).toBe(
      'O limite de consultas da fonte foi atingido. O preço exibido é de 13:55.',
    );
    expect(precoNaTela()).toContain('38,42');
    expect(elemento.querySelector('[data-horario]')?.textContent).toContain('13:55');
  });

  it('@spec:AC-140 EXT-010 mantém o preço com mensagem diferente da de EXT-009', async () => {
    await carregar();
    const { corpo, opcoes } = erroDoServidor('EXT-010', 503);
    (await atualizar()).flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.textoDoErro()).toBe(
      'A fonte de cotação está indisponível. O preço exibido é de 13:55.',
    );
    expect(componente.textoDoErro()).not.toContain('limite de consultas');
    expect(precoNaTela()).toContain('38,42');
  });

  it('@spec:AC-141 forçar só aparece depois de o cache ter sido reaproveitado', async () => {
    await carregar();
    expect(elemento.querySelector('[data-forcar]')).toBeNull();

    const { corpo, opcoes } = erroDoServidor('EXT-009', 429);
    (await atualizar()).flush(corpo, opcoes);
    await fixture.whenStable();
    expect(elemento.querySelector('[data-forcar]')).toBeNull();

    (await atualizar()).flush({ ...PETR4 });
    await fixture.whenStable();

    const forcar = elemento.querySelector('[data-forcar]');
    expect(forcar).not.toBeNull();
    expect(elemento.querySelector('[data-aviso-cota]')?.textContent).toContain('cota');
  });

  it('@spec:AC-142 forçar envia o pedido de ignorar o cache, e só então', async () => {
    await carregar();
    (await atualizar()).flush({ ...PETR4 });
    await fixture.whenStable();

    componente.forcarAtualizacao();
    await fixture.whenStable();

    const requisicao = controle.expectOne((r) => r.url === '/acoes/12/atualizar-cotacao');
    expect(requisicao.request.params.get('forcar')).toBe('true');
    requisicao.flush({ ...PETR4, cotacaoAtual: 40.1, dataHoraCotacao: '2026-09-09T14:00:00' });
    await fixture.whenStable();

    expect(precoNaTela()).toContain('40,10');
  });

  it('@spec:AC-143 remover pede confirmação com a consequência antes de qualquer requisição', async () => {
    await carregar();

    componente.pedirRemocao();
    await fixture.whenStable();

    expect(elemento.querySelector('[data-consequencia]')?.textContent?.length).toBeGreaterThan(20);
    controle.expectNone((r) => r.method === 'DELETE');
  });

  it('@spec:AC-144 a exclusão confirmada usa o ticker na rota', async () => {
    await carregar();
    componente.pedirRemocao();
    componente.confirmarRemocao();
    await fixture.whenStable();

    const requisicao = controle.expectOne('/acoes/PETR4');
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null);
    await fixture.whenStable();
  });

  it('@spec:AC-146 removida, a ação some sem falar em lixeira nem desfazer', async () => {
    await carregar();
    componente.pedirRemocao();
    componente.confirmarRemocao();
    await fixture.whenStable();
    controle.expectOne('/acoes/PETR4').flush(null);
    await fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/acoes');
    const avisos = TestBed.inject(FeedbackService).mensagens();
    const texto = avisos.map((m) => m.texto).join(' ').toLowerCase();
    expect(texto).not.toContain('lixeira');
    expect(texto).not.toContain('desfazer');
    expect(texto).not.toContain('inativ');
  });

  it('@spec:AC-145 ACA-003 cancela a exclusão sem expor de quem são as posições', async () => {
    await carregar();
    componente.pedirRemocao();
    componente.confirmarRemocao();
    await fixture.whenStable();

    const { corpo, opcoes } = erroDoServidor('ACA-003', 409);
    controle.expectOne('/acoes/PETR4').flush(corpo, opcoes);
    await fixture.whenStable();

    expect(componente.textoDoErro()).toBe(
      'Esta ação tem posições abertas e não pode ser removida.',
    );
    expect(componente.acao()).not.toBeNull();
    expect(TestBed.inject(Router).url).not.toBe('/acoes');

    const mensagem = componente.textoDoErro() ?? '';
    for (const vazamento of ['investidor', 'carteira', 'dono', 'quantidade']) {
      expect(mensagem.toLowerCase()).not.toContain(vazamento);
    }
  });

  it('@spec:AC-147 ticker que não existe devolve o investidor à lista', async () => {
    await carregar(null);

    expect(TestBed.inject(Router).url).toBe('/acoes');
    const mensagens = TestBed.inject(FeedbackService).mensagens();
    expect(mensagens.some((m) => m.texto === 'Ação não encontrada.')).toBe(true);
  });
});
