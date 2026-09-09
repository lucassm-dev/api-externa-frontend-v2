import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { FeedbackService } from '../../../core/feedback/feedback.service';
import { Corretora } from '../corretoras.model';
import { DetalheCorretora } from './detalhe-corretora';

const CORRETORA: Corretora = {
  id: 7,
  cnpj: '02332886000104',
  razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.',
  nomeFantasia: 'XP Investimentos',
  email: 'contato@xp.com.br',
  telefone: '1130000000',
  cep: '04538133',
  logradouro: 'Avenida Brigadeiro Faria Lima',
  numero: '3600',
  complemento: '10 andar',
  bairro: 'Itaim Bibi',
  cidade: 'São Paulo',
  uf: 'SP',
  situacaoCadastral: 'ATIVA',
  validadaNaCvm: true,
  dataBaseCvm: '2026-09-08',
  dataCadastro: '2026-09-09T10:00:00',
};

describe('Detalhe da corretora', () => {
  let fixture: ComponentFixture<DetalheCorretora>;
  let componente: DetalheCorretora;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'corretoras', children: [] }]),
        { provide: ActivatedRoute, useValue: { paramMap: of(new Map([['id', '7']])) } },
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DetalheCorretora);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  }

  async function carregar(corretora = CORRETORA) {
    controle.expectOne('/corretoras/7').flush(corretora);
    await fixture.whenStable();
  }

  async function pedirRemocao() {
    componente.pedirRemocao();
    await fixture.whenStable();
    (elemento.querySelector('[data-confirmar]') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await montar();
  });

  it('@spec:AC-084 mostra os dados cadastrais e o endereço completo', async () => {
    await carregar();

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('XP INVESTIMENTOS CCTVM S.A.');
    expect(texto).toContain('XP Investimentos');
    expect(texto).toContain('02.332.886/0001-04');
    expect(texto).toContain('ATIVA');
    expect(texto).toContain('contato@xp.com.br');
    expect(texto).toContain('1130000000');
    expect(texto).toContain('04538133');
    expect(texto).toContain('Avenida Brigadeiro Faria Lima');
    expect(texto).toContain('3600');
    expect(texto).toContain('10 andar');
    expect(texto).toContain('Itaim Bibi');
    expect(texto).toContain('São Paulo');
    expect(texto).toContain('SP');
  });

  it('@spec:AC-085 a validação na CVM vem junto da data da base oficial usada', async () => {
    await carregar();

    const validacao = elemento.querySelector('[data-validacao]') as HTMLElement;
    expect(validacao.textContent).toMatch(/validada/i);

    const base = elemento.querySelector('[data-base-cvm]') as HTMLElement;
    expect(base).toBeTruthy();
    expect(base.textContent).toContain('08/09/2026');
  });

  it('@spec:AC-085 corretora sem validação não ganha marca de validada', async () => {
    await carregar({ ...CORRETORA, validadaNaCvm: false, dataBaseCvm: '2026-09-08' });

    expect(elemento.querySelector('[data-validacao]')?.textContent).not.toMatch(/^Validada/i);
  });

  it('@spec:AC-086 corretora inexistente devolve o investidor à lista com a mensagem do catálogo', async () => {
    const router = TestBed.inject(Router);
    const feedback = TestBed.inject(FeedbackService);

    controle.expectOne('/corretoras/7').flush(
      { timestamp: '', status: 404, codigo: 'COR-001', error: '', message: 'sumiu', path: '' },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(router.url).toBe('/corretoras');
    expect(feedback.mensagens().some((m) => m.texto === 'Corretora não encontrada.')).toBe(true);
  });

  it('@spec:AC-087 remover abre o diálogo de confirmação com a consequência descrita', async () => {
    await carregar();

    componente.pedirRemocao();
    await fixture.whenStable();

    const dialogo = elemento.querySelector('app-dialogo-confirmacao') as HTMLElement;
    expect(dialogo).toBeTruthy();
    expect(dialogo.querySelector('[data-consequencia]')?.textContent?.length).toBeGreaterThan(10);
    expect(dialogo.querySelectorAll('button').length).toBe(2);
    expect(dialogo.querySelectorAll('input').length).toBe(0);
  });

  it('@spec:AC-088 confirmar remove a corretora e volta à lista, sem lixeira nem desfazer', async () => {
    await carregar();
    const router = TestBed.inject(Router);

    await pedirRemocao();
    const requisicao = controle.expectOne('/corretoras/7');
    expect(requisicao.request.method).toBe('DELETE');
    requisicao.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(router.url).toBe('/corretoras');
    const texto = elemento.textContent ?? '';
    expect(texto).not.toMatch(/lixeira|desfazer|inativ/i);
  });

  it('@spec:AC-089 COR-004 cancela a exclusão sem revelar de quem são as carteiras', async () => {
    await carregar();
    const router = TestBed.inject(Router);

    await pedirRemocao();
    controle.expectOne('/corretoras/7').flush(
      { timestamp: '', status: 409, codigo: 'COR-004', error: '', message: 'a carteira "Longo prazo" do investidor 42 usa esta corretora', path: '' },
      { status: 409, statusText: 'Conflict' },
    );
    await fixture.whenStable();

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Esta corretora tem carteiras vinculadas e não pode ser removida.');
    expect(texto).not.toMatch(/investidor|Longo prazo|42|outro|dono/i);
    expect(elemento.querySelector('app-dialogo-confirmacao')).toBeNull();
    expect(router.url).not.toBe('/corretoras');
    expect(componente.corretora()?.id).toBe(7);
  });

  it('@spec:AC-090 remover está disponível em qualquer corretora, sem checar quem cadastrou', async () => {
    await carregar();

    const remover = elemento.querySelector('[data-remover]') as HTMLButtonElement;
    expect(remover).toBeTruthy();
    expect(remover.disabled).toBe(false);
    expect(elemento.textContent).not.toMatch(/cadastrada por|quem cadastrou|dono|proprietári/i);
  });
});
