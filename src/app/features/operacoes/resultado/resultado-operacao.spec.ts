import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Operacao } from '../operacoes.model';
import { ResultadoOperacao } from './resultado-operacao';

const COMPRA: Operacao = {
  id: 1,
  carteiraId: 9,
  ticker: 'PETR4',
  tipo: 'COMPRA',
  quantidade: 100,
  precoUnitario: 32.7,
  valorTotal: 3270,
  dataHora: '2026-09-09T10:00:00',
  moeda: 'BRL',
  avisos: [],
};

const VENDA: Operacao = {
  ...COMPRA,
  id: 2,
  tipo: 'VENDA',
  quantidade: 50,
  precoUnitario: 40,
  valorTotal: 2000,
  lucroRealizado: 500,
  precoMedioCompraNoMomento: 30,
};

describe('Resultado da operação', () => {
  let fixture: ComponentFixture<ResultadoOperacao>;
  let elemento: HTMLElement;

  function montar(operacao: Operacao) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(ResultadoOperacao);
    fixture.componentRef.setInput('operacao', operacao);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  }

  it('@spec:AC-155 mostra os números da resposta, com o preço efetivo e não a estimativa', () => {
    montar({ ...COMPRA, precoUnitario: 32.7, valorTotal: 3270 });

    expect(elemento.querySelector('[data-preco-efetivo]')!.textContent).toContain('32,70');
    expect(elemento.querySelector('[data-quantidade]')!.textContent).toContain('100');
    expect(elemento.querySelector('[data-total]')!.textContent).toContain('3.270,00');
    expect(elemento.querySelector('[data-quando]')!.textContent!.trim()).not.toBe('');
    expect(elemento.textContent).not.toContain('32,50');
  });

  it('@spec:AC-160 depois da venda, resultado realizado e preço médio aparecem identificados', () => {
    montar(VENDA);

    const lucro = elemento.querySelector('[data-lucro-realizado]')!;
    const medio = elemento.querySelector('[data-preco-medio]')!;
    expect(lucro.textContent).toContain('500,00');
    expect(medio.textContent).toContain('30,00');
    expect(elemento.textContent).toContain('Resultado realizado desta venda');
    expect(elemento.textContent).toContain('Preço médio de compra vigente');
  });

  it('@spec:AC-160 a compra não exibe resultado realizado', () => {
    montar(COMPRA);

    expect(elemento.querySelector('[data-lucro-realizado]')).toBeNull();
  });

  it('@spec:AC-166 uma operação com avisos é apresentada como registrada', () => {
    montar({
      ...COMPRA,
      avisos: ['O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.'],
    });

    expect(elemento.querySelector('[data-confirmacao]')!.textContent).toContain('registrada');
    expect(elemento.querySelector('[data-preco-efetivo]')).toBeTruthy();
    expect(elemento.textContent!.toLowerCase()).not.toContain('falh');
    expect(elemento.textContent!.toLowerCase()).not.toContain('não foi possível registrar');
    expect(elemento.textContent!.toLowerCase()).not.toContain('tente novamente');
  });

  it('@spec:AC-167 cada aviso sai no nível aviso, e nenhum elemento de erro é renderizado', () => {
    montar({
      ...COMPRA,
      avisos: [
        'O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.',
        'A cotação do dólar está indisponível. O valor usa a taxa de 08:00.',
      ],
    });

    const mensagens = elemento.querySelectorAll('app-mensagem-feedback');
    expect(mensagens.length).toBe(2);
    for (const mensagem of mensagens) {
      expect(mensagem.querySelector('[data-nivel="aviso"]')).toBeTruthy();
      expect(mensagem.querySelector('[data-rotulo]')!.textContent).toBe('Aviso');
    }
    expect(elemento.querySelectorAll('[data-nivel="erro"]').length).toBe(0);
    expect(elemento.querySelectorAll('[role="alert"]').length).toBe(0);
  });

  it('@spec:AC-168 uma resposta sem avisos não exibe aviso nenhum', () => {
    montar(COMPRA);

    expect(elemento.querySelector('[data-avisos]')).toBeNull();
    expect(elemento.querySelectorAll('app-mensagem-feedback').length).toBe(0);
  });
});
