import { readFileSync } from 'node:fs';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Botao, IntencaoBotao } from './botao';

const folha = readFileSync('src/app/shared/botao/botao.scss', 'utf8');

@Component({
  imports: [Botao],
  template: `
    <button
      appBotao
      type="button"
      [intencao]="intencao()"
      [ocupado]="ocupado()"
      (click)="cliques.set(cliques() + 1)"
    >
      Registrar compra
    </button>
  `,
})
class TelaDeTeste {
  readonly intencao = signal<IntencaoBotao>('primaria');
  readonly ocupado = signal(false);
  readonly cliques = signal(0);
}

async function montar() {
  TestBed.resetTestingModule();
  const fixture = TestBed.createComponent(TelaDeTeste);
  await fixture.whenStable();
  return {
    fixture,
    tela: fixture.componentInstance,
    botao: fixture.nativeElement.querySelector('button') as HTMLButtonElement,
  };
}

describe('Botão do produto', () => {
  it('@spec:AC-267 cada intenção conhecida marca o botão com aparência própria', async () => {
    const intencoes: IntencaoBotao[] = ['primaria', 'secundaria', 'sutil', 'destrutiva'];

    for (const intencao of intencoes) {
      const { fixture, tela, botao } = await montar();
      tela.intencao.set(intencao);
      await fixture.whenStable();

      expect(botao.getAttribute('data-intencao')).toBe(intencao);
      expect(folha).toContain(`[data-intencao='${intencao}']`);
    }
  });

  it('@spec:AC-267 intenção desconhecida é recusada, não vira aparência padrão', async () => {
    const { fixture, tela } = await montar();

    tela.intencao.set('urgente' as IntencaoBotao);
    await expect(fixture.whenStable()).rejects.toThrow(/Inten..o de bot.o desconhecida/);
  });

  it('@spec:AC-268 ocupado se anuncia, mantém o rótulo e não dispara a ação de novo', async () => {
    const { fixture, tela, botao } = await montar();

    botao.click();
    expect(tela.cliques()).toBe(1);

    tela.ocupado.set(true);
    await fixture.whenStable();

    expect(botao.getAttribute('aria-busy')).toBe('true');
    expect(botao.disabled).toBe(true);
    expect(botao.textContent?.trim()).toBe('Registrar compra');

    botao.click();
    expect(tela.cliques()).toBe(1);
  });

  it('@spec:AC-269 o foco é visível com anel próprio, sem apagar o contorno do sistema', async () => {
    const { botao } = await montar();

    botao.focus();
    expect(document.activeElement).toBe(botao);
    expect(folha).toMatch(/:host\(:focus-visible\)[\s\S]*?box-shadow:\s*var\(--anel-foco\)/);
  });

  it('@spec:AC-269 nenhum tamanho fica abaixo do alvo de toque onde há toque', async () => {
    expect(folha).toMatch(/:host\s*\{[\s\S]*?min-height:\s*var\(--alvo-toque\)/);

    const blocoDeToque = folha.slice(folha.indexOf('@media (pointer: coarse)'));
    expect(blocoDeToque).toMatch(/\[data-tamanho='compacto'\][\s\S]*?min-height:\s*var\(--alvo-toque\)/);
  });
});
