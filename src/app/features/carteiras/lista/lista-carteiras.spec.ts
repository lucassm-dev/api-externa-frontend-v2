import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { Carteira } from '../carteiras.model';
import { ListaCarteiras } from './lista-carteiras';

const DIVIDENDOS: Carteira = {
  id: 9,
  investidorId: 1,
  corretoraId: 7,
  nomeCorretora: 'XP Investimentos',
  mercado: 'BR',
  moeda: 'BRL',
  nome: 'Dividendos',
  ativa: true,
};

const SMALL_CAPS: Carteira = { ...DIVIDENDOS, id: 4, nome: 'Small caps', mercado: 'US' };

const CONSOLIDADO = {
  valorInvestido: 10_000,
  valorDeMercado: 11_500.5,
  lucroNaoRealizado: 1_500.5,
  taxaCambioAtual: 5.42,
  dataHoraTaxaCambio: '2026-09-09T12:00:00',
  avisos: [],
};

describe('Lista de carteiras', () => {
  let fixture: ComponentFixture<ListaCarteiras>;
  let componente: ListaCarteiras;
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
          { path: 'carteiras/nova', children: [] },
          { path: 'carteiras/:id', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ListaCarteiras);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function responderLista(carteiras: Carteira[], totalPages = 1, number = 0) {
    controle.expectOne((r) => r.url === '/carteiras').flush({
      content: carteiras,
      totalElements: carteiras.length,
      totalPages,
      number,
      size: 20,
    });
    await fixture.whenStable();
  }

  async function responderNumeros(id: number, consolidadoOk = true) {
    const consolidado = controle.expectOne(`/carteiras/${id}/consolidado`);
    if (consolidadoOk) {
      consolidado.flush(CONSOLIDADO);
    } else {
      consolidado.flush('', { status: 500, statusText: 'Erro' });
    }
    controle
      .expectOne(`/carteiras/${id}/lucro-realizado`)
      .flush({ total: 320.75, porTicker: { PETR4: 320.75 } });
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await montar();
  });

  it('@spec:AC-096 cada linha traz nome, corretora, mercado e os números da carteira', async () => {
    await responderLista([DIVIDENDOS]);
    await responderNumeros(9);

    const linha = elemento.querySelector('[data-carteira="9"]') as HTMLElement;
    expect(linha.textContent).toContain('Dividendos');
    expect(linha.textContent).toContain('XP Investimentos');
    expect(linha.textContent).toContain('Brasil');
    expect(linha.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(linha.querySelector('[data-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(linha.querySelector('[data-realizado]')?.textContent).toContain('320,75');
  });

  it('@spec:AC-097 a lista pede a página ordenada da mais recente para a mais antiga', async () => {
    const requisicao = controle.expectOne((r) => r.url === '/carteiras');
    expect(requisicao.request.params.get('sort')).toBe('id,desc');
    requisicao.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 });
    await fixture.whenStable();
  });

  it('@spec:AC-097 avançar de página pede a página seguinte ao servidor', async () => {
    await responderLista([DIVIDENDOS], 2);
    await responderNumeros(9);

    componente.irPara(1);
    await fixture.whenStable();

    const requisicao = controle.expectOne((r) => r.url === '/carteiras');
    expect(requisicao.request.params.get('page')).toBe('1');
    requisicao.flush({ content: [], totalElements: 1, totalPages: 2, number: 1, size: 20 });
    await fixture.whenStable();
  });

  it('@spec:AC-097 a ordem exibida é a que o servidor devolveu', async () => {
    await responderLista([DIVIDENDOS, SMALL_CAPS]);
    await responderNumeros(9);
    await responderNumeros(4);

    const ids = Array.from(elemento.querySelectorAll('[data-carteira]')).map((l) =>
      l.getAttribute('data-carteira'),
    );
    expect(ids).toEqual(['9', '4']);
  });

  it('@spec:AC-098 cada linha oferece abrir, renomear e excluir', async () => {
    await responderLista([DIVIDENDOS]);
    await responderNumeros(9);

    const linha = elemento.querySelector('[data-carteira="9"]') as HTMLElement;
    expect(linha.querySelector('[data-abrir]')).toBeTruthy();
    expect(linha.querySelector('[data-renomear]')).toBeTruthy();
    expect(linha.querySelector('[data-excluir]')).toBeTruthy();
  });

  it('@spec:AC-099 nada na tela sugere carteiras de outros investidores', async () => {
    await responderLista([DIVIDENDOS]);
    await responderNumeros(9);

    const texto = elemento.textContent ?? '';
    expect(texto).not.toMatch(/outro investidor|outros investidores|todos os investidores|compartilhad/i);
    expect(elemento.querySelector('[data-busca-investidor]')).toBeNull();
  });

  it('@spec:AC-100 número que falha some da linha, sem derrubar a lista nem alarmar', async () => {
    const feedback = TestBed.inject(FeedbackService);
    await responderLista([DIVIDENDOS, SMALL_CAPS]);
    await responderNumeros(9, false);
    await responderNumeros(4);

    expect(elemento.querySelectorAll('[data-carteira]').length).toBe(2);

    const semNumeros = elemento.querySelector('[data-carteira="9"]') as HTMLElement;
    expect(semNumeros.querySelector('[data-valor-de-mercado]')).toBeNull();
    expect(semNumeros.querySelector('[data-realizado]')?.textContent).toContain('320,75');

    const comNumeros = elemento.querySelector('[data-carteira="4"]') as HTMLElement;
    expect(comNumeros.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');

    expect(feedback.mensagens().filter((m) => m.nivel === 'erro')).toEqual([]);
    expect(elemento.textContent).not.toMatch(/algo deu errado/i);
  });

  it('@spec:AC-119 excluir faz a carteira sumir, sem lixeira e sem desfazer', async () => {
    await responderLista([DIVIDENDOS, SMALL_CAPS]);
    await responderNumeros(9);
    await responderNumeros(4);

    componente.pedirExclusao(DIVIDENDOS);
    await fixture.whenStable();
    (elemento.querySelector('[data-confirmar]') as HTMLButtonElement).click();
    await fixture.whenStable();

    controle.expectOne('/carteiras/9').flush(null);
    await fixture.whenStable();
    await responderLista([SMALL_CAPS]);
    await responderNumeros(4);

    expect(elemento.querySelector('[data-carteira="9"]')).toBeNull();
    expect(elemento.textContent).not.toMatch(/lixeira|desfazer|inativ/i);
  });

  it('@spec:AC-119 a confirmação descreve a consequência antes de excluir', async () => {
    await responderLista([DIVIDENDOS]);
    await responderNumeros(9);

    componente.pedirExclusao(DIVIDENDOS);
    await fixture.whenStable();

    const dialogo = elemento.querySelector('app-dialogo-confirmacao') as HTMLElement;
    expect(dialogo.textContent).toMatch(/não há como desfazer/i);
    controle.expectNone('/carteiras/9');
  });
});
