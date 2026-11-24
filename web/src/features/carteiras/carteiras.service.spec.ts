import { Pagina } from '@/core/api/pagina';
import { json, simularServidor } from '@/test/servidor';
import { Carteira } from './carteiras.model';
import { carteirasService } from './carteiras.service';

const CARTEIRA: Carteira = { id: 9, investidorId: 1, corretoraId: 7, nomeCorretora: 'XP Investimentos', mercado: 'BR', moeda: 'BRL', nome: 'Dividendos', ativa: true };

const pagina = (content: Carteira[], extras: Partial<Pagina<Carteira>> = {}): Pagina<Carteira> => ({
  content, totalElements: content.length, totalPages: 1, number: 0, size: 200, ...extras,
});
const busca = (url: string) => new URL(url, 'http://localhost').searchParams;

afterEach(() => vi.unstubAllGlobals());

describe('Serviço das carteiras', () => {
  it('@spec:AC-093 envia exatamente o mercado escolhido, sem valor padrão embutido', async () => {
    const servidor = simularServidor(() => json(CARTEIRA));

    await carteirasService.criar({ corretoraId: 7, mercado: 'US', nome: 'Small caps' });

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'POST', url: '/carteiras', corpo: { corretoraId: 7, mercado: 'US', nome: 'Small caps' } });
  });

  it('@spec:AC-094 a criação devolve a carteira com o identificador do servidor', async () => {
    simularServidor(() => json(CARTEIRA));

    expect((await carteirasService.criar({ corretoraId: 7, mercado: 'BR', nome: 'Dividendos' })).id).toBe(9);
  });

  it('@spec:AC-097 lista pedindo a página ao servidor, da mais recente para a mais antiga', async () => {
    const servidor = simularServidor(() => json(pagina([])));

    await carteirasService.listar(2);

    const parametros = busca(servidor.chamadas[0].url);
    expect(parametros.get('page')).toBe('2');
    expect(parametros.get('size')).toBe('20');
    expect(parametros.get('sort')).toBe('id,desc');
  });

  it('@spec:AC-113 busca o extrato numa página larga e informa quantas existem no servidor', async () => {
    const servidor = simularServidor(() =>
      json({ content: [{ id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA' }], totalElements: 640, totalPages: 4, number: 0, size: 200 }),
    );

    const extrato = await carteirasService.extratoDoInvestidor();

    expect(busca(servidor.chamadas[0].url).get('size')).toBe('200');
    expect(extrato).toEqual({ itens: [{ id: 1, carteiraId: 9, dataHora: '2026-09-09T10:00:00', tipo: 'COMPRA' }], totalNoServidor: 640, buscadas: 1 });
  });

  it('@spec:AC-100 número que falha vira ausência de número, nunca erro propagado', async () => {
    simularServidor(({ url }) => (url.endsWith('/consolidado') ? json('', 500) : json({ total: 12, porTicker: {} })));

    expect(await carteirasService.numerosDaCarteira(9)).toEqual({ consolidado: null, lucroRealizado: { total: 12, porTicker: {} } });
  });

  it('@spec:AC-120 carteira ausente da listagem é tratada como não encontrada', async () => {
    simularServidor(() => json(pagina([{ ...CARTEIRA, id: 4 }])));

    expect(await carteirasService.porId(9)).toBeNull();
  });

  it('@spec:AC-120 a busca pela carteira percorre as páginas da listagem', async () => {
    const servidor = simularServidor(({ url }) =>
      busca(url).get('page') === '0'
        ? json(pagina([{ ...CARTEIRA, id: 4 }], { totalPages: 2, totalElements: 2 }))
        : json(pagina([CARTEIRA], { number: 1, totalPages: 2, totalElements: 2 })),
    );

    expect((await carteirasService.porId(9))?.id).toBe(9);
    expect(servidor.chamadas.map((chamada) => busca(chamada.url).get('page'))).toEqual(['0', '1']);
  });

  it('@spec:AC-115 renomear manda só o nome', async () => {
    const servidor = simularServidor(() => json(CARTEIRA));

    await carteirasService.renomear(9, 'Longo prazo');

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'PATCH', url: '/carteiras/9', corpo: { nome: 'Longo prazo' } });
  });

  it('@spec:AC-119 excluir chama a remoção da carteira', async () => {
    const servidor = simularServidor(() => json(undefined, 204));

    await carteirasService.excluir(9);

    expect(servidor.chamadas[0]).toMatchObject({ metodo: 'DELETE', url: '/carteiras/9' });
  });
});
