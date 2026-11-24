import { validarCnpj, ehCnpjValido, formatarCnpj, somenteDigitos } from './cnpj';

describe('CNPJ', () => {
  it('@spec:AC-067 máscara e dígitos puros produzem o mesmo CNPJ para o envio', () => {
    expect(somenteDigitos('02.332.886/0001-04')).toBe('02332886000104');
    expect(somenteDigitos('02332886000104')).toBe('02332886000104');
    expect(somenteDigitos(' 02.332.886 / 0001-04 ')).toBe('02332886000104');
  });

  it('@spec:AC-067 o validador do formulário aceita as duas formas de digitar', () => {
    expect(validarCnpj('02.332.886/0001-04')).toBeNull();
    expect(validarCnpj('02332886000104')).toBeNull();
  });

  it('formata para leitura e tolera valor incompleto', () => {
    expect(formatarCnpj('02332886000104')).toBe('02.332.886/0001-04');
    expect(formatarCnpj('02.332.886/0001-04')).toBe('02.332.886/0001-04');
    expect(formatarCnpj('0233288')).toBe('0233288');
  });

  it('recusa antes do envio só o que é indiscutivelmente inválido', () => {
    expect(ehCnpjValido('02332886000104')).toBe(true);
    expect(ehCnpjValido('02332886000105')).toBe(false);
    expect(ehCnpjValido('11111111111111')).toBe(false);
    expect(ehCnpjValido('0233288600010')).toBe(false);
    expect(ehCnpjValido('')).toBe(false);
  });
});
