import { http, Parametros } from '@/core/api/http';
import { Pagina } from '@/core/api/pagina';
import { OperacaoDoExtrato } from '@/features/operacoes/operacoes.model';

export interface TotaisDoRecorte {
  compras: number;
  volumeComprado: number;
  vendas: number;
  volumeVendido: number;
  lucro: number;
  prejuizo: number;
  /** Operações em dólar sem taxa: ficam fora dos totais em vez de entrar como se fossem real. */
  semTaxa: number;
  /** O recorte passou do limite de leitura e os totais cobrem só o começo dele. */
  incompleto: boolean;
}

const POR_PAGINA = 200;
// shortcut: lê no máximo 25 páginas (5.000 operações) por recorte (ASM-100); acima disso, pedir os totais ao backend.
const MAXIMO_DE_PAGINAS = 25;

/**
 * Valor e resultado vêm na moeda da ação; cada operação entra em real pela
 * taxa do dia dela, como o backend faz no lucro realizado da carteira (AC-398).
 */
export function somarRecorte(operacoes: OperacaoDoExtrato[]): TotaisDoRecorte {
  const totais: TotaisDoRecorte = { compras: 0, volumeComprado: 0, vendas: 0, volumeVendido: 0, lucro: 0, prejuizo: 0, semTaxa: 0, incompleto: false };
  for (const operacao of operacoes) {
    const taxa = operacao.moeda === 'BRL' ? 1 : operacao.taxaCambioNaOperacao;
    if (!taxa) {
      totais.semTaxa += 1;
      continue;
    }
    if (operacao.tipo === 'COMPRA') {
      totais.compras += 1;
      totais.volumeComprado += operacao.valorTotal * taxa;
    } else {
      totais.vendas += 1;
      totais.volumeVendido += operacao.valorTotal * taxa;
      const resultado = (operacao.lucroRealizado ?? 0) * taxa;
      if (resultado > 0) totais.lucro += resultado;
      else totais.prejuizo -= resultado;
    }
  }
  return totais;
}

/** O recorte inteiro, página por página: somar só a página visível mentiria (AC-397). */
export async function totaisDoRecorte(filtros: Parametros): Promise<TotaisDoRecorte> {
  const operacoes: OperacaoDoExtrato[] = [];
  let pagina = 0;
  let totalDePaginas = 1;
  while (pagina < totalDePaginas && pagina < MAXIMO_DE_PAGINAS) {
    const resposta = await http.get<Pagina<OperacaoDoExtrato>>('/operacoes', { params: { ...filtros, page: pagina, size: POR_PAGINA } });
    operacoes.push(...resposta.content);
    totalDePaginas = resposta.totalPages;
    pagina += 1;
  }
  return { ...somarRecorte(operacoes), incompleto: totalDePaginas > MAXIMO_DE_PAGINAS };
}
