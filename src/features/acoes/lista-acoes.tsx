import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Pagina } from '@/core/api/pagina';
import { rotuloDoMercado } from '@/features/carteiras/carteiras.model';
import { EstadoVazio } from '@/shared/estado-vazio';
import { Monograma } from '@/shared/monograma';
import { ValorComHorario } from '@/shared/valor-com-horario';
import { Acao, normalizarTicker } from './acoes.model';
import { acoesService } from './acoes.service';

/**
 * O catálogo compartilhado (ADR-002): existe uma só PETR4 no sistema inteiro, e
 * uma ação cadastrada por qualquer investidor serve a todos. Por isso o título
 * é "Ações", nunca "Minhas ações".
 *
 * Sem selo de posse, ao contrário das corretoras: marcar o que o investidor tem
 * exigiria varrer as posições de todas as carteiras dele — custo despropor-
 * cional e fora do v1 (PRD-006).
 *
 * A tela lê a cotação que o servidor já tinha e não pede atualização nenhuma:
 * a fonte gratuita é compartilhada e quem decide gastá-la é o investidor
 * (ADR-005).
 */
export function ListaAcoes() {
  const navegar = useNavigate();
  const [pagina, setPagina] = useState<Pagina<Acao> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [tickerSemResultado, setTickerSemResultado] = useState<string | null>(null);

  const irPara = useCallback(async (numero: number) => {
    setCarregando(true);
    setTickerSemResultado(null);
    try {
      setPagina(await acoesService.listar(numero));
    } catch {
      // A falha já virou mensagem na fundação; a lista fica como estava.
    }
    setCarregando(false);
  }, []);

  useEffect(() => {
    void irPara(0);
  }, [irPara]);

  /**
   * Ticker que existe abre a ação; o que não existe vira estado vazio com o
   * convite de cadastrar. ACA-001 fica para quem abre um detalhe inexistente
   * pela URL — buscar e não achar não é erro.
   */
  const buscar = async (evento: FormEvent) => {
    evento.preventDefault();
    const ticker = normalizarTicker(termo);
    if (!ticker) return;
    setBuscando(true);
    setTickerSemResultado(null);
    const acao = await acoesService.porTicker(ticker);
    setBuscando(false);
    if (acao) navegar(`/acoes/${acao.ticker}`);
    else setTickerSemResultado(ticker);
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Ações</h1>
        <Botao asChild intencao="primaria">
          <Link to="/acoes/nova">
            <Plus aria-hidden="true" focusable="false" />
            Cadastrar ação
          </Link>
        </Botao>
      </header>

      <p data-catalogo-compartilhado className="m-0 max-w-(--largura-leitura) text-texto-fraco">
        Este catálogo é compartilhado entre todos os investidores: cada ticker existe uma vez só no sistema, e uma ação cadastrada por
        qualquer um serve a todos.
      </p>

      <form onSubmit={buscar} className="flex max-w-xl flex-wrap items-end gap-2">
        <Campo
          rotulo="Buscar por ticker"
          name="termo"
          autoComplete="off"
          autoCapitalize="characters"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          className="min-w-0 flex-[1_1_16rem]"
        />
        <Botao intencao="secundaria" type="submit" ocupado={buscando}>
          <Search aria-hidden="true" focusable="false" />
          Buscar
        </Botao>
      </form>

      {tickerSemResultado && (
        <div data-busca-vazia className="flex flex-wrap items-center gap-3 rounded-grande border border-dashed border-borda bg-superficie p-4">
          <p className="m-0 flex-[1_1_100%]">Nenhuma ação com o ticker {tickerSemResultado} está no catálogo.</p>
          <Botao asChild intencao="primaria">
            <Link data-cadastrar-buscado to={`/acoes/nova?${new URLSearchParams({ ticker: tickerSemResultado })}`}>
              Cadastrar este ticker
            </Link>
          </Botao>
          <Botao
            intencao="sutil"
            type="button"
            onClick={() => {
              setTermo('');
              setTickerSemResultado(null);
            }}
          >
            Limpar busca
          </Botao>
        </div>
      )}

      {carregando ? (
        <Esqueleto formato="tabela" />
      ) : (
        pagina &&
        (pagina.content.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma ação no catálogo"
            descricao="O catálogo ainda não tem nenhum ticker. Cadastre a primeira ação para começar."
            rotuloAcao="Cadastrar ação"
            aoAcionar={() => navegar('/acoes/nova')}
          />
        ) : (
          <>
            <ul className="m-0 grid list-none gap-2 p-0">
              {pagina.content.map((acao) => (
                <li
                  key={acao.id}
                  data-acao={acao.id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-1 rounded-grande border border-borda bg-superficie px-4 py-3 transition-colors duration-(--duracao-rapida) hover:bg-[color-mix(in_srgb,var(--cor-acento)_6%,var(--cor-superficie))] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_3.5rem_minmax(0,1.5fr)]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Monograma ticker={acao.ticker} />
                    <Link data-ticker to={`/acoes/${acao.ticker}`} className="font-semibold text-texto no-underline hover:underline">
                      {acao.ticker}
                    </Link>
                  </span>
                  <span data-empresa className="truncate text-apoio text-texto-fraco max-md:col-span-2 max-md:row-start-2">
                    {acao.nomeEmpresa}
                  </span>
                  <span data-mercado className="text-apoio text-texto-fraco max-md:hidden">
                    {rotuloDoMercado(acao.mercado)}
                  </span>
                  <span data-moeda className="font-numero text-rotulo text-texto-fraco max-md:hidden">
                    {acao.moeda}
                  </span>
                  <span className="justify-self-end text-right max-md:col-start-2 max-md:row-start-1 [&_[data-valor-com-horario]]:justify-end">
                    <ValorComHorario valor={acao.cotacaoAtual} moeda={acao.moeda} obtidoEm={acao.dataHoraCotacao} />
                  </span>
                </li>
              ))}
            </ul>

            {pagina.totalPages > 1 && (
              <Paginador
                pagina={pagina.number + 1}
                totalPaginas={pagina.totalPages}
                totalItens={pagina.totalElements}
                itensPorPagina={pagina.size}
                aoMudarPagina={(numero) => void irPara(numero - 1)}
              />
            )}
          </>
        ))
      )}
    </section>
  );
}
