import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selecao } from '@/components/ui/selecao';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { carteiraPreferida } from '@/features/painel/carteira-preferida';
import { ConfissoesDesempenho } from './blocos/confissoes-desempenho';
import { GraficoComposicao } from './blocos/grafico-composicao';
import { GraficoConcentracao } from './blocos/grafico-concentracao';
import { GraficoContribuicao } from './blocos/grafico-contribuicao';
import { GraficoInvestidoMercado } from './blocos/grafico-investido-mercado';
import { GraficoMapaPosicoes } from './blocos/grafico-mapa-posicoes';
import { GraficoQuadrante } from './blocos/grafico-quadrante';
import { GraficoRealizado } from './blocos/grafico-realizado';
import { NumerosDesempenho } from './blocos/numeros-desempenho';
import { composicaoDaCarteira } from './composicao';
import { contribuicaoPorAtivo } from './contribuicao';
import { DadosDaCarteira } from './desempenho.model';
import { desempenhoService } from './desempenho.service';
import { idadeDasCotacoes } from './idade-das-cotacoes';
import { moedaDe, paraReal } from './moeda-das-posicoes';
import { houveVenda, realizadoPorTicker } from './realizado-por-ticker';
import { resultadosDaCarteira } from './resultados';

const INDISPONIVEL = 'm-0 rounded-grande border border-borda bg-superficie p-4 text-texto-fraco';
const CONVITE = 'grid justify-items-start gap-2 rounded-grande border border-borda bg-superficie p-6 max-sm:p-5';

/**
 * Cada posição em real, com custo, valor de hoje e resultado lado a lado. É a
 * base dos quatro blocos novos, e a conversão vem ANTES de qualquer
 * comparação: custo em real ao lado de valor em dólar produz diferença
 * inventada, e o erro é silencioso.
 */
function posicoesEmReal(dados: DadosDaCarteira | null) {
  const taxa = dados?.consolidado?.taxaCambioAtual;
  if (!dados || dados.posicoes === null || taxa === undefined) return [];

  return dados.posicoes
    .map((posicao) => {
      const moeda = moedaDe(posicao.ticker, dados.moedas);
      const valorDeMercado = paraReal(posicao.quantidade * posicao.cotacaoAtual, moeda, taxa).valor;
      const investido = paraReal(posicao.quantidade * posicao.precoMedio, moeda, taxa).valor;
      const resultado = paraReal(posicao.rentabilidadeNaoRealizada, moeda, taxa).valor;
      return {
        ticker: posicao.ticker,
        nomeEmpresa: posicao.nomeEmpresa,
        valorDeMercado,
        investido,
        valorMercado: valorDeMercado,
        resultado,
        // Sobre o custo, não sobre o valor de hoje: é o custo que o investidor
        // arriscou, e é dele que a rentabilidade fala.
        rentabilidade: investido > 0 ? (resultado / investido) * 100 : 0,
      };
    })
    .filter((posicao) => posicao.valorDeMercado > 0)
    .sort((uma, outra) => outra.valorDeMercado - uma.valorDeMercado);
}

/**
 * O retrato de uma carteira agora: uma carteira por vez, porque o backend
 * consolida por carteira e somar no frontend produziria número que não bate
 * com nenhuma outra tela. Sem série histórica (ADR-010).
 */
