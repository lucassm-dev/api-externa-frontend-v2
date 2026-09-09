import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { Corretora } from '../corretoras.model';
import { CadastroCorretora } from './cadastro-corretora';

const CNPJ = '02.332.886/0001-04';

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
  complemento: null,
  bairro: 'Itaim Bibi',
  cidade: 'São Paulo',
  uf: 'SP',
  situacaoCadastral: 'ATIVA',
  validadaNaCvm: true,
  dataBaseCvm: '2026-09-08',
  dataCadastro: '2026-09-09T10:00:00',
};

function erroDoServidor(codigo: string, status: number, message: string) {
  return {
    corpo: {
      timestamp: '2026-09-09T12:00:00Z',
      status,
      codigo,
      error: 'erro',
      message,
      path: '/corretoras',
    },
    opcoes: { status, statusText: 'erro' },
  };
}

describe('Cadastro de corretora', () => {
  let fixture: ComponentFixture<CadastroCorretora>;
  let componente: CadastroCorretora;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'corretoras', children: [] },
          { path: 'corretoras/:id', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CadastroCorretora);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  async function enviar(cnpj = CNPJ) {
    componente.formulario.setValue({ cnpj });
    componente.enviar();
    await fixture.whenStable();
  }

  async function recusar(codigo: string, status: number, message: string) {
    await enviar();
    const { corpo, opcoes } = erroDoServidor(codigo, status, message);
    controle.expectOne('/corretoras').flush(corpo, opcoes);
    await fixture.whenStable();
  }

  it('@spec:AC-066 o formulário tem um campo só, o CNPJ', () => {
    const campos = [...elemento.querySelectorAll('input, select, textarea')];

    expect(campos.length).toBe(1);
    expect(campos[0].getAttribute('formcontrolname')).toBe('cnpj');
    expect(Object.keys(componente.formulario.controls)).toEqual(['cnpj']);

    const texto = elemento.textContent ?? '';
    for (const ausente of ['Razão social', 'Nome fantasia', 'Endereço', 'CEP', 'Telefone']) {
      expect(texto).not.toContain(ausente);
    }
  });

  it('@spec:AC-067 o CNPJ com máscara é enviado em dígitos puros', async () => {
    await enviar('02.332.886/0001-04');

    const requisicao = controle.expectOne('/corretoras');
    expect(requisicao.request.body).toEqual({ cnpj: '02332886000104' });
    requisicao.flush(CORRETORA);
  });

  it('@spec:AC-067 o CNPJ em dígitos puros é aceito do mesmo jeito', async () => {
    await enviar('02332886000104');

    const requisicao = controle.expectOne('/corretoras');
    expect(requisicao.request.body).toEqual({ cnpj: '02332886000104' });
    requisicao.flush(CORRETORA);
  });

  it('@spec:AC-068 enquanto consulta, a tela diz que está consultando as fontes externas', async () => {
    await enviar();

    const aviso = elemento.querySelector('[data-consultando]');
    expect(aviso).toBeTruthy();
    const texto = aviso?.textContent ?? '';
    expect(texto).toContain('Receita');
    expect(texto).toContain('CVM');

    controle.expectOne('/corretoras').flush(CORRETORA);
  });

  it('@spec:AC-069 nenhuma segunda requisição sai durante a consulta, e o botão fica indisponível', async () => {
    await enviar();

    componente.enviar();
    componente.enviar();
    (elemento.querySelector('[data-enviar]') as HTMLButtonElement).click();
    await fixture.whenStable();

    const requisicoes = controle.match('/corretoras');
    expect(requisicoes.length).toBe(1);
    expect((elemento.querySelector('[data-enviar]') as HTMLButtonElement).disabled).toBe(true);

    requisicoes[0].flush(CORRETORA);
  });

  it('@spec:AC-070 cadastro aceito leva à corretora criada, validada e com a data da base', async () => {
    const router = TestBed.inject(Router);
    const destinos: string[] = [];
    router.events.subscribe(() => destinos.push(router.url));

    await enviar();
    controle.expectOne('/corretoras').flush(CORRETORA);
    await fixture.whenStable();

    expect(router.url).toBe('/corretoras/7');
  });

  it('@spec:AC-071 a recusa mostra o motivo específico que o servidor informou', async () => {
    await recusar('COR-003', 422, 'Esta empresa não consta como corretora autorizada na CVM.');

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Esta empresa não consta como corretora autorizada na CVM.');
  });

  it('@spec:AC-071 cada motivo de COR-003 chega distinto, sem virar uma mensagem resumida', async () => {
    const motivos = [
      'CNPJ inválido.',
      'CNPJ não encontrado na Receita Federal.',
      'CEP não encontrado.',
      'Esta empresa não consta como corretora autorizada na CVM.',
    ];
    const exibidos: string[] = [];

    for (const motivo of motivos) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([erroInterceptor])),
          provideHttpClientTesting(),
          provideRouter([{ path: 'corretoras/:id', children: [] }]),
        ],
      });
      controle = TestBed.inject(HttpTestingController);
      fixture = TestBed.createComponent(CadastroCorretora);
      componente = fixture.componentInstance;
      elemento = fixture.nativeElement as HTMLElement;
      await fixture.whenStable();

      await recusar('COR-003', 422, motivo);
      exibidos.push(elemento.textContent ?? '');
    }

    for (const [indice, motivo] of motivos.entries()) {
      expect(exibidos[indice]).toContain(motivo);
    }
    expect(new Set(exibidos).size).toBe(motivos.length);
  });

  it('@spec:AC-072 falha de verificação não é apresentada como reprovação da empresa', async () => {
    await recusar('EXT-007', 503, 'CVM indisponível');

    const texto = elemento.textContent ?? '';
    expect(texto).toContain('Não conseguimos verificar esta corretora agora. Tente novamente em instantes.');
    expect(texto).not.toContain('não consta');
    expect(texto).not.toContain('não autorizada');
    expect(texto).not.toContain('inválido');
    expect(texto).not.toContain('CVM indisponível');
  });

  it('@spec:AC-072 recusa e falha de verificação produzem textos diferentes', async () => {
    await recusar('COR-003', 422, 'Esta empresa não consta como corretora autorizada na CVM.');
    const recusaCor003 = componente.textoDoErro();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([{ path: 'corretoras/:id', children: [] }]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CadastroCorretora);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    await recusar('EXT-007', 503, 'CVM indisponível');
    const falhaExt007 = componente.textoDoErro();

    expect(recusaCor003).toBeTruthy();
    expect(falhaExt007).toBeTruthy();
    expect(recusaCor003).not.toBe(falhaExt007);
  });

  it('@spec:AC-073 COR-003 preserva o CNPJ digitado e destaca o campo', async () => {
    await recusar('COR-003', 422, 'CNPJ não encontrado na Receita Federal.');

    const campo = elemento.querySelector('input[formcontrolname="cnpj"]') as HTMLInputElement;
    expect(campo.value).toBe(CNPJ);
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(elemento.querySelector('mat-error')).toBeTruthy();
  });

  it('@spec:AC-073 EXT-007 preserva o CNPJ digitado e destaca o campo', async () => {
    await recusar('EXT-007', 503, 'fonte fora do ar');

    const campo = elemento.querySelector('input[formcontrolname="cnpj"]') as HTMLInputElement;
    expect(campo.value).toBe(CNPJ);
    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(elemento.querySelector('mat-error')).toBeTruthy();
  });

  it('@spec:AC-074 cadastro recusado não navega para corretora nenhuma nem cria registro', async () => {
    const router = TestBed.inject(Router);

    await recusar('COR-003', 422, 'CNPJ inválido.');

    expect(router.url).not.toContain('/corretoras/');
    expect(componente.corretoraExistente()).toBeNull();
    controle.verify();
  });

  it('@spec:AC-075 CNPJ já cadastrado mostra a corretora existente e oferece abri-la', async () => {
    await recusar('COR-002', 409, 'já cadastrada');

    controle.expectOne('/corretoras/cnpj/02332886000104').flush(CORRETORA);
    await fixture.whenStable();

    const cartao = elemento.querySelector('[data-existente]') as HTMLElement;
    expect(cartao).toBeTruthy();
    expect(cartao.textContent).toContain('XP');
    expect(cartao.textContent).toContain('02.332.886/0001-04');
    expect(cartao.querySelector('[data-abrir]')?.getAttribute('href')).toBe('/corretoras/7');
  });

  it('@spec:AC-075 COR-002 não termina em erro sem saída', async () => {
    await recusar('COR-002', 409, 'já cadastrada');
    controle.expectOne('/corretoras/cnpj/02332886000104').flush(CORRETORA);
    await fixture.whenStable();

    expect(componente.corretoraExistente()?.id).toBe(7);
    expect(elemento.querySelector('[data-abrir]')).toBeTruthy();
  });

  it('CNPJ que nem chega a ser CNPJ é barrado antes do envio', async () => {
    await enviar('123');

    controle.expectNone('/corretoras');
    expect(componente.formulario.controls.cnpj.invalid).toBe(true);
  });
});

describe('Cadastro de corretora chamado pela criação de carteira', () => {
  it('@spec:AC-092 cadastro concluído devolve o investidor à criação de carteira', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'corretoras/:id', children: [] },
          { path: 'carteiras/nova', children: [] },
        ]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ voltarPara: '/carteiras/nova' }) },
          },
        },
      ],
    });
    const controle = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(CadastroCorretora);
    await fixture.whenStable();

    fixture.componentInstance.formulario.setValue({ cnpj: CNPJ });
    fixture.componentInstance.enviar();
    await fixture.whenStable();

    controle.expectOne('/corretoras').flush({ id: 7, cnpj: CNPJ });
    await fixture.whenStable();

    expect(router.url).toBe('/carteiras/nova');
  });
});
