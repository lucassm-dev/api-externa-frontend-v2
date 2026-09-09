import { AbstractControl, ValidationErrors } from '@angular/forms';

export const REGRA_CPF = 'Os 11 dígitos, no formato 000.000.000-00';
export const REGRA_SENHA = 'Ao menos 8 caracteres, com uma letra e um número';
export const REGRA_EMAIL = 'No formato nome@dominio.com';

const CPF = /^\d{11}$/;
// Mesma política do backend (AutenticacaoService.POLITICA_SENHA).
const SENHA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export function digitosDoCpf(valor: string): string {
  return String(valor ?? '').replace(/\D/g, '');
}

/** A pontuação é como o brasileiro lê CPF; ela cresce junto com o que se digita. */
export function formatarCpf(valor: string): string {
  const digitos = digitosDoCpf(valor).slice(0, 11);
  if (digitos.length <= 3) {
    return digitos;
  }
  if (digitos.length <= 6) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
  }
  if (digitos.length <= 9) {
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
}

/** A máscara é apresentação: o que vale são os 11 dígitos, com ou sem ela. */
export function cpfValidator(controle: AbstractControl): ValidationErrors | null {
  return CPF.test(digitosDoCpf(String(controle.value ?? ''))) ? null : { cpf: REGRA_CPF };
}

export function senhaValidator(controle: AbstractControl): ValidationErrors | null {
  const valor = String(controle.value ?? '');
  return SENHA.test(valor) ? null : { senha: REGRA_SENHA };
}
