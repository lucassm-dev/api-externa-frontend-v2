import { render } from '@testing-library/react';
import { Operacao } from './operacoes.model';
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

const VENDA: Operacao = { ...COMPRA, id: 2, tipo: 'VENDA', quantidade: 50, precoUnitario: 40, valorTotal: 2000, lucroRealizado: 500, precoMedioCompraNoMomento: 30 };

const montar = (operacao: Operacao) => render(<ResultadoOperacao operacao={operacao} />).container;

describe('Resultado da operação', () => {
  it('@spec:AC-155 mostra os números da resposta, com o preço efetivo e não a estimativa', () => {
    const raiz = montar(COMPRA);

    expect(raiz.querySelector('[data-preco-efetivo]')!.textContent).toContain('32,70');
    expect(raiz.querySelector('[data-quantidade]')!.textContent).toContain('100');
    expect(raiz.querySelector('[data-total]')!.textContent).toContain('3.270,00');
    expect(raiz.querySelector('[data-quando]')!.textContent!.trim()).not.toBe('');
    expect(raiz.textContent).not.toContain('32,50');
  });

  it('@spec:AC-160 depois da venda, resultado realizado e preço médio aparecem identificados', () => {
    const raiz = montar(VENDA);

    expect(raiz.querySelector('[data-lucro-realizado]')!.textContent).toContain('500,00');
    expect(raiz.querySelector('[data-preco-medio]')!.textContent).toContain('30,00');
    expect(raiz.textContent).toContain('Resultado realizado desta venda');
    expect(raiz.textContent).toContain('Preço médio de compra vigente');
  });

  it('@spec:AC-160 a compra não exibe resultado realizado', () => {
    expect(montar(COMPRA).querySelector('[data-lucro-realizado]')).toBeNull();
  });

  it('@spec:AC-166 uma operação com avisos é apresentada como registrada', () => {
    const raiz = montar({ ...COMPRA, avisos: ['O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.'] });
    const texto = raiz.textContent!.toLowerCase();

    expect(raiz.querySelector('[data-confirmacao]')!.textContent).toContain('registrada');
    expect(raiz.querySelector('[data-preco-efetivo]')).toBeTruthy();
    expect(texto).not.toContain('falh');
    expect(texto).not.toContain('não foi possível registrar');
    expect(texto).not.toContain('tente novamente');
  });

  it('@spec:AC-167 cada aviso sai no nível aviso, e nenhum elemento de erro é renderizado', () => {
    const raiz = montar({
      ...COMPRA,
      avisos: ['O limite de consultas da fonte foi atingido. O preço exibido é de 09:40.', 'A cotação do dólar está indisponível. O valor usa a taxa de 08:00.'],
    });

    const mensagens = raiz.querySelectorAll('[data-avisos] [data-nivel]');
    expect(mensagens).toHaveLength(2);
    for (const mensagem of mensagens) {
      expect(mensagem.getAttribute('data-nivel')).toBe('aviso');
      expect(mensagem.querySelector('[data-rotulo]')!.textContent).toBe('Aviso');
    }
    expect(raiz.querySelectorAll('[data-nivel="erro"]')).toHaveLength(0);
    expect(raiz.querySelectorAll('[role="alert"]')).toHaveLength(0);
  });

  it('@spec:AC-168 uma resposta sem avisos não exibe aviso nenhum', () => {
    const raiz = montar(COMPRA);

    expect(raiz.querySelector('[data-avisos]')).toBeNull();
    expect(raiz.querySelectorAll('[data-nivel]')).toHaveLength(0);
  });
});
