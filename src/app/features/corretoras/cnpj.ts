import { AbstractControl, ValidationErrors } from '@angular/forms';

export const REGRA_CNPJ = 'Com máscara (00.000.000/0000-00) ou 14 dígitos';

export function somenteDigitos(valor: string): string {
  return String(valor ?? '').replace(/\D/g, '');
}

export function formatarCnpj(valor: string): string {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 14) {
    return valor;
  }
  return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function digitoVerificador(base: string, pesoInicial: number): number {
  let peso = pesoInicial;
  let soma = 0;
  for (const caractere of base) {
    soma += Number(caractere) * peso;
    peso = peso === 2 ? 9 : peso - 1;
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Só o que dá para barrar sem consultar ninguém: 14 dígitos e verificadores
 * coerentes. Se a empresa existe, se está na Receita e se é autorizada na CVM
 * é veredito do servidor — a tela nunca antecipa isso (PRD-004).
 */
export function ehCnpjValido(valor: string): boolean {
  const digitos = somenteDigitos(valor);
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) {
    return false;
  }
  const primeiro = digitoVerificador(digitos.slice(0, 12), 5);
  const segundo = digitoVerificador(digitos.slice(0, 13), 6);
  return digitos.endsWith(`${primeiro}${segundo}`);
}

export function cnpjValidator(controle: AbstractControl): ValidationErrors | null {
  return ehCnpjValido(String(controle.value ?? '')) ? null : { cnpj: REGRA_CNPJ };
}
