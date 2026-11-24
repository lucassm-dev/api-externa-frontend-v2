import { http } from '@/core/api/http';
import { Pagina, temProximaPagina } from '@/core/api/pagina';
import {
  CARTEIRAS_POR_PAGINA,
  CARTEIRAS_POR_VARREDURA,
  Carteira,
  ConsolidadoDaCarteira,
  ExtratoBuscado,
  LucroRealizado,
  MOVIMENTACOES_BUSCADAS,
  MovimentacaoDoExtrato,
  NovaCarteira,
  Posicao,
} from './carteiras.model';

/** Os números que a lista exibe por carteira. `null` é leitura que falhou. */
export interface NumerosDaCarteira {
  consolidado: ConsolidadoDaCarteira | null;
  lucroRealizado: LucroRealizado | null;
}

const ouNulo = <T>(promessa: Promise<T>): Promise<T | null> => promessa.catch(() => null);

export const carteirasService = {
  /** O mercado vai como o investidor escolheu — a tela decide, não o serviço. */
  criar(nova: NovaCarteira): Promise<Carteira> {
    return http.post<Carteira>('/carteiras', nova);
  },

  listar(pagina: number, tamanho = CARTEIRAS_POR_PAGINA): Promise<Pagina<Carteira>> {
    return http.get<Pagina<Carteira>>('/carteiras', { params: { page: pagina, size: tamanho, sort: 'id,desc' } });
  },

  /**
   * Não existe `GET /carteiras/{id}` (Q-015): a carteira é procurada na própria
   * listagem, página a página. Não achar é o mesmo que CAR-001 — e a tela diz
   * "Carteira não encontrada.", sem nunca insinuar de quem ela seria.
   */
  async porId(id: number): Promise<Carteira | null> {
    let numero = 0;
    for (;;) {
      const resposta = await http.get<Pagina<Carteira>>('/carteiras', { params: { page: numero, size: CARTEIRAS_POR_VARREDURA } });
      const achada = resposta.content.find((carteira) => carteira.id === id);
      if (achada) return achada;
      if (!temProximaPagina(resposta)) return null;
      numero = resposta.number + 1;
    }
  },

  posicoes(carteiraId: number): Promise<Posicao[]> {
    return http.get<Posicao[]>(`/carteiras/${carteiraId}/posicoes`);
  },

  consolidado(carteiraId: number): Promise<ConsolidadoDaCarteira> {
    return http.get<ConsolidadoDaCarteira>(`/carteiras/${carteiraId}/consolidado`);
  },

  lucroRealizado(carteiraId: number): Promise<LucroRealizado> {
    return http.get<LucroRealizado>(`/carteiras/${carteiraId}/lucro-realizado`);
  },

  /**
   * Os números da lista, por carteira. Cada leitura é independente e nenhuma
   * derruba a linha: o que falhar simplesmente não aparece (ADR-006, Q-013).
   */
  async numerosDaCarteira(carteiraId: number): Promise<NumerosDaCarteira> {
    const [consolidado, lucroRealizado] = await Promise.all([
      ouNulo(carteirasService.consolidado(carteiraId)),
      ouNulo(carteirasService.lucroRealizado(carteiraId)),
    ]);
    return { consolidado, lucroRealizado };
  },

  /**
   * O extrato é global e sem filtro (ADR-010). O serviço devolve o que buscou
   * junto do total que existe no servidor — é o total que permite à tela dizer
   * que está mostrando só as mais recentes.
   */
  async extratoDoInvestidor(): Promise<ExtratoBuscado> {
    const pagina = await http.get<Pagina<MovimentacaoDoExtrato>>('/operacoes', { params: { page: 0, size: MOVIMENTACOES_BUSCADAS } });
    return { itens: pagina.content, totalNoServidor: pagina.totalElements, buscadas: pagina.content.length };
  },

  renomear(id: number, nome: string): Promise<Carteira> {
    return http.patch<Carteira>(`/carteiras/${id}`, { nome });
  },

  excluir(id: number): Promise<void> {
    return http.delete<void>(`/carteiras/${id}`);
  },
};
