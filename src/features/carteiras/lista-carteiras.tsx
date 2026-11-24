import { ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { BotaoIcone } from '@/components/ui/botao-icone';
import { Campo } from '@/components/ui/campo';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Pagina } from '@/core/api/pagina';
import { ErroTraduzido, ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarReal } from '@/core/formatacao/formatacao';
import { EstadoVazio } from '@/shared/estado-vazio';
import { Variacao } from '@/shared/variacao';
import { Carteira, rotuloDoMercado } from './carteiras.model';
import { NumerosDaCarteira, carteirasService } from './carteiras.service';

const NUMERO = 'grid gap-0.5';
const ROTULO = 'text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';

/**
 * Só as carteiras do investidor logado existem aqui — o backend já garante
 * isso, e a tela não sugere o contrário: sem busca por investidor, sem menção
 * a catálogo compartilhado (isso é das corretoras, ADR-002).
 *
 * A listagem não devolve valor nem resultado: os números vêm por carteira,
 * cada leitura independente. O que falhar some da linha; a lista continua
 * inteira e sem alarme (ADR-006, Q-013).
 */
export function ListaCarteiras() {
  const navegar = useNavigate();
  const [pagina, setPagina] = useState<Pagina<Carteira> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [numeros, setNumeros] = useState<Map<number, NumerosDaCarteira>>(new Map());
  const [renomeando, setRenomeando] = useState<Carteira | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');
  const [salvandoNome, setSalvandoNome] = useState(false);
  const [excluindo, setExcluindo] = useState<Carteira | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erro, setErro] = useState<{ texto: string; codigo: string | null } | null>(null);

  const irPara = useCallback(async (numero: number) => {
    setCarregando(true);
    try {
      const resposta = await carteirasService.listar(numero);
      // A última página esvaziou (o único item foi excluído): volta uma página (AC-307).
      if (resposta.content.length === 0 && resposta.number > 0) {
        await irPara(resposta.number - 1);
        return;
      }
      setPagina(resposta);
      setCarregando(false);
      setNumeros(new Map());
      for (const carteira of resposta.content) {
        void carteirasService.numerosDaCarteira(carteira.id).then((lidos) => setNumeros((atual) => new Map(atual).set(carteira.id, lidos)));
      }
    } catch {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void irPara(0);
  }, [irPara]);

  const mostrarErro = (falha: unknown) => {
    if (!ehErroTraduzido(falha)) throw falha;
    setErro({ texto: (falha as ErroTraduzido).mensagem, codigo: falha.codigo });
  };

  const confirmarRenomeacao = async () => {
    const nome = nomeEditado.trim();
    if (!renomeando || !nome || salvandoNome) return;
    setSalvandoNome(true);
    try {
      const atualizada = await carteirasService.renomear(renomeando.id, nome);
      setPagina((atual) => (atual ? { ...atual, content: atual.content.map((c) => (c.id === atualizada.id ? atualizada : c)) } : atual));
    } catch (falha) {
      mostrarErro(falha);
    } finally {
      setSalvandoNome(false);
      setRenomeando(null);
    }
  };

  /**
   * Para o investidor, excluir é sumir da lista: sem lixeira, sem desfazer
   * (ADR-007). CAR-002 cancela a exclusão com a mensagem que diz o que fazer.
   */
  const confirmarExclusao = async () => {
    if (!excluindo || removendo) return;
    setRemovendo(true);
    try {
      await carteirasService.excluir(excluindo.id);
      setRemovendo(false);
      setExcluindo(null);
      await irPara(pagina?.number ?? 0);
    } catch (falha) {
      setRemovendo(false);
      setExcluindo(null);
      mostrarErro(falha);
    }
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Minhas carteiras</h1>
          <p className="m-0 mt-1 text-texto-fraco">Cada carteira reúne suas posições, seus resultados e suas movimentações.</p>
        </div>
        <Botao asChild intencao="primaria">
          <Link data-nova to="/carteiras/nova">
            <Plus aria-hidden="true" focusable="false" />
            Criar carteira
          </Link>
        </Botao>
      </header>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro.texto} codigo={erro.codigo} />}

      {carregando ? (
        <Esqueleto formato="tabela" />
      ) : (
        pagina &&
        (pagina.content.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma carteira ainda"
            descricao="Crie a primeira carteira para começar a registrar operações e acompanhar resultados."
            rotuloAcao="Criar carteira"
            aoAcionar={() => navegar('/carteiras/nova')}
          />
        ) : (
          <>
            <ul className="m-0 grid list-none gap-3 p-0">
              {pagina.content.map((carteira) => {
                const lidos = numeros.get(carteira.id);
                return (
                  <li
                    key={carteira.id}
                    data-carteira={carteira.id}
                    className="grid items-center gap-4 rounded-grande border border-borda bg-superficie p-4 shadow-baixa transition-colors duration-(--duracao-rapida) hover:bg-[color-mix(in_srgb,var(--cor-acento)_6%,var(--cor-superficie))] md:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)_auto]"
                  >
                    <div className="min-w-0">
                      {renomeando?.id === carteira.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Campo
                            rotulo="Novo nome da carteira"
                            rotuloVisivel={false}
                            data-campo-nome
                            value={nomeEditado}
                            onChange={(evento) => setNomeEditado(evento.target.value)}
                            className="min-w-0 flex-[1_1_12rem]"
                            autoFocus
                          />
                          <Botao intencao="primaria" tamanho="compacto" type="button" data-salvar-nome ocupado={salvandoNome} onClick={() => void confirmarRenomeacao()}>
                            Salvar
                          </Botao>
                          <Botao intencao="sutil" tamanho="compacto" type="button" data-cancelar-nome onClick={() => setRenomeando(null)}>
                            Cancelar
                          </Botao>
                        </div>
                      ) : (
                        <h2 className="m-0 truncate text-medio font-semibold">{carteira.nome}</h2>
                      )}
                      <p className="m-0 mt-0.5 text-apoio text-texto-fraco">
                        {carteira.nomeCorretora} · {rotuloDoMercado(carteira.mercado)}
                      </p>
                    </div>

                    <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-3">
                      {lidos?.consolidado && (
                        <>
                          <div className={NUMERO}>
                            <dt className={ROTULO}>Valor de mercado</dt>
                            <dd data-valor-de-mercado className="m-0 font-numero font-semibold">
                              {formatarReal(lidos.consolidado.valorDeMercado)}
                            </dd>
                          </div>
                          <div className={NUMERO}>
                            <dt className={ROTULO}>Não realizado</dt>
                            <dd data-nao-realizado className="m-0 font-semibold">
                              <Variacao valor={lidos.consolidado.lucroNaoRealizado} moeda="BRL" />
                            </dd>
                          </div>
                        </>
                      )}
                      {lidos?.lucroRealizado && (
                        <div className={NUMERO}>
                          <dt className={ROTULO}>Realizado</dt>
                          <dd data-realizado className="m-0 font-semibold">
                            <Variacao valor={lidos.lucroRealizado.total} moeda="BRL" />
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="flex items-center gap-2 justify-self-end">
                      <Botao asChild intencao="secundaria" tamanho="compacto" className="min-w-8 px-0 max-md:min-w-11">
                        <Link data-abrir to={`/carteiras/${carteira.id}`} aria-label={`Abrir carteira ${carteira.nome}`} title={`Abrir carteira ${carteira.nome}`}>
                          <ArrowUpRight aria-hidden="true" focusable="false" />
                        </Link>
                      </Botao>
                      <span data-renomear className="contents">
                        <BotaoIcone
                          rotulo={`Renomear carteira ${carteira.nome}`}
                          aoPressionar={() => {
                            setErro(null);
                            setNomeEditado(carteira.nome);
                            setRenomeando(carteira);
                          }}
                        >
                          <Pencil aria-hidden="true" focusable="false" />
                        </BotaoIcone>
                      </span>
                      <span data-excluir className="contents">
                        <BotaoIcone
                          rotulo={`Excluir carteira ${carteira.nome}`}
                          aoPressionar={() => {
                            setErro(null);
                            setExcluindo(carteira);
                          }}
                        >
                          <Trash2 aria-hidden="true" focusable="false" />
                        </BotaoIcone>
                      </span>
                    </div>
                  </li>
                );
              })}
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

      {excluindo && (
        <DialogoConfirmacao
          titulo="Excluir esta carteira?"
          consequencia={`${excluindo.nome} sai da sua lista com as movimentações e os resultados dela. Não há como desfazer.`}
          rotuloConfirmar="Excluir"
          ocupado={removendo}
          aoConfirmar={() => void confirmarExclusao()}
          aoCancelar={() => setExcluindo(null)}
        />
      )}
    </section>
  );
}
