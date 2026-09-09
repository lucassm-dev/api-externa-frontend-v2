import { Carteira, ConsolidadoDaCarteira, LucroRealizado, Posicao } from '../carteiras/carteiras.model';
import { MapaDeMoedas } from './moeda-das-posicoes';

/**
 * O que a tela precisa de uma carteira. `null` é sempre leitura que falhou, e
 * nunca zero: um bloco que não pôde ser lido diz isso, em vez de mostrar zero
 * como se fosse resultado apurado (ADR-006).
 */
export interface DadosDaCarteira {
  consolidado: ConsolidadoDaCarteira | null;
  posicoes: Posicao[] | null;
  lucroRealizado: LucroRealizado | null;
  moedas: MapaDeMoedas;
}

/** Página larga, como no extrato e na varredura de carteiras (ASM-046). */
export const ACOES_PARA_MOEDA = 200;
export const CARTEIRAS_NO_SELETOR = 200;

export type CarteiraDoSeletor = Carteira;
