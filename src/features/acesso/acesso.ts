import { http } from '@/core/api/http';
import { Identidade, RespostaLogin } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { CadastroRequisicao, CadastroResposta, LoginRequisicao, RedefinirSenhaRequisicao } from './acesso.model';

/** As rotas públicas do backend, mais o encerramento da sessão. */
export const acesso = {
  cadastrar(dados: CadastroRequisicao): Promise<CadastroResposta> {
    return http.post<CadastroResposta>('/auth/cadastro', dados);
  },

  /**
   * O login só termina com a identidade de `GET /auth/me`, que já precisa do
   * token. Sem ela, ninguém entra pela metade (AC-313). A senha não é guardada.
   */
  async entrar(credenciais: LoginRequisicao): Promise<RespostaLogin> {
    const resposta = await http.post<RespostaLogin>('/auth/login', credenciais);
    sessao.iniciar(resposta, credenciais.email);
    try {
      const { papel, nome, fotoUrl } = await http.get<Identidade>('/auth/me');
      sessao.iniciar(resposta, credenciais.email, { papel, nome, fotoUrl });
    } catch (erro) {
      sessao.encerrar();
      throw erro;
    }
    return resposta;
  },

  /** Sempre 202, exista o e-mail ou não (AC-330). */
  pedirCodigoDeSenha(email: string): Promise<void> {
    return http.post<void>('/auth/esqueci-senha', { email });
  },

  redefinirSenha(dados: RedefinirSenhaRequisicao): Promise<void> {
    return http.post<void>('/auth/redefinir-senha', dados);
  },

  sair(): void {
    sessao.encerrar();
  },
};
