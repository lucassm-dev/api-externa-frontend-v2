import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { RespostaLogin } from '../../core/sessao/sessao.model';
import { SessaoService } from '../../core/sessao/sessao.service';
import { CadastroRequisicao, CadastroResposta, LoginRequisicao } from './acesso.model';

/** As duas únicas rotas públicas do backend, mais o encerramento da sessão. */
@Injectable({ providedIn: 'root' })
export class AcessoService {
  private readonly http = inject(HttpClient);
  private readonly sessao = inject(SessaoService);

  cadastrar(dados: CadastroRequisicao): Observable<CadastroResposta> {
    return this.http.post<CadastroResposta>('/auth/cadastro', dados);
  }

  /**
   * O e-mail guardado é o que o investidor digitou: o login devolve só token,
   * tipo e expiração. A senha não é guardada em lugar nenhum (ADR-001).
   */
  entrar(credenciais: LoginRequisicao): Observable<RespostaLogin> {
    return this.http
      .post<RespostaLogin>('/auth/login', credenciais)
      .pipe(tap((resposta) => this.sessao.iniciar(resposta, credenciais.email)));
  }

  sair(): void {
    this.sessao.encerrar();
  }
}
