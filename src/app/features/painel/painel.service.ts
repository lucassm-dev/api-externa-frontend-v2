import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Pagina } from '../../core/api/pagina';
import {
  BarraDeMercado,
  CARTEIRAS_NO_PAINEL,
  CarteiraResumida,
  ConsolidadoDaCarteira,
  MOVIMENTACOES_NO_PAINEL,
  Movimentacao,
} from './painel.model';

/** As cinco leituras do painel. Nenhuma delas soma carteiras (ADR-004). */
@Injectable({ providedIn: 'root' })
export class PainelService {
  private readonly http = inject(HttpClient);

  /**
   * A barra é contexto: quando a chamada falha, o painel segue sem ela. É o
   * único lugar do painel que engole o erro, porque a barra nunca derruba a
   * tela (ADR-006).
   */
  barraDeMercado(): Observable<BarraDeMercado | null> {
    return this.http
      .get<BarraDeMercado>('/mercado/barra-cotacoes')
      .pipe(catchError(() => of(null)));
  }

  /** Mais recente primeiro: o servidor ordena por identificador (PRD-003). */
  carteiras(): Observable<CarteiraResumida[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', CARTEIRAS_NO_PAINEL)
      .set('sort', 'id,desc');
    return this.http
      .get<Pagina<CarteiraResumida>>('/carteiras', { params })
      .pipe(map((pagina) => pagina.content));
  }

  consolidado(carteiraId: number): Observable<ConsolidadoDaCarteira> {
    return this.http.get<ConsolidadoDaCarteira>(`/carteiras/${carteiraId}/consolidado`);
  }

  ultimasMovimentacoes(): Observable<Movimentacao[]> {
    const params = new HttpParams().set('page', 0).set('size', MOVIMENTACOES_NO_PAINEL);
    return this.http
      .get<Pagina<Movimentacao>>('/operacoes', { params })
      .pipe(map((pagina) => pagina.content.slice(0, MOVIMENTACOES_NO_PAINEL)));
  }

  /**
   * Corretora é catálogo compartilhado (ADR-002): a pergunta é se existe
   * alguma, não se o investidor tem a dele.
   */
  catalogoTemCorretora(): Observable<boolean> {
    const params = new HttpParams().set('page', 0).set('size', 1);
    return this.http
      .get<Pagina<unknown>>('/corretoras', { params })
      .pipe(map((pagina) => pagina.totalElements > 0 || pagina.content.length > 0));
  }
}
