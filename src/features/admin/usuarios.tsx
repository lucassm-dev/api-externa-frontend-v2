import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Selecao } from '@/components/ui/selecao';
import { Selo } from '@/components/ui/selo';
import { Tabela } from '@/components/ui/tabela';
import { Pagina } from '@/core/api/pagina';
import { formatarNumero } from '@/core/formatacao/formatacao';
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

  useEffect(() => {
    adminService.totais(papel).then(setTotais, () => setTotais(null));
  }, [papel]);

  const filtrar = (campo: 'situacao' | 'papel', valor: string) =>
    setBusca((atual) => {
      const proxima = new URLSearchParams(atual);
      if (valor) proxima.set(campo, valor);
      else proxima.delete(campo);
      return proxima;
    });

  return (
    <section className="grid gap-5">
      <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Usuários</h1>

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
                </tr>
              </thead>
              <tbody>
                {pagina.content.map((usuario) => (
                  <tr key={usuario.id} data-usuario={usuario.id}>
                    <td className="max-w-64 truncate font-semibold">{usuario.email}</td>
                    <td className={usuario.nome ? undefined : 'text-texto-fraco'}>{usuario.nome ?? 'Sem nome'}</td>
                    <td>{ROTULO_DO_PAPEL[usuario.papel]}</td>
                    <td>
                      <Selo variante={usuario.situacao === 'ATIVO' ? 'sucesso' : 'erro'} texto={ROTULO_DA_SITUACAO[usuario.situacao]} />
                    </td>
                    <td data-numero data-carteiras-ativas>
                      {formatarNumero(usuario.carteirasAtivas, 0)}
                    </td>
                    <td data-posicao-aberta>{usuario.temPosicaoAberta ? 'Sim' : 'Não'}</td>
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
    </section>
  );
}
