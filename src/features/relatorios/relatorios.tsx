import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Esqueleto } from '@/components/ui/esqueleto';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarNumero, formatarReal } from '@/core/formatacao/formatacao';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { carteirasService } from '@/features/carteiras/carteiras.service';
import { ExtratoOperacoes } from '@/features/operacoes/extrato-operacoes';
import { CAMPOS_DO_FILTRO, Filtros, FiltrosExtrato, RecusaDoFiltro, filtrosDaBusca, parametrosDoServidor, temFiltro } from '@/features/operacoes/filtros-extrato';
import { OperacaoDoExtrato } from '@/features/operacoes/operacoes.model';
import { operacoesService } from '@/features/operacoes/operacoes.service';
import { Variacao } from '@/shared/variacao';
import { TotaisDoRecorte, totaisDoRecorte } from './totais-do-recorte';

const BLOCO = 'grid content-start gap-1 rounded-grande border border-borda bg-superficie px-4 py-3 shadow-cartao';
const ROTULO = 'm-0 text-rotulo font-medium text-texto-fraco';
const VALOR = 'm-0 font-numero text-grande font-bold tabular-nums';

const contagem = (n: number, singular: string, plural: string) => `${formatarNumero(n, 0)} ${n === 1 ? singular : plural}`;

function BlocosDeTotais({ totais }: { totais: TotaisDoRecorte }) {
  return (
    <div className="grid gap-2">
      <dl data-totais-recorte className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div data-total-recorte="compras" className={BLOCO}>
          <dt className={ROTULO}>Comprado</dt>
          <dd className={VALOR}>{formatarReal(totais.volumeComprado)}</dd>
          <dd className="m-0 text-apoio text-texto-fraco">{contagem(totais.compras, 'compra', 'compras')}</dd>
        </div>
        <div data-total-recorte="vendas" className={BLOCO}>
          <dt className={ROTULO}>Vendido</dt>
          <dd className={VALOR}>{formatarReal(totais.volumeVendido)}</dd>
          <dd className="m-0 text-apoio text-texto-fraco">{contagem(totais.vendas, 'venda', 'vendas')}</dd>
        </div>
        <div data-total-recorte="lucro" className={BLOCO}>
          <dt className={ROTULO}>Lucro realizado</dt>
          <dd className={VALOR}>
            <Variacao valor={totais.lucro} moeda="BRL" />
          </dd>
          <dd className="m-0 text-apoio text-texto-fraco">Soma das vendas com ganho</dd>
        </div>
        <div data-total-recorte="prejuizo" className={BLOCO}>
          <dt className={ROTULO}>Prejuízo realizado</dt>
          <dd className={VALOR}>
            <Variacao valor={-totais.prejuizo} moeda="BRL" />
          </dd>
          <dd className="m-0 text-apoio text-texto-fraco">Soma das vendas com perda</dd>
        </div>
      </dl>
      <p className="m-0 text-rotulo text-texto-fraco">
        Totais do recorte inteiro, em real: cada operação entra convertida pela taxa de câmbio do dia dela.
      </p>
      {totais.semTaxa > 0 && (
        <MensagemFeedback
          nivel="aviso"
          mensagem={`${contagem(totais.semTaxa, 'operação em dólar ficou', 'operações em dólar ficaram')} fora dos totais por não trazer a taxa de câmbio.`}
        />
      )}
      {totais.incompleto && <MensagemFeedback nivel="aviso" mensagem="O recorte é grande demais para somar inteiro. Estreite o período para ver os totais completos." />}
    </div>
  );
}

/**
 * O relatório do investidor (ADR-018 do backend): os filtros moram no endereço,
 * os totais somam o recorte inteiro e a tabela é só leitura (AC-394 a AC-399).
 */
export function Relatorios() {
  const [busca, setBusca] = useSearchParams();
  const chaveDoRecorte = JSON.stringify(filtrosDaBusca(busca));
  const filtros = useMemo<Filtros>(() => JSON.parse(chaveDoRecorte), [chaveDoRecorte]);

  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [operacoes, setOperacoes] = useState<OperacaoDoExtrato[]>([]);
  const [pagina, setPagina] = useState(0);
  const [totalDePaginas, setTotalDePaginas] = useState(0);
  const [totalDeItens, setTotalDeItens] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [recusa, setRecusa] = useState<RecusaDoFiltro | null>(null);
  const [totais, setTotais] = useState<TotaisDoRecorte | null>(null);
  const [falhaNosTotais, setFalhaNosTotais] = useState(false);

  useEffect(() => {
    carteirasService.listar(0).then(
      (resposta) => setCarteiras(resposta.content),
      () => setCarteiras([]),
    );
  }, []);

  const ler = useCallback(
    async (numero: number) => {
      setCarregando(true);
      setRecusa(null);
      try {
        const resposta = await operacoesService.extrato(numero, parametrosDoServidor(filtros));
        setOperacoes(resposta.content);
        setPagina(resposta.number);
        setTotalDePaginas(resposta.totalPages);
        setTotalDeItens(resposta.totalElements);
      } catch (falha) {
        // Filtro recusado (OPE-006, VAL-002) é dito nos filtros; o resto deixa a tabela como estava.
        if (ehErroTraduzido(falha) && (falha.codigo === 'OPE-006' || falha.codigo === 'VAL-002')) {
          setRecusa({ mensagem: falha.mensagem, campo: falha.campoDestacado ?? null });
        }
      }
      setCarregando(false);
    },
    [filtros],
  );

  useEffect(() => {
    void ler(0);
    setTotais(null);
    setFalhaNosTotais(false);
    totaisDoRecorte(parametrosDoServidor(filtros)).then(setTotais, () => setFalhaNosTotais(true));
  }, [ler, filtros]);

  const aplicar = (novos: Filtros) =>
    setBusca((atual) => {
      const proxima = new URLSearchParams(atual);
      for (const campo of CAMPOS_DO_FILTRO) {
        if (novos[campo]) proxima.set(campo, novos[campo]);
        else proxima.delete(campo);
      }
      return proxima;
    });

  return (
    <section className="grid gap-5">
      <header className="grid gap-1">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Relatórios</h1>
        <p className="m-0 max-w-(--largura-leitura) text-texto-fraco">
          Recorte as suas movimentações por período, ação, carteira, tipo e resultado, e veja quanto foi comprado, vendido e realizado no
          recorte inteiro.
        </p>
      </header>

      <FiltrosExtrato key={chaveDoRecorte} filtros={filtros} carteiras={carteiras} recusa={recusa} aoAplicar={aplicar} />

      {falhaNosTotais ? (
        <MensagemFeedback nivel="aviso" mensagem="Não foi possível somar o recorte agora. A tabela abaixo continua valendo." />
      ) : totais ? (
        <BlocosDeTotais totais={totais} />
      ) : (
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((indice) => (
            <Esqueleto key={indice} formato="bloco" />
          ))}
        </div>
      )}

      <ExtratoOperacoes
        titulo="Movimentações do recorte"
        recorte={temFiltro(filtros) ? { aoLimpar: () => aplicar(filtrosDaBusca(new URLSearchParams())) } : null}
        operacoes={operacoes}
        carteiras={carteiras}
        pagina={pagina}
        totalDePaginas={totalDePaginas}
        totalDeItens={totalDeItens}
        carregando={carregando}
        aoMudarPagina={(numero) => void ler(numero)}
      />
    </section>
  );
}
