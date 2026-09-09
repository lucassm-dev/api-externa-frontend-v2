import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { Pagina, temProximaPagina } from '../../core/api/pagina';
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

@Injectable({ providedIn: 'root' })
export class CarteirasService {
  private readonly http = inject(HttpClient);

  /** O mercado vai como o investidor escolheu — a tela decide, não o serviço. */
  criar(nova: NovaCarteira): Observable<Carteira> {
    return this.http.post<Carteira>('/carteiras', nova);
  }

  listar(pagina: number): Observable<Pagina<Carteira>> {
    const params = new HttpParams()
      .set('page', pagina)
      .set('size', CARTEIRAS_POR_PAGINA)
      .set('sort', 'id,desc');
    return this.http.get<Pagina<Carteira>>('/carteiras', { params });
  }

  /**
   * Não existe `GET /carteiras/{id}` (Q-015): a carteira é procurada na própria
   * listagem, página a página. Não achar é o mesmo que CAR-001 — e a tela diz
   * "Carteira não encontrada.", sem nunca insinuar de quem ela seria.
   */
  porId(id: number): Observable<Carteira | null> {
    return this.procurar(id, 0);
  }

  posicoes(carteiraId: number): Observable<Posicao[]> {
    return this.http.get<Posicao[]>(`/carteiras/${carteiraId}/posicoes`);
  }

  consolidado(carteiraId: number): Observable<ConsolidadoDaCarteira> {
    return this.http.get<ConsolidadoDaCarteira>(`/carteiras/${carteiraId}/consolidado`);
  }

  lucroRealizado(carteiraId: number): Observable<LucroRealizado> {
    return this.http.get<LucroRealizado>(`/carteiras/${carteiraId}/lucro-realizado`);
  }

  /**
   * Os números da lista, por carteira. Cada leitura é independente e nenhuma
   * derruba a linha: o que falhar simplesmente não aparece (ADR-006, Q-013).
   */
  numerosDaCarteira(carteiraId: number): Observable<NumerosDaCarteira> {
    return forkJoin({
      consolidado: this.consolidado(carteiraId).pipe(catchError(() => of(null))),
      lucroRealizado: this.lucroRealizado(carteiraId).pipe(catchError(() => of(null))),
    });
  }

  /**
   * O extrato é global e sem filtro (ADR-010). O serviço devolve o que buscou
   * junto do total que existe no servidor — é o total que permite à tela dizer
   * que está mostrando só as mais recentes.
   */
  extratoDoInvestidor(): Observable<ExtratoBuscado> {
    const params = new HttpParams().set('page', 0).set('size', MOVIMENTACOES_BUSCADAS);
    return this.http.get<Pagina<MovimentacaoDoExtrato>>('/operacoes', { params }).pipe(
      map((pagina) => ({
        itens: pagina.content,
        totalNoServidor: pagina.totalElements,
        buscadas: pagina.content.length,
      })),
    );
  }

  renomear(id: number, nome: string): Observable<Carteira> {
    return this.http.patch<Carteira>(`/carteiras/${id}`, { nome });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`/carteiras/${id}`);
  }

  private procurar(id: number, pagina: number): Observable<Carteira | null> {
    const params = new HttpParams().set('page', pagina).set('size', CARTEIRAS_POR_VARREDURA);
    return this.http.get<Pagina<Carteira>>('/carteiras', { params }).pipe(
      switchMap((resposta) => {
        const achada = resposta.content.find((carteira) => carteira.id === id);
        if (achada) {
          return of(achada);
        }
        return temProximaPagina(resposta) ? this.procurar(id, resposta.number + 1) : of(null);
      }),
    );
  }
}
