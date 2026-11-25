import { http, Parametros } from '@/core/api/http';
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

  /** Os filtros são aplicados no servidor, antes da paginação (ADR-018 do backend, AC-340). */
  extrato(pagina: number, filtros: Parametros = {}): Promise<Pagina<OperacaoDoExtrato>> {
    return http.get<Pagina<OperacaoDoExtrato>>('/operacoes', { params: { ...filtros, page: pagina, size: OPERACOES_POR_PAGINA } });
  },

  /** Editar sem preço reutiliza a última cotação conhecida — omitir é a instrução. */
  alterar(id: number, alteracao: AlteracaoDeOperacao): Promise<Operacao> {
    return http.put<Operacao>(`/operacoes/${id}`, alteracao);
  },

  excluir(id: number): Promise<void> {
    return http.delete<void>(`/operacoes/${id}`);
  },
};
