/** Resposta real de POST /auth/login. Não traz dados do investidor (ADR-001). */
export interface RespostaLogin {
  token: string;
  tipo: string;
  expiraEm: string;
}

/**
 * A sessão guardada: o que o login devolveu mais o e-mail que o próprio
 * investidor digitou. O backend não tem endpoint de "quem sou eu", e a senha
 * nunca é guardada.
 */
export interface Sessao extends RespostaLogin {
  email: string;
}

export const CHAVE_SESSAO = 'carteira.sessao';

/** Endereço do login. Único destino possível sem sessão, junto do cadastro. */
export const ROTA_LOGIN = '/entrar';

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
