import { http } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { ACOES_POR_PAGINA, Acao, NovaAcao, normalizarTicker } from './acoes.model';

export const acoesService = {
  /**
   * Não existe cadastro de ação: pesquisar com o mercado inclui no catálogo o
   * que ainda não está lá (ADR-015 do backend). Ticker que não existe na fonte
   * volta EXT-008 e não vira registro nenhum.
   */
  cadastrar(nova: NovaAcao): Promise<Acao> {
    return http.get<Acao>(`/acoes/ticker/${normalizarTicker(nova.ticker)}`, { params: { mercado: nova.mercado } });
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
};
