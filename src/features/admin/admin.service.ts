import { http, Parametros } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { TotaisPorSituacao, USUARIOS_POR_PAGINA, UsuarioAdmin } from './admin.model';

export const adminService = {
  usuarios(pagina: number, filtros: Parametros): Promise<Pagina<UsuarioAdmin>> {
    return http.get<Pagina<UsuarioAdmin>>('/admin/usuarios', { params: { ...filtros, page: pagina, size: USUARIOS_POR_PAGINA } });
  },

  criarAdmin(email: string, senha: string): Promise<UsuarioAdmin> {
    return http.post<UsuarioAdmin>('/admin/usuarios', { email, senha });
  },

  bloquear(id: number, motivo: string): Promise<UsuarioAdmin> {
    return http.patch<UsuarioAdmin>(`/admin/usuarios/${id}/bloquear`, { motivo });
  },

  desbloquear(id: number): Promise<UsuarioAdmin> {
    return http.patch<UsuarioAdmin>(`/admin/usuarios/${id}/desbloquear`);
  },

  totais(papel: string): Promise<TotaisPorSituacao> {
    return http.get<TotaisPorSituacao>('/admin/usuarios/totais', papel ? { params: { papel } } : undefined);
  },
};
