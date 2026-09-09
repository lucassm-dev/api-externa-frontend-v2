import { formatarData, formatarDataHora, formatarMoeda } from './formatacao';

const semEspacoEstranho = (texto: string) => texto.replace(/ | /g, ' ');

describe('Formatação pt-BR', () => {
  it('@spec:AC-019 real e dólar saem em pt-BR e o símbolo distingue os dois', () => {
    const real = semEspacoEstranho(formatarMoeda(1234.5, 'BRL'));
    const dolar = semEspacoEstranho(formatarMoeda(1234.5, 'USD'));

    expect(real).toBe('R$ 1.234,50');
    expect(dolar).toBe('US$ 1.234,50');
    expect(real).not.toBe(dolar);
  });

  it('@spec:AC-019 valores negativos e zero também seguem a convenção brasileira', () => {
    expect(semEspacoEstranho(formatarMoeda(-0.5, 'BRL'))).toBe('-R$ 0,50');
    expect(semEspacoEstranho(formatarMoeda(0, 'USD'))).toBe('US$ 0,00');
  });

  it('@spec:AC-020 data e hora seguem dia/mês/ano com hora de 24 horas', () => {
    const instante = new Date(2026, 8, 8, 15, 42, 0);

    expect(formatarData(instante)).toBe('08/09/2026');
    expect(semEspacoEstranho(formatarDataHora(instante))).toBe('08/09/2026 15:42');
    expect(formatarDataHora(instante)).not.toMatch(/AM|PM/i);
  });
});

describe('Data sem hora', () => {
  it('uma data de calendário não recua um dia por causa do fuso', () => {
    expect(formatarData('2026-09-08')).toBe('08/09/2026');
    expect(formatarData('2026-01-01')).toBe('01/01/2026');
  });

  it('instante com hora continua sendo lido como instante', () => {
    expect(formatarData('2026-09-08T23:30:00')).toBe('08/09/2026');
  });
});
