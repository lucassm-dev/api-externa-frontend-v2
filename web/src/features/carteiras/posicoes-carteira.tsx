import { Link } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Selo, VarianteSelo } from '@/components/ui/selo';
import { Tabela } from '@/components/ui/tabela';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { Monograma } from '@/shared/monograma';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { Variacao } from '@/shared/variacao';
import { Posicao } from './carteiras.model';
import { posicoesEncerradas } from './posicoes-encerradas';
import { percentualNaoRealizado } from './rentabilidade';

const SECAO = 'grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-baixa max-sm:p-4';
const TITULO = 'm-0 text-medio font-semibold tracking-(--entrelinha-titulo)';

function varianteDoResultado(valor: number): VarianteSelo {
  if (valor > 0) return 'alta';
  if (valor < 0) return 'baixa';
  return 'estavel';
}

interface Props {
  posicoes: Posicao[];
  lucroPorTicker?: Record<string, number>;
  carregando?: boolean;
}

/**
 * As posições abertas e, logo abaixo, as encerradas — que o backend não
 * devolve: elas saem do cruzamento entre o resultado realizado por ticker e os
 * tickers que ainda têm posição. Sem essa seção, quem vendeu tudo de um ativo
 * conclui que o sistema perdeu o registro (PRD-005).
 */
export function PosicoesCarteira({ posicoes, lucroPorTicker = {}, carregando = false }: Props) {
  const encerradas = posicoesEncerradas(lucroPorTicker, posicoes);

  return (
    <>
      <section data-posicoes aria-labelledby="titulo-posicoes" className={SECAO}>
        <h2 id="titulo-posicoes" className={TITULO}>
          Posições abertas
        </h2>
        {carregando ? (
          <div data-carregando-posicoes>
            <Esqueleto formato="tabela" />
          </div>
        ) : posicoes.length === 0 ? (
          <div data-sem-posicao className="grid justify-items-start gap-3 rounded border border-dashed border-borda p-5">
            <p className="m-0 text-texto-fraco">Nenhuma posição aberta nesta carteira.</p>
            <Botao asChild intencao="secundaria" tamanho="compacto">
              <Link data-proximo-passo to="/operacoes?tipo=COMPRA">
                Registrar uma compra
              </Link>
            </Botao>
          </div>
        ) : (
          <Tabela aria-labelledby="titulo-posicoes">
            <thead>
              <tr>
                <th scope="col" className="w-full">Ativo</th>
                <th scope="col" data-numero>Quantidade</th>
                <th scope="col" data-numero>Preço médio</th>
                <th scope="col" data-numero>Cotação atual</th>
                <th scope="col" data-numero>Não realizado</th>
                <th scope="col" data-numero>Não realizado (%)</th>
              </tr>
            </thead>
            <tbody>
              {posicoes.map((posicao) => {
                const percentual = percentualNaoRealizado(posicao);
                return (
                  <tr key={posicao.id} data-posicao={posicao.ticker}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Monograma ticker={posicao.ticker} />
                        <span className="grid min-w-36">
                          <strong className="font-semibold">{posicao.ticker}</strong>
                          <span className="text-apoio text-texto-fraco">{posicao.nomeEmpresa}</span>
                        </span>
                      </span>
                    </td>
                    <td data-numero data-quantidade>{formatarNumero(posicao.quantidade, 0)}</td>
                    <td data-numero data-preco-medio>{formatarReal(posicao.precoMedio)}</td>
                    <td data-numero data-cotacao>
                      <ValorComHorario valor={posicao.cotacaoAtual} obtidoEm={posicao.dataHoraCotacao} />
                    </td>
                    <td data-numero data-rentabilidade-valor>
                      <Variacao valor={posicao.rentabilidadeNaoRealizada} moeda="BRL" />
                    </td>
                    {percentual === null ? (
                      <td data-numero data-sem-percentual>—</td>
                    ) : (
                      <td data-numero data-rentabilidade-percentual>
                        <Variacao valor={percentual} percentual />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </Tabela>
        )}
      </section>

      {encerradas.length > 0 && (
        <section data-encerradas aria-labelledby="titulo-encerradas" className={SECAO}>
          <div className="grid gap-1">
            <h2 id="titulo-encerradas" className={TITULO}>
              Encerradas
            </h2>
            <p className="m-0 text-apoio text-texto-fraco">Ativos que você zerou nesta carteira. A posição não existe mais — o resultado, sim.</p>
          </div>
          <Tabela aria-labelledby="titulo-encerradas">
            <thead>
              <tr>
                <th scope="col" className="w-full">Ativo</th>
                <th scope="col" data-numero>Resultado realizado</th>
              </tr>
            </thead>
            <tbody>
              {encerradas.map((encerrada) => (
                <tr key={encerrada.ticker} data-encerrada={encerrada.ticker}>
                  <td>
                    <span className="flex items-center gap-3">
                      <Monograma ticker={encerrada.ticker} />
                      <strong className="font-semibold">{encerrada.ticker}</strong>
                    </span>
                  </td>
                  <td data-numero data-resultado-realizado>
                    <Selo variante={varianteDoResultado(encerrada.resultadoRealizado)} texto={formatarReal(encerrada.resultadoRealizado)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Tabela>
        </section>
      )}
    </>
  );
}
