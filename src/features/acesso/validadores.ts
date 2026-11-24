export const REGRA_CPF = 'Os 11 dígitos, no formato 000.000.000-00';
export const REGRA_SENHA = 'Ao menos 8 caracteres, com uma letra e um número';
export const REGRA_EMAIL = 'No formato nome@dominio.com';

const CPF = /^\d{11}$/;
// Mesma política do backend (AutenticacaoService.POLITICA_SENHA).
const SENHA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
// O mesmo padrão do Validators.email do Angular, para o login e o cadastro
// aceitarem e recusarem exatamente os mesmos e-mails de antes.
const EMAIL =
  /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

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
export function validarCpf(valor: string): string | null {
  return CPF.test(digitosDoCpf(valor)) ? null : REGRA_CPF;
}

export function validarSenha(valor: string): string | null {
  return SENHA.test(String(valor ?? '')) ? null : REGRA_SENHA;
}

/** Como o Validators.email: vazio não é erro de formato (o obrigatório cuida disso). */
export function emailValido(valor: string): boolean {
  return valor === '' || EMAIL.test(valor);
}
