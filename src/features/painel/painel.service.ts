import { http } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import {
  BarraDeMercado,
  CARTEIRAS_NO_PAINEL,
  CarteiraResumida,
  ConsolidadoDaCarteira,
  MOVIMENTACOES_NO_PAINEL,
  Movimentacao,
} from './painel.model';

/** As cinco leituras do painel. Nenhuma delas soma carteiras (ADR-004). */
export const painelService = {
  /**
   * A barra é contexto: quando a chamada falha, o painel segue sem ela. É o
   * único lugar do painel que engole o erro, porque a barra nunca derruba a
   * tela (ADR-006).
   */
  async barraDeMercado(): Promise<BarraDeMercado | null> {
    try {
      return await http.get<BarraDeMercado>('/mercado/barra-cotacoes');
    } catch {
      return null;
    }
  },

  /** Mais recente primeiro: o servidor ordena por identificador (PRD-003). */
  async carteiras(): Promise<CarteiraResumida[]> {
    const pagina = await http.get<Pagina<CarteiraResumida>>('/carteiras', {
      params: { page: 0, size: CARTEIRAS_NO_PAINEL, sort: 'id,desc' },
    });
    return pagina.content;
  },

  consolidado(carteiraId: number): Promise<ConsolidadoDaCarteira> {
    return http.get<ConsolidadoDaCarteira>(`/carteiras/${carteiraId}/consolidado`);
  },

  async ultimasMovimentacoes(): Promise<Movimentacao[]> {
    const pagina = await http.get<Pagina<Movimentacao>>('/operacoes', {
      params: { page: 0, size: MOVIMENTACOES_NO_PAINEL },
    });
    return pagina.content.slice(0, MOVIMENTACOES_NO_PAINEL);
  },

  /**
   * Corretora é catálogo compartilhado (ADR-002): a pergunta é se existe
   * alguma, não se o investidor tem a dele.
   */
  async catalogoTemCorretora(): Promise<boolean> {
    const pagina = await http.get<Pagina<unknown>>('/corretoras', { params: { page: 0, size: 1 } });
    return pagina.totalElements > 0 || pagina.content.length > 0;
  },
};
