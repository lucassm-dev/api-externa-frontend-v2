import { http } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { ACOES_POR_PAGINA, Acao, NovaAcao, normalizarTicker } from './acoes.model';

export const acoesService = {
  /**
   * Dois campos. O backend consulta a fonte do mercado e devolve nome, moeda e
   * cotação. Ticker que não existe na fonte não vira registro nenhum — nem lá,
   * nem aqui: a recusa não deixa estado local.
   */
  cadastrar(nova: NovaAcao): Promise<Acao> {
    return http.post<Acao>('/acoes', { ticker: normalizarTicker(nova.ticker), mercado: nova.mercado });
  },

  listar(pagina: number, tamanho = ACOES_POR_PAGINA): Promise<Pagina<Acao>> {
    return http.get<Pagina<Acao>>('/acoes', { params: { page: pagina, size: tamanho } });
  },

  /** Busca do catálogo: não achar é resultado vazio, não falha (mesmo de corretoras). */
  async porTicker(ticker: string): Promise<Acao | null> {
    try {
      return await http.get<Acao>(`/acoes/ticker/${normalizarTicker(ticker)}`);
    } catch {
      return null;
    }
  },

  /**
   * Só sai quando o investidor pede (ADR-005). `forcar` ignora o cache e vai
   * direto à fonte, consumindo a cota compartilhada por todos — por isso é
   * parâmetro explícito e nunca o padrão.
   */
  atualizarCotacao(id: number, forcar = false): Promise<Acao> {
    return http.put<Acao>(`/acoes/${id}/atualizar-cotacao`, undefined, forcar ? { params: { forcar: 'true' } } : {});
  },

  /** Por ticker, não por id — é a assinatura do endpoint. */
  remover(ticker: string): Promise<void> {
    return http.delete<void>(`/acoes/${normalizarTicker(ticker)}`);
  },

  /**
   * Pré-requisito do cadastro (ADR-003): uma carteira basta. `null` é estado
   * desconhecido — a consulta falhou, e não saber não é o mesmo que não ter.
   */
  async investidorTemCarteira(): Promise<boolean | null> {
    try {
      const pagina = await http.get<Pagina<unknown>>('/carteiras', { params: { page: 0, size: 1 } });
      return pagina.totalElements > 0;
    } catch {
      return null;
    }
  },
};
