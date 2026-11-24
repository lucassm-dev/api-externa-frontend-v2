import { erroPadrao, json, simularServidor, type Chamada } from '@/test/servidor';
import { desempenhoService } from './desempenho.service';

const pagina = <T>(itens: T[]) => ({ content: itens, totalElements: itens.length, totalPages: 1, number: 0, size: itens.length });
const consolidado = { valorInvestido: 1000, valorDeMercado: 1200, lucroNaoRealizado: 200, taxaCambioAtual: 5, dataHoraTaxaCambio: '2026-09-09T12:00:00Z', avisos: [] };
const posicao = { id: 1, ticker: 'AAPL', nomeEmpresa: 'Apple', quantidade: 10, precoMedio: 20, cotacaoAtual: 24, dataHoraCotacao: '2026-09-09T12:00:00Z', rentabilidadeNaoRealizada: 40 };
const acao = { id: 1, ticker: 'AAPL', nomeEmpresa: 'Apple', mercado: 'US', moeda: 'USD', cotacaoAtual: 24, dataHoraCotacao: '2026-09-09T12:00:00Z' };

const caminho = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').pathname;
const busca = (chamada: Chamada) => new URL(chamada.url, 'http://localhost').searchParams;

function servidor(respostas: Record<string, () => Response>) {
  return simularServidor((chamada) => respostas[caminho(chamada)]?.() ?? json(null, 404));
}

afterEach(() => vi.unstubAllGlobals());

describe('Leituras da tela de desempenho', () => {
  it('@spec:AC-189 as carteiras do seletor vêm da listagem, mais recente primeiro', async () => {
    const leitura = servidor({ '/carteiras': () => json(pagina([{ id: 9, nome: 'Longo prazo' }])) });

    const carteiras = await desempenhoService.carteiras();

    expect(busca(leitura.chamadas[0]).get('sort')).toBe('id,desc');
    expect(busca(leitura.chamadas[0]).get('size')).toBe('200');
    expect(carteiras).toEqual([{ id: 9, nome: 'Longo prazo' }]);
  });

  it('@spec:AC-189 a carteira escolhida traz consolidado, posições, realizado e a moeda de cada ticker', async () => {
    const leitura = servidor({
      '/carteiras/9/consolidado': () => json(consolidado),
      '/carteiras/9/posicoes': () => json([posicao]),
      '/carteiras/9/lucro-realizado': () => json({ total: 0, porTicker: {} }),
      '/acoes': () => json(pagina([acao])),
    });

    const dados = await desempenhoService.dadosDaCarteira(9);

    expect(busca(leitura.chamadas.find((chamada) => caminho(chamada) === '/acoes')!).get('size')).toBe('200');
    expect(dados.consolidado).toEqual(consolidado);
    expect(dados.posicoes).toEqual([posicao]);
    expect(dados.moedas).toEqual({ AAPL: 'USD' });
  });

  it('@spec:AC-211 leitura que falha vira nula e não derruba as outras', async () => {
    servidor({
      '/carteiras/9/consolidado': () => json(consolidado),
      '/carteiras/9/posicoes': () => json([posicao]),
      '/carteiras/9/lucro-realizado': () => erroPadrao('EXT-010', 503),
      '/acoes': () => json(pagina([])),
    });

    const dados = await desempenhoService.dadosDaCarteira(9);

    expect(dados.lucroRealizado).toBeNull();
    expect(dados.consolidado).toEqual(consolidado);
    expect(dados.posicoes).toEqual([posicao]);
  });

  it('@spec:AC-211 catálogo fora do ar deixa toda posição com moeda desconhecida, sem converter no escuro', async () => {
    servidor({
      '/carteiras/9/consolidado': () => json(consolidado),
      '/carteiras/9/posicoes': () => json([posicao]),
      '/carteiras/9/lucro-realizado': () => json({ total: 0, porTicker: {} }),
      '/acoes': () => erroPadrao('EXT-010', 503),
    });

    expect((await desempenhoService.dadosDaCarteira(9)).moedas).toEqual({});
  });
});
