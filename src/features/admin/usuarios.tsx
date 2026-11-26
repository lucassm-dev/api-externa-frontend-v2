import { useCallback, useEffect, useState } from 'react';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { Plus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Selecao } from '@/components/ui/selecao';
import { Selo } from '@/components/ui/selo';
import { Tabela } from '@/components/ui/tabela';
import { Pagina } from '@/core/api/pagina';
import { ehErroTraduzido } from '@/core/erros/tradutor-erro';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { formatarNumero } from '@/core/formatacao/formatacao';
import { sessao } from '@/core/sessao/sessao.service';
import { EstadoVazio } from '@/shared/estado-vazio';
import { ROTULO_DA_SITUACAO, ROTULO_DO_PAPEL, TotaisPorSituacao, UsuarioAdmin } from './admin.model';
import { adminService } from './admin.service';

/**
 * Os usuários de todos os papéis, como o servidor os devolve. Situação e papel
 * moram na busca do endereço; a página, não: trocar o filtro volta à primeira.
 */
export function Usuarios() {
  const [busca, setBusca] = useSearchParams();
  const situacao = busca.get('situacao') ?? '';
  const papel = busca.get('papel') ?? '';

  const [pagina, setPagina] = useState<Pagina<UsuarioAdmin> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [totais, setTotais] = useState<TotaisPorSituacao | null>(null);
  const [emBloqueio, setEmBloqueio] = useState<UsuarioAdmin | null>(null);
  const [motivo, setMotivo] = useState('');
  const [problemaDoBloqueio, setProblemaDoBloqueio] = useState<{ campo: boolean; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  // A própria linha não oferece bloquear (AC-357, ASM-089).
  const meuEmail = sessao.email();

  const ler = useCallback(
    async (numero: number) => {
      setCarregando(true);
      try {
        setPagina(await adminService.usuarios(numero, { ...(situacao && { situacao }), ...(papel && { papel }) }));
      } catch {
        // A lista que não veio fica como estava.
      }
      setCarregando(false);
    },
    [situacao, papel],
  );

  useEffect(() => {
    void ler(0);
  }, [ler]);

  const lerTotais = useCallback(() => adminService.totais(papel).then(setTotais, () => setTotais(null)), [papel]);

  useEffect(() => {
    void lerTotais();
  }, [lerTotais]);

  const releitura = () => {
    void ler(pagina?.number ?? 0);
    void lerTotais();
  };

  const abrirBloqueio = (usuario: UsuarioAdmin) => {
    setMotivo('');
    setProblemaDoBloqueio(null);
    setEmBloqueio(usuario);
  };

  const bloquear = async () => {
    if (!emBloqueio || ocupado) return;
    const texto = motivo.trim();
    if (!texto) {
      setProblemaDoBloqueio({ campo: true, texto: 'Informe o motivo do bloqueio' });
      return;
    }
    setOcupado(true);
    try {
      await adminService.bloquear(emBloqueio.id, texto);
      setEmBloqueio(null);
      releitura();
    } catch (falha) {
      if (!ehErroTraduzido(falha)) throw falha;
      setProblemaDoBloqueio({ campo: false, texto: falha.mensagem });
    }
    setOcupado(false);
  };

  const desbloquear = async (usuario: UsuarioAdmin) => {
    setErro(null);
    try {
      await adminService.desbloquear(usuario.id);
      releitura();
    } catch (falha) {
      if (!ehErroTraduzido(falha)) throw falha;
      setErro(falha.mensagem);
    }
  };

  const filtrar = (campo: 'situacao' | 'papel', valor: string) =>
    setBusca((atual) => {
      const proxima = new URLSearchParams(atual);
      if (valor) proxima.set(campo, valor);
      else proxima.delete(campo);
      return proxima;
    });

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Usuários</h1>
        <Botao asChild intencao="primaria">
          <Link to="/admin/usuarios/novo">
            <Plus aria-hidden="true" focusable="false" />
            Novo administrador
          </Link>
        </Botao>
      </header>

      {erro && <MensagemFeedback nivel="erro" mensagem={erro} />}

      {totais && (
        <dl aria-label="Totais por situação" className="m-0 flex flex-wrap gap-3">
          {(['ATIVO', 'BLOQUEADO'] as const).map((chave) => (
            <div key={chave} data-total={chave} className="min-w-40 rounded-grande border border-borda bg-superficie px-4 py-3 shadow-cartao">
              <dt className="text-rotulo font-medium text-texto-fraco">{chave === 'ATIVO' ? 'Ativos' : 'Bloqueados'}</dt>
              <dd className="m-0 text-titulo font-bold tabular-nums">{formatarNumero(totais[chave], 0)}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Selecao rotulo="Situação" name="situacao" value={situacao} onChange={(evento) => filtrar('situacao', evento.target.value)}>
          <option value="">Todas</option>
          <option value="ATIVO">Ativos</option>
          <option value="BLOQUEADO">Bloqueados</option>
        </Selecao>
        <Selecao rotulo="Papel" name="papel" value={papel} onChange={(evento) => filtrar('papel', evento.target.value)}>
          <option value="">Todos</option>
          <option value="INVESTIDOR">Investidores</option>
          <option value="ADMIN">Administradores</option>
        </Selecao>
      </div>

      {carregando && !pagina ? (
        <Esqueleto formato="tabela" />
      ) : (
        pagina &&
        (pagina.content.length === 0 ? (
          <EstadoVazio titulo="Nenhum usuário neste recorte" descricao="Mude a situação ou o papel para ver outros usuários." />
        ) : (
          <>
            <Tabela aria-label="Usuários" aria-busy={carregando || undefined}>
              <thead>
                <tr>
                  <th scope="col">E-mail</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Papel</th>
                  <th scope="col">Situação</th>
                  <th scope="col" data-numero>
                    Carteiras ativas
                  </th>
                  <th scope="col">Posição aberta</th>
                  <th scope="col">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagina.content.map((usuario) => (
                  <tr key={usuario.id} data-usuario={usuario.id}>
                    <td className="max-w-64 truncate font-semibold">{usuario.email}</td>
                    {/* w-full: a célula estica a tabela até a largura da coluna, como o ticker no extrato. */}
                    <td className={usuario.nome ? 'w-full' : 'w-full text-texto-fraco'}>{usuario.nome ?? 'Sem nome'}</td>
                    <td>{ROTULO_DO_PAPEL[usuario.papel]}</td>
                    <td>
                      <Selo variante={usuario.situacao === 'ATIVO' ? 'sucesso' : 'erro'} texto={ROTULO_DA_SITUACAO[usuario.situacao]} />
                      {usuario.situacao === 'BLOQUEADO' && usuario.motivoBloqueio && (
                        <span data-motivo-bloqueio className="mt-1 block max-w-56 text-rotulo text-texto-fraco">
                          {usuario.motivoBloqueio}
                        </span>
                      )}
                    </td>
                    <td data-numero data-carteiras-ativas>
                      {formatarNumero(usuario.carteirasAtivas, 0)}
                    </td>
                    <td data-posicao-aberta>{usuario.temPosicaoAberta ? 'Sim' : 'Não'}</td>
                    <td className="text-right">
                      {usuario.situacao === 'BLOQUEADO' ? (
                        <Botao intencao="secundaria" tamanho="compacto" type="button" onClick={() => void desbloquear(usuario)}>
                          Desbloquear
                        </Botao>
                      ) : (
                        usuario.email !== meuEmail && (
                          <Botao intencao="secundaria" tamanho="compacto" type="button" onClick={() => abrirBloqueio(usuario)}>
                            Bloquear
                          </Botao>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Tabela>

            {pagina.totalPages > 1 && (
              <Paginador
                pagina={pagina.number + 1}
                totalPaginas={pagina.totalPages}
                totalItens={pagina.totalElements}
                itensPorPagina={pagina.size}
                aoMudarPagina={(numero) => void ler(numero - 1)}
              />
            )}
          </>
        ))
      )}

      {emBloqueio && (
        <DialogoConfirmacao
          titulo={`Bloquear ${emBloqueio.email}?`}
          consequencia="A pessoa deixa de entrar e as sessões abertas dela param de valer. Dá para desbloquear depois."
          rotuloConfirmar="Bloquear"
          ocupado={ocupado}
          aoConfirmar={() => void bloquear()}
          aoCancelar={() => setEmBloqueio(null)}
        >
          {problemaDoBloqueio && !problemaDoBloqueio.campo && <MensagemFeedback nivel="erro" mensagem={problemaDoBloqueio.texto} />}
          <Campo
            rotulo="Motivo"
            name="motivo"
            autoComplete="off"
            value={motivo}
            onChange={(evento) => {
              setMotivo(evento.target.value);
              setProblemaDoBloqueio(null);
            }}
            erro={problemaDoBloqueio?.campo ? problemaDoBloqueio.texto : null}
          />
        </DialogoConfirmacao>
      )}
    </section>
  );
}
