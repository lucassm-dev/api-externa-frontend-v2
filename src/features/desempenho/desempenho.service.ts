import { http } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { carteirasService } from '@/features/carteiras/carteiras.service';
import { CARTEIRAS_NO_SELETOR, DadosDaCarteira } from './desempenho.model';
import { moedasDoCatalogo } from './moeda-das-posicoes';

const ouNulo = <T>(leitura: Promise<T>): Promise<T | null> => leitura.catch(() => null);

/**
 * Quatro leituras por carteira: consolidado, posições, lucro realizado e o
 * catálogo de ações — este último só para saber em que moeda cada posição está
 * cotada, já que `posicoes` não devolve esse campo (ASM-045). Nenhum endpoint
 * novo: tudo já existe.
 *
 * Cada leitura falha sozinha e vira `null` sem derrubar as outras (ADR-006).
 * O catálogo que falha não vira `null`: vira mapa vazio, e aí toda posição fica
 * com moeda desconhecida — o que faz a composição não fechar e a tela avisar.
 */
export const desempenhoService = {
  /** Mais recente primeiro, como no painel e na lista de carteiras. */
  async carteiras(): Promise<Carteira[]> {
    const pagina = await http.get<Pagina<Carteira>>('/carteiras', { params: { page: 0, size: CARTEIRAS_NO_SELETOR, sort: 'id,desc' } });
    return pagina.content;
  },

  async dadosDaCarteira(carteiraId: number): Promise<DadosDaCarteira> {
    const [consolidado, posicoes, lucroRealizado, moedas] = await Promise.all([
      ouNulo(carteirasService.consolidado(carteiraId)),
      ouNulo(carteirasService.posicoes(carteiraId)),
      ouNulo(carteirasService.lucroRealizado(carteiraId)),
      moedasDoCatalogo(),
    ]);
    return { consolidado, posicoes, lucroRealizado, moedas };
  },
};
