import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, expand, map, of, reduce, takeWhile } from 'rxjs';
import { Pagina, temProximaPagina } from '../../core/api/pagina';
import { somenteDigitos } from './cnpj';
import {
  CARTEIRAS_POR_PAGINA,
  CORRETORAS_POR_PAGINA,
  Corretora,
} from './corretoras.model';
import { CarteiraVinculada, contarCarteirasPorCorretora } from './selo-de-uso';

@Injectable({ providedIn: 'root' })
export class CorretorasService {
  private readonly http = inject(HttpClient);

  /**
   * Um campo só. O backend consulta Receita, ViaCEP e CVM antes de responder —
   * é lento de propósito. Recusa não deixa nada: quem decide se a corretora
   * existe é a resposta, e ela não é gravada em lugar nenhum aqui.
   */
  cadastrar(cnpj: string): Observable<Corretora> {
    return this.http.post<Corretora>('/corretoras', { cnpj: somenteDigitos(cnpj) });
  }

  listar(pagina: number): Observable<Pagina<Corretora>> {
    const params = new HttpParams().set('page', pagina).set('size', CORRETORAS_POR_PAGINA);
    return this.http.get<Pagina<Corretora>>('/corretoras', { params });
  }

  porId(id: number): Observable<Corretora> {
    return this.http.get<Corretora>(`/corretoras/${id}`);
  }

  /**
   * Busca do catálogo: não achar não é falha, é resultado vazio (Q-010). COR-001
   * continua sendo erro de verdade quando o investidor abre um detalhe que não
   * existe — aquilo passa por `porId`.
   */
  porCnpj(cnpj: string): Observable<Corretora | null> {
    return this.http
      .get<Corretora>(`/corretoras/cnpj/${somenteDigitos(cnpj)}`)
      .pipe(catchError(() => of(null)));
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`/corretoras/${id}`);
  }

  /**
   * Quantas carteiras do investidor logado estão em cada corretora. Percorre
   * todas as páginas (Q-011) e nunca propaga erro: sem contagem, a lista sai
   * sem selo em vez de quebrar (ADR-006).
   */
  carteirasPorCorretora(): Observable<Map<number, number>> {
    return this.paginaDeCarteiras(0).pipe(
      expand((pagina) =>
        temProximaPagina(pagina) ? this.paginaDeCarteiras(pagina.number + 1) : of(null),
      ),
      takeWhile((pagina): pagina is Pagina<CarteiraVinculada> => pagina !== null),
      reduce(
        (acumulado, pagina) => [...acumulado, ...pagina.content],
        [] as CarteiraVinculada[],
      ),
      map((carteiras) => contarCarteirasPorCorretora(carteiras)),
      catchError(() => of(new Map<number, number>())),
    );
  }

  private paginaDeCarteiras(pagina: number): Observable<Pagina<CarteiraVinculada>> {
    const params = new HttpParams().set('page', pagina).set('size', CARTEIRAS_POR_PAGINA);
    return this.http.get<Pagina<CarteiraVinculada>>('/carteiras', { params });
  }
}
