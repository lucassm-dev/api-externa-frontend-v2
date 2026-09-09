import { FormControl } from '@angular/forms';
import { REGRA_CPF, REGRA_SENHA, cpfValidator, senhaValidator } from './validadores';

describe('Validação antes do envio', () => {
  it('@spec:AC-027 CPF precisa ter exatamente 11 dígitos numéricos', () => {
    const invalidos = ['1234567890', '123456789012', '1234567890a', 'abcdefghijk', '123.456.789-0', ''];
    for (const valor of invalidos) {
      expect(cpfValidator(new FormControl(valor)), `aceitou ${valor}`).not.toBeNull();
    }

    // A máscara é apresentação: pontuado ou corrido, o que vale são os dígitos.
    expect(cpfValidator(new FormControl('12345678901'))).toBeNull();
    expect(cpfValidator(new FormControl('123.456.789-01'))).toBeNull();
  });

  it('@spec:AC-028 senha precisa de 8 caracteres, com ao menos uma letra e um número', () => {
    const invalidas = ['curta1', 'somenteletras', '12345678', 'Abc12', '        '];
    for (const valor of invalidas) {
      expect(senhaValidator(new FormControl(valor)), `aceitou ${valor}`).not.toBeNull();
    }

    expect(senhaValidator(new FormControl('segura123'))).toBeNull();
    expect(senhaValidator(new FormControl('A1bcdefg'))).toBeNull();
  });

  it('@spec:AC-034 as regras que o investidor precisa ler estão escritas, não só codificadas', () => {
    expect(REGRA_CPF).toContain('11');
    expect(REGRA_SENHA).toContain('8');
    expect(REGRA_SENHA).toMatch(/letra/i);
    expect(REGRA_SENHA).toMatch(/número/i);
  });
});
