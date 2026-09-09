import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { erroInterceptor } from '../../../core/erros/erro.interceptor';
import { Corretora } from '../../corretoras/corretoras.model';
import { CriarCarteira } from './criar-carteira';

const CORRETORA = {
  id: 7,
  cnpj: '02332886000104',
  razaoSocial: 'XP INVESTIMENTOS CCTVM S.A.',
  nomeFantasia: 'XP Investimentos',
} as Corretora;

describe('Criar carteira', () => {
  let fixture: ComponentFixture<CriarCarteira>;
  let componente: CriarCarteira;
  let controle: HttpTestingController;
  let elemento: HTMLElement;

  async function montar(corretoras: Corretora[]) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'carteiras/nova', children: [] },
          { path: 'carteiras/:id', children: [] },
          { path: 'corretoras/nova', children: [] },
        ]),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CriarCarteira);
    componente = fixture.componentInstance;
    elemento = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();

    controle.expectOne((r) => r.url === '/corretoras').flush({
      content: corretoras,
      totalElements: corretoras.length,
      totalPages: 1,
      number: 0,
      size: 20,
    });
    await fixture.whenStable();
  }

  it('@spec:AC-091 o formulário pede nome, corretora e mercado, e nada mais', async () => {
    await montar([CORRETORA]);

    const entradas = elemento.querySelectorAll('input, select, textarea');
    expect(entradas.length).toBe(3);
    expect(elemento.querySelector('[data-campo-nome]')).toBeTruthy();
    expect(elemento.querySelector('[data-campo-corretora]')).toBeTruthy();
    expect(elemento.querySelector('[data-campo-mercado]')).toBeTruthy();
  });

  it('@spec:AC-091 a corretora é escolhida entre as do catálogo', async () => {
    await montar([CORRETORA]);

    const opcoes = elemento.querySelectorAll('[data-campo-corretora] option[value]');
    expect(Array.from(opcoes).map((o) => o.textContent?.trim())).toContain('XP Investimentos');
  });

  it('@spec:AC-092 catálogo vazio não vira seletor vazio: a tela conduz ao cadastro de corretora', async () => {
    await montar([]);

    expect(elemento.querySelector('[data-campo-corretora]')).toBeNull();
    expect(elemento.textContent).toMatch(/corretora/i);

    const atalho = elemento.querySelector('[data-cadastrar-corretora]') as HTMLAnchorElement;
    expect(atalho).toBeTruthy();
    expect(atalho.getAttribute('href')).toContain('/corretoras/nova');
    expect(atalho.getAttribute('href')).toContain('voltarPara=%2Fcarteiras%2Fnova');
  });

  it('@spec:AC-093 sem mercado escolhido nenhuma criação é enviada', async () => {
    await montar([CORRETORA]);

    componente.formulario.patchValue({ nome: 'Dividendos', corretoraId: 7, mercado: null });
    componente.enviar();
    await fixture.whenStable();

    controle.expectNone('/carteiras');
    expect(elemento.textContent).toMatch(/escolha o mercado/i);
  });

  it('@spec:AC-093 a criação leva exatamente o mercado escolhido pelo investidor', async () => {
    await montar([CORRETORA]);

    componente.formulario.patchValue({ nome: 'Small caps', corretoraId: 7, mercado: 'US' });
    componente.enviar();
    await fixture.whenStable();

    const requisicao = controle.expectOne('/carteiras');
    expect(requisicao.request.body).toEqual({ corretoraId: 7, mercado: 'US', nome: 'Small caps' });
  });

  it('@spec:AC-094 carteira criada abre no detalhe dela', async () => {
    await montar([CORRETORA]);
    const router = TestBed.inject(Router);

    componente.formulario.patchValue({ nome: 'Dividendos', corretoraId: 7, mercado: 'BR' });
    componente.enviar();
    await fixture.whenStable();

    controle.expectOne('/carteiras').flush({
      id: 9,
      investidorId: 1,
      corretoraId: 7,
      nomeCorretora: 'XP Investimentos',
      mercado: 'BR',
      moeda: 'BRL',
      nome: 'Dividendos',
      ativa: true,
    });
    await fixture.whenStable();

    expect(router.url).toBe('/carteiras/9');
  });

  it('@spec:AC-095 o mercado é apresentado como moeda de referência, sem restringir a carteira', async () => {
    await montar([CORRETORA]);

    const texto = elemento.textContent ?? '';
    expect(texto).toMatch(/moeda de referência/i);
    expect(texto).toMatch(/aceita ações dos dois mercados/i);
    expect(texto).not.toMatch(/apenas ações|somente ações|só aceita/i);
  });
});
