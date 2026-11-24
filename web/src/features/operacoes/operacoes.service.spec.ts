import { json, simularServidor } from '@/test/servidor';
import { operacoesService } from './operacoes.service';

const VAZIA = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };
const busca = (url: string) => new URL(url, 'http://localhost').searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('Serviço de operações', () => {
  it('@spec:AC-154 a compra sai com carteira, ticker e quantidade, sem preço unitário', async () => {
    const servidor = simularServidor(() => json({}));

    await operacoesService.registrar('COMPRA', { carteiraId: 9, ticker: 'PETR4', quantidade: 100 });

    const [chamada] = servidor.chamadas;
    expect(chamada).toMatchObject({ metodo: 'POST', url: '/operacoes/compra' });
    expect(chamada.corpo).toEqual({ carteiraId: 9, ticker: 'PETR4', quantidade: 100 });
    expect('precoUnitario' in (chamada.corpo as object)).toBe(false);
  });

  it('@spec:AC-163 o preço digitado vai no corpo, e a venda usa a rota de venda', async () => {
    const servidor = simularServidor(() => json({}));

    await operacoesService.registrar('VENDA', { carteiraId: 9, ticker: 'PETR4', quantidade: 10, precoUnitario: 32.5 });

    expect(servidor.chamadas[0]).toMatchObject({ url: '/operacoes/venda', corpo: { carteiraId: 9, ticker: 'PETR4', quantidade: 10, precoUnitario: 32.5 } });
  });

  it('@spec:AC-169 o extrato é lido paginado e devolve os itens do servidor', async () => {
    const servidor = simularServidor(() => json({ ...VAZIA, content: [{ id: 1, tipo: 'COMPRA', ticker: 'PETR4' }], totalElements: 1, totalPages: 1 }));

    const pagina = await operacoesService.extrato(0);

    expect(servidor.chamadas[0].metodo).toBe('GET');
    expect(pagina.content).toEqual([{ id: 1, tipo: 'COMPRA', ticker: 'PETR4' }]);
  });

  it('@spec:AC-171 avançar de página pede ao servidor a página correspondente', async () => {
    const servidor = simularServidor(() => json({ ...VAZIA, number: 2 }));

    await operacoesService.extrato(2);

    expect(busca(servidor.chamadas[0].url).get('page')).toBe('2');
    expect(busca(servidor.chamadas[0].url).get('size')).toBe('20');
  });

  it('@spec:AC-172 a leitura do extrato não carrega nenhum parâmetro de filtro', async () => {
    const servidor = simularServidor(() => json(VAZIA));

    await operacoesService.extrato(0);

    expect(new URL(servidor.chamadas[0].url, 'http://localhost').pathname).toBe('/operacoes');
    expect([...busca(servidor.chamadas[0].url).keys()].sort()).toEqual(['page', 'size']);
  });

  it('@spec:AC-176 alterar sem preço novo não envia preço unitário', async () => {
    const servidor = simularServidor(() => json({}));

    await operacoesService.alterar(7, { quantidade: 50 });

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'PUT', url: '/operacoes/7', corpo: { quantidade: 50 } });
    expect('precoUnitario' in (servidor.chamadas[0].corpo as object)).toBe(false);
  });

  it('excluir chama DELETE na operação', async () => {
    const servidor = simularServidor(() => json(undefined, 204));

    await operacoesService.excluir(7);

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'DELETE', url: '/operacoes/7' });
  });
});
