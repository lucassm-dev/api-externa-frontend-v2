import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Posicao } from './carteiras.model';
import { PosicoesCarteira } from './posicoes-carteira';

const AGORA = new Date().toISOString();
const posicao = (ticker: string, precoMedio: number, cotacaoAtual: number, rentabilidadeNaoRealizada: number): Posicao => ({
  id: ticker.length,
  ticker,
  nomeEmpresa: `Empresa ${ticker}`,
  quantidade: 5,
  precoMedio,
  cotacaoAtual,
  dataHoraCotacao: AGORA,
  rentabilidadeNaoRealizada,
});

function montar(moedas: Record<string, 'BRL' | 'USD'>) {
  const { container } = render(
    <MemoryRouter>
      <PosicoesCarteira posicoes={[posicao('AAPL', 355.45, 360.1, 23.25), posicao('PETR4', 43.19, 44, 56.7)]} moedas={moedas} />
    </MemoryRouter>,
  );
  const celula = (ticker: string, campo: string) => container.querySelector(`[data-posicao="${ticker}"] [data-${campo}]`)?.textContent ?? '';
  return { celula };
}

describe('Moeda das posições na carteira', () => {
  it('@spec:AC-391 posição em ação americana aparece em dólar', () => {
    const { celula } = montar({ AAPL: 'USD', PETR4: 'BRL' });

    expect(celula('AAPL', 'preco-medio')).toMatch(/US\$\s*355,45/);
    expect(celula('AAPL', 'cotacao')).toMatch(/US\$\s*360,10/);
    expect(celula('AAPL', 'rentabilidade-valor')).toMatch(/US\$\s*23,25/);
    expect(celula('AAPL', 'preco-medio')).not.toContain('R$');
  });

  it('@spec:AC-392 posição em ação brasileira continua em real', () => {
    const { celula } = montar({ AAPL: 'USD', PETR4: 'BRL' });

    expect(celula('PETR4', 'preco-medio')).toMatch(/R\$\s*43,19/);
    expect(celula('PETR4', 'cotacao')).toMatch(/R\$\s*44,00/);
    expect(celula('PETR4', 'rentabilidade-valor')).toMatch(/R\$\s*56,70/);
  });

  it('@spec:AC-393 sem saber a moeda, o valor aparece sem símbolo', () => {
    const { celula } = montar({});

    for (const campo of ['preco-medio', 'cotacao', 'rentabilidade-valor']) {
      expect(celula('AAPL', campo), campo).not.toMatch(/R\$|US\$/);
    }
    expect(celula('AAPL', 'preco-medio')).toContain('355,45');
  });
});
