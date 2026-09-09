import { TestBed } from '@angular/core/testing';
import { EstadoVazio } from './estado-vazio';

describe('Estado vazio', () => {
  it('@spec:AC-223 explica a ausência e oferece um próximo passo acionável', async () => {
    const fixture = TestBed.createComponent(EstadoVazio);
    fixture.componentRef.setInput('titulo', 'Nenhuma carteira ainda');
    fixture.componentRef.setInput('descricao', 'Crie uma carteira para começar a organizar seus ativos.');
    fixture.componentRef.setInput('rotuloAcao', 'Criar carteira');
    await fixture.whenStable();

    let acionou = 0;
    fixture.componentInstance.acao.subscribe(() => acionou++);
    const elemento = fixture.nativeElement as HTMLElement;
    const botao = elemento.querySelector('[data-proximo-passo]') as HTMLButtonElement;

    expect(elemento.querySelector('[data-titulo]')?.textContent).toContain('Nenhuma carteira ainda');
    expect(elemento.querySelector('[data-descricao]')?.textContent).toContain('Crie uma carteira');
    expect(botao.textContent).toContain('Criar carteira');
    botao.click();
    expect(acionou).toBe(1);
  });
});
