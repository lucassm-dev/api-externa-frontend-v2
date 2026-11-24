import { http } from '@/core/api/http';
import { RespostaLogin } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { CadastroRequisicao, CadastroResposta, LoginRequisicao } from './acesso.model';

/** As duas únicas rotas públicas do backend, mais o encerramento da sessão. */
export const acesso = {
  cadastrar(dados: CadastroRequisicao): Promise<CadastroResposta> {
    return http.post<CadastroResposta>('/auth/cadastro', dados);
  },

  /**
   * O e-mail guardado é o que o investidor digitou: o login devolve só token,
   * tipo e expiração. A senha não é guardada em lugar nenhum (ADR-001).
   */
  async entrar(credenciais: LoginRequisicao): Promise<RespostaLogin> {
    const resposta = await http.post<RespostaLogin>('/auth/login', credenciais);
    sessao.iniciar(resposta, credenciais.email);
    return resposta;
  },

  sair(): void {
    sessao.encerrar();
  },
};
