import { http } from '@/core/api/http';
import { Identidade, RespostaLogin } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';

export const LIMITE_FOTO_BYTES = 2 * 1024 * 1024;
export const TIPOS_DE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const ROTA_CONTA = '/conta';

/** Mesmos textos de AUT-016 e AUT-017: recusar antes ou depois de enviar diz a mesma coisa. */
export function problemaDaFoto(arquivo: File): string | null {
  if (!TIPOS_DE_FOTO.includes(arquivo.type)) return 'Envie a foto em JPEG, PNG ou WebP.';
  if (arquivo.size > LIMITE_FOTO_BYTES) return 'A foto pode ter no máximo 2 MB.';
  return null;
}

/** E-mail e foto mudam no servidor; quem sou eu é a fonte (ASM-081). */
async function recarregarIdentidade(): Promise<void> {
  const { email, papel, nome, fotoUrl } = await http.get<Identidade & { email: string }>('/auth/me');
  sessao.atualizar({ email, identidade: { papel, nome, fotoUrl } });
}

export const conta = {
  /** O servidor invalida os tokens anteriores: o novo substitui o guardado (ASM-080). */
  async trocarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    const { token, tipo, expiraEm } = await http.put<RespostaLogin>('/auth/senha', {
      senhaAtual,
      novaSenha,
    });
    sessao.atualizar({ token, tipo, expiraEm });
  },

  pedirTrocaDeEmail(novoEmail: string, senhaAtual: string): Promise<void> {
    return http.post<void>('/auth/email', { novoEmail, senhaAtual });
  },

  async confirmarTrocaDeEmail(codigo: string): Promise<void> {
    await http.post<void>('/auth/email/confirmar', { codigo });
    await recarregarIdentidade();
  },

  async enviarFoto(arquivo: File): Promise<void> {
    const corpo = new FormData();
    corpo.append('arquivo', arquivo);
    await http.put<void>('/auth/me/foto', corpo);
    await recarregarIdentidade();
  },

  async removerFoto(): Promise<void> {
    await http.delete<void>('/auth/me/foto');
    await recarregarIdentidade();
  },

  buscarFoto(sinal: AbortSignal): Promise<Blob> {
    return http.blob('/auth/me/foto', sinal);
  },
};
