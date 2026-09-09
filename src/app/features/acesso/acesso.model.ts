/** Corpo de POST /auth/cadastro. */
export interface CadastroRequisicao {
  nome: string;
  email: string;
  cpf: string;
  senha: string;
}

/** Resposta de POST /auth/cadastro: a conta criada, sem token (ADR-001). */
export interface CadastroResposta {
  id: number;
  nome: string;
  email: string;
}

/** Corpo de POST /auth/login. */
export interface LoginRequisicao {
  email: string;
  senha: string;
}

/** Destino do login. O painel real substitui este endereço no passo seguinte. */
export const ROTA_AREA_INTERNA = '/painel';

/** Endereço do cadastro, alcançável em um clique a partir do login. */
export const ROTA_CADASTRO = '/criar-conta';
