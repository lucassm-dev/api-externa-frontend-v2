import { formatarHora, formatarMoeda } from '../../core/formatacao/formatacao';
import { Acao } from './acoes.model';

/**
 * Os dois desfechos que o servidor devolve com sucesso. Os outros dois —
 * EXT-009 e EXT-010 — chegam como erro e são traduzidos pela fundação.
 */
export type Desfecho = 'preco-novo' | 'continua-atual';

export interface ResultadoDaAtualizacao {
  desfecho: Desfecho;
  mensagem: string;
}

/**
 * Dentro dos 15 minutos o backend reaproveita o valor salvo e nem chama a
 * fonte: o horário volta igual. Sem mensagem própria isso parece botão que não
 * funcionou (ADR-005) — é o desfecho que mais gera dúvida no produto.
 *
 * Horário diferente significa consulta que aconteceu, mesmo que o número tenha
 * voltado igual.
 */
export function classificarAtualizacao(anterior: Acao, atual: Acao): ResultadoDaAtualizacao {
  const horario = formatarHora(atual.dataHoraCotacao);

  if (anterior.dataHoraCotacao === atual.dataHoraCotacao) {
    return {
      desfecho: 'continua-atual',
      mensagem: `O preço continua atual: ele foi obtido às ${horario} e ainda vale, então não houve consulta nova à fonte.`,
    };
  }

  return {
    desfecho: 'preco-novo',
    mensagem: `Cotação atualizada: ${formatarMoeda(atual.cotacaoAtual, atual.moeda)} às ${horario}.`,
  };
}
