import { http } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { AlteracaoDeOperacao, NovaOperacao, OPERACOES_POR_PAGINA, Operacao, OperacaoDoExtrato, TipoOperacao } from './operacoes.model';

/**
 * O JSON descarta campo `undefined`: preço automático é a ausência do campo,
 * nunca `null` nem `0` afirmando um preço que o investidor não escolheu
 * (ADR-008). Isso vale para registrar e para alterar.
 */
export const operacoesService = {
  registrar(tipo: TipoOperacao, nova: NovaOperacao): Promise<Operacao> {
    const rota = tipo === 'COMPRA' ? '/operacoes/compra' : '/operacoes/venda';
    return http.post<Operacao>(rota, nova);
  },

  /**
   * `GET /operacoes` é global e não aceita filtro por carteira, ticker, tipo
   * nem período (ADR-010). Só `page` e `size` saem daqui — qualquer parâmetro a
   * mais seria um filtro que o servidor ignora e a tela promete.
   */
  extrato(pagina: number): Promise<Pagina<OperacaoDoExtrato>> {
    return http.get<Pagina<OperacaoDoExtrato>>('/operacoes', { params: { page: pagina, size: OPERACOES_POR_PAGINA } });
  },

  /** Editar sem preço reutiliza a última cotação conhecida — omitir é a instrução. */
  alterar(id: number, alteracao: AlteracaoDeOperacao): Promise<Operacao> {
    return http.put<Operacao>(`/operacoes/${id}`, alteracao);
  },

  excluir(id: number): Promise<void> {
    return http.delete<void>(`/operacoes/${id}`);
  },
};
