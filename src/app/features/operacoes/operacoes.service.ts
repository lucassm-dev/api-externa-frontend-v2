import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../core/api/pagina';
import {
  AlteracaoDeOperacao,
  NovaOperacao,
  OPERACOES_POR_PAGINA,
  Operacao,
  OperacaoDoExtrato,
  TipoOperacao,
} from './operacoes.model';

@Injectable({ providedIn: 'root' })
export class OperacoesService {
  private readonly http = inject(HttpClient);

  registrar(tipo: TipoOperacao, nova: NovaOperacao): Observable<Operacao> {
    const rota = tipo === 'COMPRA' ? '/operacoes/compra' : '/operacoes/venda';
    return this.http.post<Operacao>(rota, this.corpoDaOperacao(nova));
  }

  /**
   * `GET /operacoes` é global e não aceita filtro por carteira, ticker, tipo
   * nem período (ADR-010). Só `page` e `size` saem daqui — qualquer parâmetro a
   * mais seria um filtro que o servidor ignora e a tela promete.
   */
  extrato(pagina: number): Observable<Pagina<OperacaoDoExtrato>> {
    const params = new HttpParams().set('page', pagina).set('size', OPERACOES_POR_PAGINA);
    return this.http.get<Pagina<OperacaoDoExtrato>>('/operacoes', { params });
  }

  alterar(id: number, alteracao: AlteracaoDeOperacao): Observable<Operacao> {
    return this.http.put<Operacao>(`/operacoes/${id}`, this.corpoDaAlteracao(alteracao));
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/operacoes/${id}`);
  }

  /**
   * Preço automático é a ausência do campo, não um campo vazio: mandar `null`
   * ou `0` afirmaria um preço que o investidor não escolheu (ADR-008).
   */
  private corpoDaOperacao(nova: NovaOperacao): Record<string, unknown> {
    const corpo: Record<string, unknown> = {
      carteiraId: nova.carteiraId,
      ticker: nova.ticker,
      quantidade: nova.quantidade,
    };
    if (nova.precoUnitario !== undefined) {
      corpo['precoUnitario'] = nova.precoUnitario;
    }
    return corpo;
  }

  /** Editar sem preço reutiliza a última cotação conhecida — omitir é a instrução. */
  private corpoDaAlteracao(alteracao: AlteracaoDeOperacao): Record<string, unknown> {
    const corpo: Record<string, unknown> = {};
    if (alteracao.quantidade !== undefined) {
      corpo['quantidade'] = alteracao.quantidade;
    }
    if (alteracao.precoUnitario !== undefined) {
      corpo['precoUnitario'] = alteracao.precoUnitario;
    }
    return corpo;
  }
}
