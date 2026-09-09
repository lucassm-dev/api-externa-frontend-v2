import { ErroPadrao } from './erro-padrao';
import { Pagina, itensDe, temProximaPagina } from './pagina';

describe('Contrato da API', () => {
  it('@spec:AC-023 a resposta paginada do Spring é lida pelos campos dela', () => {
    const pagina: Pagina<{ id: number }> = {
      content: [{ id: 1 }, { id: 2 }],
      totalElements: 7,
      totalPages: 4,
      number: 0,
      size: 2,
    };

    expect(itensDe(pagina)).toHaveLength(2);
    expect(pagina.totalElements).toBe(7);
    expect(pagina.totalPages).toBe(4);
    expect(pagina.number).toBe(0);
    expect(pagina.size).toBe(2);
    expect(temProximaPagina(pagina)).toBe(true);
    expect(temProximaPagina({ ...pagina, number: 3 })).toBe(false);
  });

  it('@spec:AC-023 o erro padrão é aceito sem fieldErrors, que o backend omite quando vazio', () => {
    const semCampos: ErroPadrao = {
      timestamp: '2026-09-04T19:30:00Z',
      status: 404,
      codigo: 'ACA-001',
      error: 'Not Found',
      message: 'Ação não encontrada: PETR4',
      path: '/acoes/ticker/PETR4',
    };
    const comCampos: ErroPadrao = {
      ...semCampos,
      status: 400,
      codigo: 'VAL-001',
      fieldErrors: [{ field: 'cpf', message: 'CPF deve ter 11 dígitos' }],
    };

    expect(semCampos.fieldErrors).toBeUndefined();
    expect(comCampos.fieldErrors?.[0].field).toBe('cpf');
  });
});
