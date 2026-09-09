import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { Pagina } from '../../core/api/pagina';
import { Acao } from '../acoes/acoes.model';
import { Carteira } from '../carteiras/carteiras.model';
import { CarteirasService } from '../carteiras/carteiras.service';
import { ACOES_PARA_MOEDA, CARTEIRAS_NO_SELETOR, DadosDaCarteira } from './desempenho.model';
import { mapaDeMoedas } from './moeda-das-posicoes';

/**
 * Quatro leituras por carteira: consolidado, posições, lucro realizado e o
 * catálogo de ações — este último só para saber em que moeda cada posição está
 * cotada, já que `posicoes` não devolve esse campo (ASM-045). Nenhum endpoint
 * novo: tudo já existe.
 *
 * Cada leitura falha sozinha e vira `null` sem derrubar as outras (ADR-006).
 * O catálogo que falha não vira `null`: vira mapa vazio, e aí toda posição fica
 * com moeda desconhecida — o que faz a composição não fechar e a tela avisar.
 */
@Injectable({ providedIn: 'root' })
export class DesempenhoService {
  private readonly http = inject(HttpClient);
  private readonly carteirasService = inject(CarteirasService);

  /** Mais recente primeiro, como no painel e na lista de carteiras. */
  carteiras(): Observable<Carteira[]> {
    const params = new HttpParams()
      .set('page', 0)
      .set('size', CARTEIRAS_NO_SELETOR)
      .set('sort', 'id,desc');
    return this.http
      .get<Pagina<Carteira>>('/carteiras', { params })
      .pipe(map((pagina) => pagina.content));
  }

  dadosDaCarteira(carteiraId: number): Observable<DadosDaCarteira> {
    return forkJoin({
      consolidado: this.carteirasService.consolidado(carteiraId).pipe(catchError(() => of(null))),
      posicoes: this.carteirasService.posicoes(carteiraId).pipe(catchError(() => of(null))),
      lucroRealizado: this.carteirasService
        .lucroRealizado(carteiraId)
        .pipe(catchError(() => of(null))),
      moedas: this.moedasDoCatalogo(),
    });
  }

  private moedasDoCatalogo() {
    const params = new HttpParams().set('page', 0).set('size', ACOES_PARA_MOEDA);
    return this.http.get<Pagina<Acao>>('/acoes', { params }).pipe(
      map((pagina) => mapaDeMoedas(pagina.content)),
      catchError(() => of({})),
    );
  }
}
