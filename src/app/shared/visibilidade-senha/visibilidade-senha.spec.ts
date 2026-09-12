import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VisibilidadeSenha } from './visibilidade-senha';

@Component({
  imports: [VisibilidadeSenha],
  template: `
    <form (ngSubmit)="envios.set(envios() + 1)">
      <input
        [type]="visivel() ? 'text' : 'password'"
        value="segredo-123"
        aria-label="Senha"
        data-campo
      />
      <app-visibilidade-senha [(visivel)]="visivel" [campo]="campo()" />
    </form>
  `,
})
class TelaDeTeste {
  readonly visivel = signal(false);
  readonly campo = signal('senha');
  readonly envios = signal(0);
}

async function montar() {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(TelaDeTeste);
  await fixture.whenStable();
  return {
    fixture,
    tela: fixture.componentInstance,
    campo: fixture.nativeElement.querySelector('[data-campo]') as HTMLInputElement,
    botao: fixture.nativeElement.querySelector('[data-visibilidade-senha]') as HTMLButtonElement,
  };
}

describe('Botão de visibilidade da senha', () => {
  it('@spec:AC-295 revela o conteúdo digitado e volta a ocultar', async () => {
    const { fixture, campo, botao } = await montar();

    expect(campo.type).toBe('password');

    botao.click();
    await fixture.whenStable();
    expect(campo.type).toBe('text');
    expect(campo.value).toBe('segredo-123');

    botao.click();
    await fixture.whenStable();
    expect(campo.type).toBe('password');
  });

  it('@spec:AC-296 o nome acessível descreve a ação e acompanha o estado', async () => {
    const { fixture, botao } = await montar();

    expect(botao.getAttribute('aria-label')).toBe('Mostrar senha');
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(botao.querySelector('[data-icone="revela"]')).not.toBeNull();

    botao.click();
    await fixture.whenStable();

    expect(botao.getAttribute('aria-label')).toBe('Ocultar senha');
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(botao.querySelector('[data-icone="oculta"]')).not.toBeNull();
  });

  it('@spec:AC-296 o rótulo nomeia o campo, para distinguir dois na mesma tela', async () => {
    const { fixture, tela, botao } = await montar();

    tela.campo.set('confirmação de senha');
    await fixture.whenStable();

    expect(botao.getAttribute('aria-label')).toBe('Mostrar confirmação de senha');
  });

  it('@spec:AC-298 acionar o botão não envia o formulário que o contém', async () => {
    const { fixture, tela, botao } = await montar();

    // Dentro de <form>, botão sem type="button" envia o formulário.
    expect(botao.type).toBe('button');

    botao.click();
    await fixture.whenStable();

    expect(tela.envios()).toBe(0);
  });
});
