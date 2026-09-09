import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { readFileSync } from 'node:fs';
import { CabecalhoOrdenavel, SentidoOrdenacao } from './cabecalho-ordenavel';

@Component({
  imports: [CabecalhoOrdenavel],
  template: `
    <table>
      <thead>
        <tr>
          <th
            app-cabecalho-ordenavel
            rotulo="Data"
            [sentido]="sentido"
            (ordenar)="pedidos = pedidos + 1"
          ></th>
        </tr>
      </thead>
    </table>
  `,
})
class HospedeiroCabecalhoOrdenavel {
  sentido: SentidoOrdenacao = 'nenhum';
  pedidos = 0;
}

describe('Cabeçalho ordenável', () => {
  let fixture: ComponentFixture<HospedeiroCabecalhoOrdenavel>;

  async function montar(sentido: SentidoOrdenacao): Promise<HTMLTableCellElement> {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(HospedeiroCabecalhoOrdenavel);
    fixture.componentInstance.sentido = sentido;
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('th') as HTMLTableCellElement;
  }

  it('@spec:AC-242 anuncia o sentido atual em aria-sort e o alterna conforme o estado recebido', async () => {
    let th = await montar('nenhum');
    expect(th.tagName).toBe('TH');
    expect(th.getAttribute('aria-sort')).toBe('none');

    th = await montar('crescente');
    expect(th.getAttribute('aria-sort')).toBe('ascending');

    th = await montar('decrescente');
    expect(th.getAttribute('aria-sort')).toBe('descending');
  });

  it('@spec:AC-242 responde ao acionamento do cabeçalho emitindo o pedido de ordenação', async () => {
    const th = await montar('nenhum');

    (th.querySelector('button') as HTMLButtonElement).click();
    (th.querySelector('button') as HTMLButtonElement).click();

    expect(fixture.componentInstance.pedidos).toBe(2);
  });

  it('@spec:AC-242 mantém o glifo decorativo, deixando aria-sort e o nome do botão anunciarem', async () => {
    const th = await montar('crescente');
    const botao = th.querySelector('button') as HTMLButtonElement;
    const glifo = th.querySelector('[data-glifo]') as SVGElement;

    expect(botao.textContent?.trim()).toContain('Data');
    expect(botao.disabled).toBe(false);
    expect(glifo.getAttribute('aria-hidden')).toBe('true');
    expect(glifo.getAttribute('focusable')).toBe('false');
  });

  it('@spec:AC-242 pinta o glifo apenas com token ou currentColor, sem cor literal (P-003)', () => {
    const estilo = readFileSync('src/app/shared/tabela/cabecalho-ordenavel.scss', 'utf8');
    expect(estilo).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/);
  });
});
