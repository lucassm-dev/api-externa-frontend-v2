import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlteracaoDeOperacao, OperacaoDoExtrato } from '../operacoes.model';
import { EditarOperacao } from './editar-operacao';

const OPERACAO: OperacaoDoExtrato = {
  id: 7,
  carteiraId: 9,
  ticker: 'PETR4',
  tipo: 'COMPRA',
  quantidade: 100,
  precoUnitario: 32.5,
  valorTotal: 3250,
  dataHora: '2026-09-09T10:00:00',
  moeda: 'BRL',
};

describe('Edição de operação', () => {
  let fixture: ComponentFixture<EditarOperacao>;
  let componente: EditarOperacao;
  let elemento: HTMLElement;
  let salvas: AlteracaoDeOperacao[];

  async function montar() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(EditarOperacao);
    componente = fixture.componentInstance;
    fixture.componentRef.setInput('operacao', OPERACAO);
    elemento = fixture.nativeElement as HTMLElement;
    salvas = [];
    componente.salvar.subscribe((alteracao) => salvas.push(alteracao));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => await montar());

  it('@spec:AC-174 só quantidade e preço unitário são editáveis', () => {
    expect(elemento.querySelector('[data-campo-quantidade]')).toBeTruthy();
    expect(elemento.querySelector('[data-preco-manual]')).toBeTruthy();

    const fixos = elemento.querySelector('[data-nao-editaveis]')!;
    expect(fixos.querySelector('[data-fixo-ticker]')!.textContent).toContain('PETR4');
    expect(fixos.querySelector('[data-fixo-tipo]')!.textContent).toContain('COMPRA');
    expect(fixos.querySelectorAll('input, select, textarea').length).toBe(0);
  });

  it('@spec:AC-174 a edição abre com a quantidade atual da operação', () => {
    expect(componente.quantidade()).toBe(100);
  });

  it('@spec:AC-175 salvar pede confirmação avisando do recálculo antes de enviar', () => {
    componente.quantidade.set(50);
    fixture.detectChanges();

    elemento.querySelector<HTMLButtonElement>('[data-salvar]')!.click();
    fixture.detectChanges();

    const dialogo = elemento.querySelector('[data-confirmar-edicao]')!;
    expect(dialogo).toBeTruthy();
    expect(dialogo.textContent).toContain(
      'Editar esta operação vai recalcular a posição e o resultado da carteira',
    );
    expect(salvas).toEqual([]);

    componente.confirmar();
    expect(salvas).toEqual([{ quantidade: 50 }]);
  });

  it('@spec:AC-176 sem preço novo a tela avisa da reutilização e o envio não leva preço', () => {
    componente.quantidade.set(50);
    fixture.detectChanges();

    const aviso = elemento.querySelector('[data-sem-preco-novo]')!;
    expect(aviso.textContent).toContain('reutiliza a última cotação conhecida');
    expect(aviso.textContent).toContain('sem buscar preço novo');

    componente.confirmar();
    expect('precoUnitario' in salvas[0]).toBe(false);
  });

  it('@spec:AC-176 com preço novo informado, ele vai na alteração', () => {
    componente.quantidade.set(50);
    componente.alternarPrecoManual(true);
    componente.precoUnitario.set(31.4);
    fixture.detectChanges();

    componente.confirmar();
    expect(salvas).toEqual([{ quantidade: 50, precoUnitario: 31.4 }]);
  });

  it('@spec:AC-177 preço novo com três casas decimais é recusado antes do envio', () => {
    componente.quantidade.set(50);
    componente.alternarPrecoManual(true);
    componente.precoUnitario.set(31.444);
    fixture.detectChanges();

    expect(elemento.querySelector('[data-preco-casas]')).toBeTruthy();
    componente.confirmar();
    expect(salvas).toEqual([]);
  });

  it('@spec:AC-182 cancelar a edição avisa quem a abriu e não envia nada', () => {
    let cancelou = false;
    componente.cancelar.subscribe(() => (cancelou = true));

    elemento.querySelector<HTMLButtonElement>('[data-cancelar-edicao]')!.click();

    expect(cancelou).toBe(true);
    expect(salvas).toEqual([]);
  });
});
