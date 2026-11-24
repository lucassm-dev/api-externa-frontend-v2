import { Acao } from './acoes.model';
import { classificarAtualizacao } from './desfecho-cotacao';

const ANTES: Acao = {
  id: 12,
  ticker: 'PETR4',
  nomeEmpresa: 'Petróleo Brasileiro S.A.',
  mercado: 'BR',
  moeda: 'BRL',
  cotacaoAtual: 38.42,
  dataHoraCotacao: '2026-09-09T13:20:00',
};

describe('Desfecho da atualização de cotação', () => {
  it('@spec:AC-137 preço e horário novos são comunicados como cotação atualizada', () => {
    const resultado = classificarAtualizacao(ANTES, {
      ...ANTES,
      cotacaoAtual: 39.1,
      dataHoraCotacao: '2026-09-09T13:40:00',
    });

    expect(resultado.desfecho).toBe('preco-novo');
    expect(resultado.mensagem).toContain('13:40');
  });

  it('@spec:AC-138 mesmo preço e mesmo horário significam cache válido, não falha', () => {
    const resultado = classificarAtualizacao(ANTES, { ...ANTES });

    expect(resultado.desfecho).toBe('continua-atual');
    expect(resultado.mensagem).toContain('continua atual');
    expect(resultado.mensagem).toContain('13:20');
    expect(resultado.mensagem.toLowerCase()).not.toContain('erro');
    expect(resultado.mensagem.toLowerCase()).not.toContain('falh');
  });

  it('@spec:AC-138 a mensagem do cache válido é distinta da de preço novo', () => {
    const cache = classificarAtualizacao(ANTES, { ...ANTES });
    const novo = classificarAtualizacao(ANTES, {
      ...ANTES,
      cotacaoAtual: 39.1,
      dataHoraCotacao: '2026-09-09T13:40:00',
    });

    expect(cache.mensagem).not.toBe(novo.mensagem);
  });

  it('@spec:AC-137 preço igual com horário novo é consulta que aconteceu, não cache', () => {
    const resultado = classificarAtualizacao(ANTES, {
      ...ANTES,
      dataHoraCotacao: '2026-09-09T13:45:00',
    });

    expect(resultado.desfecho).toBe('preco-novo');
  });
});
