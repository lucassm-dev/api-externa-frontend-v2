export type Moeda = 'BRL' | 'USD';

export const LOCALE_PADRAO = 'pt-BR';

const formatadores = new Map<string, Intl.NumberFormat>();

function formatadorDe(moeda: Moeda): Intl.NumberFormat {
  let formatador = formatadores.get(moeda);
  if (!formatador) {
    formatador = new Intl.NumberFormat(LOCALE_PADRAO, {
      style: 'currency',
      currency: moeda,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatadores.set(moeda, formatador);
  }
  return formatador;
}

export function formatarMoeda(valor: number, moeda: Moeda): string {
  return formatadorDe(moeda).format(valor);
}

export function formatarReal(valor: number): string {
  return formatarMoeda(valor, 'BRL');
}

export function formatarDolar(valor: number): string {
  return formatarMoeda(valor, 'USD');
}

export function formatarNumero(valor: number, casas = 2): string {
  return new Intl.NumberFormat(LOCALE_PADRAO, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

const DATA_PURA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Data sem hora (`AAAA-MM-DD`) é um dia do calendário, não um instante: lida
 * como UTC ela recuaria um dia em fuso negativo, e a data da base oficial da
 * CVM apareceria um dia antes do que o servidor informou.
 */
function comoData(instante: Date | string): Date {
  if (typeof instante === 'string' && DATA_PURA.test(instante)) {
    const [ano, mes, dia] = instante.split('-').map(Number);
    return new Date(ano, mes - 1, dia);
  }
  return new Date(instante);
}

export function formatarData(instante: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE_PADRAO, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(comoData(instante));
}

export function formatarHora(instante: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE_PADRAO, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(instante));
}

export function formatarDataHora(instante: Date | string): string {
  return `${formatarData(instante)} ${formatarHora(instante)}`;
}
