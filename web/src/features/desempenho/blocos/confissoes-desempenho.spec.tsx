import { render } from '@testing-library/react';
import { IdadeDasCotacoes } from '../idade-das-cotacoes';
import { ConfissoesDesempenho } from './confissoes-desempenho';

function minutosAtras(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString();
}

function montar(idade: IdadeDasCotacoes, avisos: string[] = [], taxa: number | null = 5.4) {
  return render(
    <ConfissoesDesempenho
      idade={idade}
      avisosDoConsolidado={avisos}
      taxaCambio={taxa}
      dataHoraTaxaCambio={taxa === null ? null : minutosAtras(3)}
    />,
  ).container;
}

describe('O que a tela de desempenho confessa', () => {
  it('@spec:AC-205 o aviso de dividendos e JCP fica no corpo da tela, permanente', () => {
    const elemento = montar({ maisAntiga: minutosAtras(2), tickersDefasados: [] });

    const aviso = elemento.querySelector('[data-aviso-dividendos]');
    expect(aviso?.textContent).toContain('não inclui dividendos nem JCP');
    expect(aviso?.getAttribute('title')).toBeNull();
    expect(aviso?.closest('[hidden]')).toBeNull();
  });

  it('@spec:AC-206 o horário mais antigo entre as posições aparece e qualifica a tela', () => {
    const maisAntiga = minutosAtras(40);
    const elemento = montar({ maisAntiga, tickersDefasados: ['VALE3'] });

    const snapshot = elemento.querySelector('[data-aviso-snapshot]');
    expect(snapshot?.textContent).toContain('idades diferentes');
    expect(elemento.querySelector('[data-horario-mais-antigo]')?.textContent).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(snapshot?.getAttribute('data-defasado')).toBe('true');
  });

  it('@spec:AC-207 cotação defasada gera aviso no topo com os tickers afetados', () => {
    const elemento = montar({ maisAntiga: minutosAtras(40), tickersDefasados: ['VALE3', 'AAPL'] });

    const defasagem = elemento.querySelector('[data-aviso-defasagem]');
    expect(defasagem?.textContent).toContain('VALE3');
    expect(defasagem?.textContent).toContain('AAPL');
  });

  it('@spec:AC-207 carteira sem preço defasado não inventa aviso', () => {
    const elemento = montar({ maisAntiga: minutosAtras(2), tickersDefasados: [] });

    expect(elemento.querySelector('[data-aviso-defasagem]')).toBeNull();
    expect(elemento.querySelector('[data-aviso-snapshot]')?.getAttribute('data-defasado')).toBe('false');
  });

  it('@spec:AC-208 a taxa de câmbio aparece com o horário, e os avisos do backend vêm como aviso', () => {
    const elemento = montar({ maisAntiga: minutosAtras(2), tickersDefasados: [] }, [
      'Cotação do dólar indisponível: usando a última taxa conhecida.',
    ]);

    expect(elemento.querySelector('[data-taxa-cambio] [data-numero]')?.textContent).toContain('5,40');
    expect(elemento.querySelector('[data-taxa-cambio] [data-horario]')?.textContent).toMatch(/\d{2}:\d{2}/);

    const aviso = elemento.querySelector('[data-aviso-consolidado]');
    expect(aviso?.textContent).toContain('última taxa conhecida');
    expect(aviso?.querySelector('[role="alert"]')).toBeNull();
  });

  it('@spec:AC-206 sem posição nenhuma, a tela diz que não há cotação para datar', () => {
    const elemento = montar({ maisAntiga: null, tickersDefasados: [] });

    expect(elemento.querySelector('[data-aviso-snapshot]')?.textContent).toContain('para datar');
    expect(elemento.querySelector('[data-horario-mais-antigo]')).toBeNull();
  });
});
