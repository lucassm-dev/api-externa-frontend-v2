import { TestBed } from '@angular/core/testing';
import { CarteiraPreferida } from './carteira-preferida';
import { CarteiraResumida } from './painel.model';

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

describe('Carteira lembrada no consolidado', () => {
  const carteiras = [carteira(9, 'Longo prazo'), carteira(4, 'Dividendos'), carteira(2, 'Primeira')];

  function novaVisita(): CarteiraPreferida {
    TestBed.resetTestingModule();
    return TestBed.inject(CarteiraPreferida);
  }

  beforeEach(() => localStorage.clear());

  it('@spec:AC-054 a escolha de uma visita é a carteira aberta na visita seguinte', () => {
    novaVisita().lembrar(4);

    expect(novaVisita().escolherEntre(carteiras)?.id).toBe(4);
  });

  it('@spec:AC-054 sem escolha anterior o consolidado abre na carteira mais recente', () => {
    expect(novaVisita().escolherEntre(carteiras)?.id).toBe(9);
  });

  it('@spec:AC-054 carteira lembrada que não existe mais cai na mais recente', () => {
    novaVisita().lembrar(777);

    expect(novaVisita().escolherEntre(carteiras)?.id).toBe(9);
  });

  it('@spec:AC-054 sem carteira nenhuma não há o que escolher', () => {
    expect(novaVisita().escolherEntre([])).toBeNull();
  });
});