export function Desempenho() {
  const [carteiras, setCarteiras] = useState<Carteira[] | null>(null);
  const [carteiraSelecionada, setCarteiraSelecionada] = useState<number | null>(null);
  const [dados, setDados] = useState<DadosDaCarteira | null>(null);
  const [carregandoCarteiras, setCarregandoCarteiras] = useState(true);
  const [carregandoDados, setCarregandoDados] = useState(false);

  /** A última carteira pedida: a leitura atrasada de outra carteira é descartada (AC-309). */
  const carteiraPedida = useRef<number | null>(null);

  const carregar = async (carteiraId: number) => {
    carteiraPedida.current = carteiraId;
    setCarregandoDados(true);
    setDados(null);
    const lidos = await desempenhoService.dadosDaCarteira(carteiraId);
    if (carteiraPedida.current !== carteiraId) return;
    setDados(lidos);
    setCarregandoDados(false);
  };

  useEffect(() => {
    desempenhoService
      .carteiras()
      .catch(() => null)
      .then((lidas) => {
        setCarregandoCarteiras(false);
        setCarteiras(lidas);
        const escolhida = lidas ? carteiraPreferida.escolherEntre(lidas) : null;
        if (escolhida) {
          setCarteiraSelecionada(escolhida.id);
          void carregar(escolhida.id);
        }
      });
  }, []);

  const escolher = (valor: string) => {
    const id = Number(valor);
    if (!Number.isInteger(id) || id === carteiraSelecionada) return;
    carteiraPreferida.lembrar(id);
    setCarteiraSelecionada(id);
    void carregar(id);
  };

  const semCarteira = !carregandoCarteiras && carteiras?.length === 0;

  /**
   * Sem posição aberta e sem venda apurada não há nada para desenhar. Leitura
   * que falhou não conta como carteira vazia: `null` é desconhecido, não zero.
   */
  const semOperacao = !!dados && dados.posicoes !== null && dados.lucroRealizado !== null && dados.posicoes.length === 0 && !houveVenda(dados.lucroRealizado);

  const derivados = useMemo(() => {
    const consolidado = dados?.consolidado ?? null;
    const comPosicoes = !!consolidado && dados?.posicoes != null;
    return {
      consolidado,
      resultados: consolidado ? resultadosDaCarteira(consolidado, dados!.lucroRealizado) : null,
      composicao: comPosicoes ? composicaoDaCarteira(dados!.posicoes!, dados!.moedas, consolidado!) : null,
      contribuicao: comPosicoes ? contribuicaoPorAtivo(dados!.posicoes!, dados!.moedas, consolidado!.taxaCambioAtual) : null,
      realizado: dados?.lucroRealizado ? realizadoPorTicker(dados.lucroRealizado) : null,
      emReal: posicoesEmReal(dados),
      idade: idadeDasCotacoes(dados?.posicoes ?? []),
    };
  }, [dados]);

  const { consolidado, resultados, composicao, contribuicao, realizado, emReal, idade } = derivados;

  return (
    <section className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Desempenho</h1>
          <p className="m-0 max-w-[60ch] text-texto-fraco">
            O retrato de uma carteira agora — quanto você investiu, quanto vale hoje e quem está puxando o resultado.
          </p>
        </div>

        {carteiras && carteiras.length > 0 && (
          <Selecao
            empilhado
            rotulo="Carteira"
            data-seletor-carteira
            value={carteiraSelecionada ?? ''}
            onChange={(evento) => escolher(evento.target.value)}
            className="min-w-56 max-sm:w-full"
          >
            {carteiras.map((carteira) => (
              <option key={carteira.id} value={carteira.id}>
                {carteira.nome}
              </option>
            ))}
          </Selecao>
        )}
      </header>

      {carregandoCarteiras || carregandoDados ? (
        <div data-esqueleto-desempenho aria-hidden="true" className="grid gap-5">
          <Esqueleto formato="tabela" />
        </div>
      ) : semCarteira ? (
        <div data-convite-carteira className={CONVITE}>
          <h2 className="m-0 text-medio font-semibold">Crie sua primeira carteira</h2>
          <p className="m-0 text-texto-fraco">O desempenho começa a existir quando há uma carteira com operações registradas.</p>
          <Botao asChild intencao="primaria" className="mt-2">
            <Link to="/carteiras/nova">Criar carteira</Link>
          </Botao>
        </div>
      ) : semOperacao ? (
        <div data-convite-primeira-compra className={CONVITE}>
          <h2 className="m-0 text-medio font-semibold">Registre sua primeira compra</h2>
          <p className="m-0 max-w-[65ch] text-texto-fraco">
            Esta carteira ainda não tem posição nem venda apurada. Assim que houver uma compra registrada, os números e os gráficos aparecem aqui.
          </p>
          <Botao asChild intencao="primaria" className="mt-2">
            <Link to={`/operacoes?carteira=${carteiraSelecionada}&tipo=COMPRA`}>Registrar compra</Link>
          </Botao>
        </div>
      ) : (
        dados && (
          <>
            {resultados ? (
              <NumerosDesempenho resultados={resultados} />
            ) : (
              <p data-consolidado-indisponivel className={INDISPONIVEL}>
                Não foi possível ler os totais desta carteira agora.
              </p>
            )}

            <ConfissoesDesempenho
              idade={idade}
              avisosDoConsolidado={consolidado?.avisos ?? []}
              taxaCambio={consolidado?.taxaCambioAtual ?? null}
              dataHoraTaxaCambio={consolidado?.dataHoraTaxaCambio ?? null}
            />

            {/* O retrato abre a tela: o mapa mostra a carteira inteira de uma vez, e o
                medidor ao lado responde "concentrado demais?" sem exigir contagem de fatia. */}
            {emReal.length > 0 && (
              <div data-retrato className="grid grid-cols-1 items-start gap-5 min-[72rem]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] [&>*]:min-w-0">
                <GraficoMapaPosicoes posicoes={emReal} />
                <GraficoConcentracao posicoes={emReal} />
              </div>
            )}

            {/* Cada gráfico tem conteúdo intrínseco largo (SVG, legenda): sem piso zero
                na coluna e no item, ele empurra a largura e estoura a 360px (AC-273). */}
            <div
              data-graficos
              className="grid grid-cols-1 gap-5 min-[72rem]:grid-cols-2 [&>*]:min-w-0 min-[72rem]:[&>[data-grafico-composicao]]:col-span-full"
            >
              {composicao && <GraficoComposicao composicao={composicao} />}
              {emReal.length > 0 && (
                <>
                  <GraficoInvestidoMercado posicoes={emReal} />
                  <GraficoQuadrante posicoes={emReal} />
                </>
              )}
              {contribuicao && <GraficoContribuicao barras={contribuicao} />}
              {realizado ? (
                <GraficoRealizado barras={realizado} total={dados.lucroRealizado?.total ?? 0} />
              ) : (
                <p data-realizado-indisponivel className={INDISPONIVEL}>
                  Não foi possível ler o resultado já apurado nas vendas.
                </p>
              )}
            </div>
          </>
        )
      )}
    </section>
  );
}
