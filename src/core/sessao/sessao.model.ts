/** Resposta real de POST /auth/login. Não traz dados do investidor (ADR-001). */
export interface RespostaLogin {
  token: string;
  tipo: string;
  expiraEm: string;
}

export type Papel = 'INVESTIDOR' | 'ADMIN';

/** O que `GET /auth/me` devolve, menos o e-mail (já guardado). ADMIN vem com `nome` nulo. */
export interface Identidade {
  papel: Papel;
  nome: string | null;
  fotoUrl: string | null;
}

/**
 * A sessão guardada: o que o login devolveu, o e-mail digitado e a identidade
 * de "quem sou eu". Sessão guardada antes da identidade existir não a tem
 * (ASM-077). A senha nunca é guardada.
 */
export interface Sessao extends RespostaLogin {
  email: string;
  identidade?: Identidade;
}

export const CHAVE_SESSAO = 'carteira.sessao';

/** Endereço do login. Único destino possível sem sessão, junto do cadastro. */
export const ROTA_LOGIN = '/entrar';

/** Onde o ADMIN entra: o painel de usuários (Q-050, resolve a Q-044). */
export const ROTA_INICIAL_ADMIN = '/admin/usuarios';

/**
 * Antecedência do aviso de sessão acabando. Sai do `expiraEm` devolvido no
 * login — o backend não tem endpoint para consultar o prazo (ADR-001).
 */
export const MINUTOS_AVISO_EXPIRACAO = 5;

export function ehSessao(valor: unknown): valor is Sessao {
  const s = valor as Sessao;
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof s.token === 'string' &&
    s.token.length > 0 &&
    typeof s.expiraEm === 'string' &&
    Number.isFinite(Date.parse(s.expiraEm))
  );
}
