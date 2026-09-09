import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { Pagina } from '../../core/api/pagina';
import { ACOES_POR_PAGINA, Acao, NovaAcao, normalizarTicker } from './acoes.model';

@Injectable({ providedIn: 'root' })
export class AcoesService {
  private readonly http = inject(HttpClient);

  /**
   * Dois campos. O backend consulta a fonte do mercado e devolve nome, moeda e
   * cotação. Ticker que não existe na fonte não vira registro nenhum — nem lá,
   * nem aqui: a recusa não deixa estado local.
   */
  cadastrar(nova: NovaAcao): Observable<Acao> {
    return this.http.post<Acao>('/acoes', {
      ticker: normalizarTicker(nova.ticker),
      mercado: nova.mercado,
    });
  }

  listar(pagina: number): Observable<Pagina<Acao>> {
    const params = new HttpParams().set('page', pagina).set('size', ACOES_POR_PAGINA);
    return this.http.get<Pagina<Acao>>('/acoes', { params });
  }

  /** Busca do catálogo: não achar é resultado vazio, não falha (mesmo de corretoras). */
  porTicker(ticker: string): Observable<Acao | null> {
    return this.http
      .get<Acao>(`/acoes/ticker/${normalizarTicker(ticker)}`)
      .pipe(catchError(() => of(null)));
  }

  /**
   * Só sai quando o investidor pede (ADR-005). `forcar` ignora o cache e vai
   * direto à fonte, consumindo a cota compartilhada por todos — por isso é
   * parâmetro explícito e nunca o padrão.
   */
  atualizarCotacao(id: number, forcar = false): Observable<Acao> {
    const params = forcar ? new HttpParams().set('forcar', 'true') : new HttpParams();
    return this.http.put<Acao>(`/acoes/${id}/atualizar-cotacao`, null, { params });
  }

  /** Por ticker, não por id — é a assinatura do endpoint. */
  remover(ticker: string): Observable<void> {
    return this.http.delete<void>(`/acoes/${normalizarTicker(ticker)}`);
  }

  /**
   * Pré-requisito do cadastro (ADR-003): uma carteira basta. `null` é estado
   * desconhecido — a consulta falhou, e não saber não é o mesmo que não ter.
   */
  investidorTemCarteira(): Observable<boolean | null> {
    const params = new HttpParams().set('page', 0).set('size', 1);
    return this.http.get<Pagina<unknown>>('/carteiras', { params }).pipe(
      map((pagina) => pagina.totalElements > 0),
      catchError(() => of(null)),
    );
  }
}
