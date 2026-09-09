import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarteiraResumida, ConsolidadoDaCarteira } from '../painel.model';
import { Consolidado } from './consolidado';

function carteira(id: number, nome: string): CarteiraResumida {
  return {
    id,
    investidorId: 1,
    corretoraId: 1,
    nomeCorretora: 'Corretora',
    mercado: 'BR',
    moeda: 'BRL',
    nome,
    ativa: true,
  };
}

describe('Consolidado de uma carteira', () => {
  let fixture: ComponentFixture<Consolidado>;

  const carteiras = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos')];

  const numeros: ConsolidadoDaCarteira = {
    valorInvestido: 10_000,
    valorDeMercado: 11_500.5,
    lucroNaoRealizado: 1500.5,
    taxaCambioAtual: 5.42,
    dataHoraTaxaCambio: new Date().toISOString(),
    avisos: [],
  };

  async function montar(consolidado: ConsolidadoDaCarteira | null, selecionada: number | null = 9) {
    TestBed.resetTestingModule();
    fixture = TestBed.createComponent(Consolidado);
    fixture.componentRef.setInput('carteiras', carteiras);
    fixture.componentRef.setInput('carteiraSelecionada', selecionada);
    fixture.componentRef.setInput('consolidado', consolidado);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('@spec:AC-053 mostra investido, valor de mercado e resultado da carteira escolhida, em real', async () => {
    const elemento = await montar(numeros);

    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('R$');
    expect(elemento.querySelector('[data-valor-investido]')?.textContent).toContain('10.000,00');
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
    expect(elemento.querySelector('[data-lucro-nao-realizado]')?.textContent).toContain('1.500,50');
    expect(
      elemento.querySelector('[data-lucro-nao-realizado] [data-variacao]')?.getAttribute('data-direcao'),
    ).toBe('alta');
  });

  it('@spec:AC-053 a taxa de câmbio e o horário dela aparecem junto do número', async () => {
    const elemento = await montar(numeros);

    const cambio = elemento.querySelector('[data-taxa-cambio]');
    expect(cambio?.querySelector('[data-numero]')?.textContent).toContain('5,42');
    expect(cambio?.querySelector('[data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('@spec:AC-053 o seletor lista as carteiras e escolher uma avisa quem pediu o consolidado', async () => {
    const elemento = await montar(numeros);
    let escolhida: number | undefined;
    fixture.componentInstance.selecionar.subscribe((id) => (escolhida = id));

    const seletor = elemento.querySelector('[data-seletor-carteira]') as HTMLSelectElement;
    expect([...seletor.options].map((opcao) => opcao.textContent?.trim())).toEqual([
      'Longo prazo',
      'Dividendos',
    ]);

    seletor.value = '4';
    seletor.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(escolhida).toBe(4);
  });

  it('@spec:AC-054 abre já na carteira lembrada, sem o investidor escolher de novo', async () => {
    const elemento = await montar(numeros, 4);

    const seletor = elemento.querySelector('[data-seletor-carteira]') as HTMLSelectElement;
    expect(seletor.value).toBe('4');
  });

  it('@spec:AC-055 aviso de câmbio aparece como aviso, com os números ainda na tela', async () => {
    const elemento = await montar({
      ...numeros,
      avisos: ['Câmbio indisponível: usando a última taxa conhecida.'],
    });

    const aviso = elemento.querySelector('[data-aviso-consolidado] [data-nivel]');
    expect(aviso?.getAttribute('data-nivel')).toBe('aviso');
    expect(elemento.querySelector('[data-nivel="erro"]')).toBeNull();
    expect(elemento.querySelector('[data-valor-de-mercado]')?.textContent).toContain('11.500,50');
  });

  it('@spec:AC-238 cada indicador põe o rótulo pequeno acima e o valor em destaque, com selo de variação no resultado', async () => {
    const elemento = await montar(numeros);

    const indicadores = Array.from(elemento.querySelectorAll('[data-indicador]'));
    expect(indicadores.length).toBe(3);

    for (const indicador of indicadores) {
      const rotulo = indicador.querySelector('[data-indicador-rotulo]');
      const valor = indicador.querySelector('[data-indicador-valor]');
      expect(rotulo).not.toBeNull();
      expect(valor).not.toBeNull();
      const rotuloAntesDoValor =
        rotulo!.compareDocumentPosition(valor!) & Node.DOCUMENT_POSITION_FOLLOWING;
      expect(rotuloAntesDoValor).toBeTruthy();
    }

    const valorInvestido = elemento.querySelector('[data-valor-investido]');
    expect(valorInvestido!.closest('[data-indicador-valor]')).not.toBeNull();

    const resultado = elemento.querySelector('[data-lucro-nao-realizado]');
    expect(resultado!.matches('[data-indicador-valor]')).toBe(true);
    expect(resultado!.querySelector('[data-variacao]')).not.toBeNull();

    const selo = elemento.querySelector('[data-selo-resultado] [data-selo]');
    expect(selo!.getAttribute('data-variante')).toBe('alta');
    expect(selo!.textContent).toContain('Alta');
  });

  it('@spec:AC-238 o selo de variação do resultado acompanha o sinal do número', async () => {
    const prejuizo = await montar({ ...numeros, lucroNaoRealizado: -800 });
    expect(
      prejuizo.querySelector('[data-selo-resultado] [data-selo]')?.getAttribute('data-variante'),
    ).toBe('baixa');

    const zerado = await montar({ ...numeros, lucroNaoRealizado: 0 });
    expect(
      zerado.querySelector('[data-selo-resultado] [data-selo]')?.getAttribute('data-variante'),
    ).toBe('estavel');
  });

  it('@spec:AC-239 nenhum indicador mostra comparação com período anterior ou miniatura de evolução', async () => {
    const elemento = await montar(numeros);

    expect(
      elemento.querySelector(
        '[data-comparacao], [data-vs-periodo], [data-periodo-anterior], [data-evolucao], [data-sparkline], [data-minigrafico], canvas, svg[data-grafico]',
      ),
    ).toBeNull();

    const texto = elemento.textContent ?? '';
    expect(texto).not.toMatch(/m[êe]s anterior|per[íi]odo anterior|últimos?\s+\d+\s+dias|no ano|desde o in[íi]cio/i);
  });

  it('@spec:AC-056 taxa com mais de quinze minutos ganha a marcação de dado defasado', async () => {
    const recente = await montar(numeros);
    expect(
      recente.querySelector('[data-taxa-cambio] [data-valor-com-horario]')?.getAttribute('data-defasado'),
    ).toBe('false');

    const velha = await montar({
      ...numeros,
      dataHoraTaxaCambio: new Date(Date.now() - 40 * 60_000).toISOString(),
    });
    expect(
      velha.querySelector('[data-taxa-cambio] [data-valor-com-horario]')?.getAttribute('data-defasado'),
    ).toBe('true');
    expect(velha.querySelector('[data-marcacao-defasado]')).not.toBeNull();
  });
});
