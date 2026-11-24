import { Posicao } from '@/features/carteiras/carteiras.model';
import { acoesVendaveis, disponivelDe, vendaExcedePosicao } from './disponivel-para-venda';
import { estimarOperacao, precoManualTemCasasDemais } from './preco-da-operacao';

function posicao(ticker: string, quantidade: number): Posicao {
  return { id: 1, ticker, nomeEmpresa: `Empresa ${ticker}`, quantidade, precoMedio: 10, cotacaoAtual: 12, dataHoraCotacao: '2026-09-09T10:00:00', rentabilidadeNaoRealizada: 0 };
}

describe('Disponível para venda', () => {
  it('@spec:AC-157 as vendáveis são exatamente as ações com posição na carteira', () => {
    const vendaveis = acoesVendaveis([posicao('PETR4', 100), posicao('VALE3', 50)]);

    expect(vendaveis.map((acao) => acao.ticker)).toEqual(['PETR4', 'VALE3']);
    expect(vendaveis[0].quantidadeDisponivel).toBe(100);
  });

  it('@spec:AC-157 posição zerada não é vendável e some da lista', () => {
    expect(acoesVendaveis([posicao('PETR4', 0)])).toEqual([]);
    expect(acoesVendaveis([])).toEqual([]);
  });

  it('@spec:AC-158 o disponível de cada ação é o que a posição informa', () => {
    const vendaveis = acoesVendaveis([posicao('PETR4', 100)]);

    expect(disponivelDe(vendaveis, 'PETR4')).toBe(100);
    expect(disponivelDe(vendaveis, 'VALE3')).toBeNull();
  });

  it('@spec:AC-158 vender acima do disponível é recusado antes de qualquer envio', () => {
    const vendaveis = acoesVendaveis([posicao('PETR4', 100)]);

    expect(vendaExcedePosicao(vendaveis, 'PETR4', 150)).toBe(true);
    expect(vendaExcedePosicao(vendaveis, 'PETR4', 100)).toBe(false);
    expect(vendaExcedePosicao(vendaveis, 'PETR4', 10)).toBe(false);
  });

  it('@spec:AC-158 sem ação escolhida ou sem quantidade não há excesso a acusar', () => {
    const vendaveis = acoesVendaveis([posicao('PETR4', 100)]);

    expect(vendaExcedePosicao(vendaveis, null, 10)).toBe(false);
    expect(vendaExcedePosicao(vendaveis, 'PETR4', null)).toBe(false);
  });
});

const AGORA = '2026-09-09T10:00:00';

describe('Preço da operação', () => {
  it('@spec:AC-165 a estimativa traz preço, total e o horário da cotação usada', () => {
    expect(estimarOperacao(32.5, AGORA, 100)).toEqual({ precoUnitario: 32.5, valorTotal: 3250, obtidoEm: AGORA });
  });

  it('@spec:AC-165 sem cotação, sem horário ou sem quantidade não há estimativa alguma', () => {
    expect(estimarOperacao(null, AGORA, 100)).toBeNull();
    expect(estimarOperacao(32.5, null, 100)).toBeNull();
    expect(estimarOperacao(32.5, AGORA, null)).toBeNull();
    expect(estimarOperacao(32.5, AGORA, 0)).toBeNull();
  });

  it('@spec:AC-164 preço com até duas casas decimais é aceito', () => {
    expect(precoManualTemCasasDemais(32)).toBe(false);
    expect(precoManualTemCasasDemais(32.5)).toBe(false);
    expect(precoManualTemCasasDemais(32.55)).toBe(false);
  });

  it('@spec:AC-164 preço com três casas ou mais é recusado antes de sair da tela', () => {
    expect(precoManualTemCasasDemais(32.555)).toBe(true);
    expect(precoManualTemCasasDemais(0.001)).toBe(true);
  });

  it('@spec:AC-164 preço ausente não é problema de casas decimais', () => {
    expect(precoManualTemCasasDemais(null)).toBe(false);
    expect(precoManualTemCasasDemais(undefined)).toBe(false);
  });
});
