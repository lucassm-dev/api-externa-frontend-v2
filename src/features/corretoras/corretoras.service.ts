import { http } from '@/core/api/http';
import { Pagina, temProximaPagina } from '@/core/api/pagina';
import { somenteDigitos } from './cnpj';
import { CARTEIRAS_POR_PAGINA, CORRETORAS_POR_PAGINA, Corretora } from './corretoras.model';
import { CarteiraVinculada, contarCarteirasPorCorretora } from './selo-de-uso';

export const corretorasService = {
  /**
   * Um campo só. O backend consulta Receita, ViaCEP e CVM antes de responder —
   * é lento de propósito. Recusa não deixa nada: quem decide se a corretora
   * existe é a resposta, e ela não é gravada em lugar nenhum aqui.
   */
  cadastrar(cnpj: string): Promise<Corretora> {
    return http.post<Corretora>('/corretoras', { cnpj: somenteDigitos(cnpj) });
  },

  listar(pagina: number, tamanho = CORRETORAS_POR_PAGINA): Promise<Pagina<Corretora>> {
    return http.get<Pagina<Corretora>>('/corretoras', { params: { page: pagina, size: tamanho } });
  },

  porId(id: number): Promise<Corretora> {
    return http.get<Corretora>(`/corretoras/${id}`);
  },

  /**
   * Busca do catálogo: não achar não é falha, é resultado vazio (Q-010). COR-001
   * continua sendo erro de verdade quando o investidor abre um detalhe que não
   * existe — aquilo passa por `porId`.
   */
  async porCnpj(cnpj: string): Promise<Corretora | null> {
    try {
      return await http.get<Corretora>(`/corretoras/cnpj/${somenteDigitos(cnpj)}`);
    } catch {
      return null;
    }
  },

  async carteirasAfetadas(id: number): Promise<number> {
    return (await http.get<{ carteirasAtivas: number }>(`/corretoras/${id}/carteiras-afetadas`)).carteirasAtivas;
  },

  descontinuar(id: number, motivo: string): Promise<Corretora> {
    return http.patch<Corretora>(`/corretoras/${id}/descontinuar`, { motivo });
  },

  remover(id: number): Promise<void> {
    return http.delete<void>(`/corretoras/${id}`);
  },

  /**
   * Quantas carteiras do investidor logado estão em cada corretora. Percorre
   * todas as páginas (Q-011) e nunca propaga erro: sem contagem, a lista sai
   * sem selo em vez de quebrar (ADR-006).
   */
  async carteirasPorCorretora(): Promise<Map<number, number>> {
    try {
      const todas: CarteiraVinculada[] = [];
      let numero = 0;
      for (;;) {
        const pagina = await http.get<Pagina<CarteiraVinculada>>('/carteiras', {
          params: { page: numero, size: CARTEIRAS_POR_PAGINA },
        });
        todas.push(...pagina.content);
        if (!temProximaPagina(pagina)) break;
        numero = pagina.number + 1;
      }
      return contarCarteirasPorCorretora(todas);
    } catch {
      return new Map();
    }
  },
};
