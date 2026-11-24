import { fireEvent, render } from '@testing-library/react';
import { esperarElemento } from '@/test/servidor';
import { EditarOperacao } from './editar-operacao';
import { AlteracaoDeOperacao, OperacaoDoExtrato } from './operacoes.model';

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

function montar() {
  const salvas: AlteracaoDeOperacao[] = [];
  const canceladas: number[] = [];
  const { container } = render(<EditarOperacao operacao={OPERACAO} aoSalvar={(alteracao) => salvas.push(alteracao)} aoCancelar={() => canceladas.push(1)} />);
  const campo = (seletor: string) => container.querySelector(seletor) as HTMLInputElement;
  const digitar = (seletor: string, valor: string) => fireEvent.change(campo(seletor), { target: { value: valor } });
  const salvarEConfirmar = async () => {
    fireEvent.click(campo('[data-salvar]'));
    fireEvent.click(await esperarElemento(() => document.querySelector('[data-confirmar]')));
  };
  return { raiz: container, salvas, canceladas, campo, digitar, salvarEConfirmar };
}

describe('Edição de operação', () => {
  it('@spec:AC-174 só quantidade e preço unitário são editáveis', () => {
    const { raiz } = montar();

    expect(raiz.querySelector('[data-campo-quantidade]')).toBeTruthy();
    expect(raiz.querySelector('[data-preco-manual]')).toBeTruthy();
    const fixos = raiz.querySelector('[data-nao-editaveis]')!;
    expect(fixos.querySelector('[data-fixo="ticker"]')?.textContent).toContain('PETR4');
    expect(fixos.querySelector('[data-fixo="tipo"]')?.textContent).toContain('COMPRA');
    expect(fixos.querySelectorAll('input, select, textarea')).toHaveLength(0);
  });

  it('@spec:AC-174 a edição abre com a quantidade atual da operação', () => {
    expect(montar().campo('[data-campo-quantidade]').value).toBe('100');
  });

  it('@spec:AC-175 salvar pede confirmação avisando do recálculo antes de enviar', async () => {
    const { campo, digitar, salvas } = montar();
    digitar('[data-campo-quantidade]', '50');

    fireEvent.click(campo('[data-salvar]'));

    const caixa = await esperarElemento(() => document.querySelector('[role="alertdialog"]'));
    expect(caixa.textContent).toContain('Editar esta operação vai recalcular a posição e o resultado da carteira');
    expect(salvas).toEqual([]);
    fireEvent.click(document.querySelector('[data-confirmar]')!);
    expect(salvas).toEqual([{ quantidade: 50 }]);
  });

  it('@spec:AC-176 sem preço novo a tela avisa da reutilização e o envio não leva preço', async () => {
    const { raiz, digitar, salvarEConfirmar, salvas } = montar();
    digitar('[data-campo-quantidade]', '50');

    const aviso = raiz.querySelector('[data-sem-preco-novo]')!;
    expect(aviso.textContent).toContain('reutiliza a última cotação conhecida');
    expect(aviso.textContent).toContain('sem buscar preço novo');
    await salvarEConfirmar();
    expect('precoUnitario' in salvas[0]).toBe(false);
  });

  it('@spec:AC-176 com preço novo informado, ele vai na alteração', async () => {
    const { campo, digitar, salvarEConfirmar, salvas } = montar();
    digitar('[data-campo-quantidade]', '50');
    fireEvent.click(campo('[data-preco-manual]'));
    digitar('[data-campo-preco]', '31.4');

    await salvarEConfirmar();
    expect(salvas).toEqual([{ quantidade: 50, precoUnitario: 31.4 }]);
  });

  it('@spec:AC-177 preço novo com três casas decimais é recusado antes do envio', () => {
    const { raiz, campo, digitar, salvas } = montar();
    digitar('[data-campo-quantidade]', '50');
    fireEvent.click(campo('[data-preco-manual]'));
    digitar('[data-campo-preco]', '31.444');

    expect(raiz.querySelector('[data-erro]')?.textContent).toContain('no máximo 2 casas decimais');
    expect(campo('[data-salvar]').disabled).toBe(true);
    fireEvent.click(campo('[data-salvar]'));
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();
    expect(salvas).toEqual([]);
  });

  it('@spec:AC-182 cancelar a edição avisa quem a abriu e não envia nada', () => {
    const { campo, canceladas, salvas } = montar();

    fireEvent.click(campo('[data-cancelar-edicao]'));

    expect(canceladas).toHaveLength(1);
    expect(salvas).toEqual([]);
  });
});
