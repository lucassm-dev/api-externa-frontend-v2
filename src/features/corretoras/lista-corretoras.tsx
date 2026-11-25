import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Esqueleto } from '@/components/ui/esqueleto';
import { Paginador } from '@/components/ui/paginador';
import { Selo } from '@/components/ui/selo';
import { Pagina } from '@/core/api/pagina';
import { sessao } from '@/core/sessao/sessao.service';
import { EstadoVazio } from '@/shared/estado-vazio';
import { formatarCnpj, somenteDigitos } from './cnpj';
import { Corretora, cidadeComUf, nomeExibido } from './corretoras.model';
import { corretorasService } from './corretoras.service';
import { rotuloDoSelo } from './selo-de-uso';

/**
 * O catálogo compartilhado (ADR-002): o investidor vê o que qualquer um
 * cadastrou. O selo de uso é a única coisa pessoal aqui — informativo, some
 * quando a contagem falha e nunca mexe na ordem que o servidor devolveu.
 */
export function ListaCorretoras() {
  const navegar = useNavigate();
  const [pagina, setPagina] = useState<Pagina<Corretora> | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [selos, setSelos] = useState<Map<number, number>>(new Map());
  const [termo, setTermo] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [cnpjSemResultado, setCnpjSemResultado] = useState<string | null>(null);
  // Cadastrar é do ADMIN (AC-317); o selo conta carteiras, que o ADMIN não tem (403).
  const ehAdmin = sessao.papel() === 'ADMIN';

  const irPara = useCallback(async (numero: number) => {
    setCarregando(true);
    setCnpjSemResultado(null);
    try {
      setPagina(await corretorasService.listar(numero));
      setCarregando(false);
      if (!ehAdmin) setSelos(await corretorasService.carteirasPorCorretora());
    } catch {
      setCarregando(false);
    }
  }, [ehAdmin]);

  useEffect(() => {
    void irPara(0);
  }, [irPara]);

  /**
   * Buscar não é navegar às cegas: o CNPJ que existe abre o detalhe, o que não
   * existe vira estado vazio com o convite de cadastrar. COR-001 fica para quem
   * abre um detalhe inexistente pela URL (Q-010).
   */
  const buscar = async (evento: FormEvent) => {
    evento.preventDefault();
    const digitos = somenteDigitos(termo);
    if (digitos.length !== 14) return;
    setBuscando(true);
    setCnpjSemResultado(null);
    const corretora = await corretorasService.porCnpj(digitos);
    setBuscando(false);
    if (corretora) navegar(`/corretoras/${corretora.id}`);
    else setCnpjSemResultado(digitos);
  };

  return (
    <section className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="m-0 text-titulo font-bold tracking-(--entrelinha-titulo)">Corretoras</h1>
        {ehAdmin && (
          <Botao asChild intencao="primaria">
            <Link to="/corretoras/nova">
              <Plus aria-hidden="true" focusable="false" />
              Cadastrar corretora
            </Link>
          </Botao>
        )}
      </header>

      <p data-catalogo-compartilhado className="m-0 max-w-(--largura-leitura) text-texto-fraco">
        Este catálogo é compartilhado entre todos os investidores: você vê as corretoras que qualquer um cadastrou e pode usar qualquer
        uma nas suas carteiras.
      </p>

      <form onSubmit={buscar} className="flex max-w-xl flex-wrap items-end gap-2">
        <Campo
          rotulo="Buscar por CNPJ"
          name="termo"
          inputMode="numeric"
          autoComplete="off"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          className="min-w-0 flex-[1_1_16rem]"
        />
        <Botao intencao="secundaria" type="submit" ocupado={buscando}>
          <Search aria-hidden="true" focusable="false" />
          Buscar
        </Botao>
      </form>

      {cnpjSemResultado && (
        <div data-busca-vazia className="flex flex-wrap items-center gap-3 rounded-grande border border-dashed border-borda bg-superficie p-4">
          <p className="m-0 flex-[1_1_100%]">Nenhuma corretora com o CNPJ {formatarCnpj(cnpjSemResultado)} está no catálogo.</p>
          {ehAdmin && (
            <Botao asChild intencao="primaria">
              <Link data-cadastrar-buscado to={`/corretoras/nova?${new URLSearchParams({ cnpj: cnpjSemResultado })}`}>
                Cadastrar este CNPJ
              </Link>
            </Botao>
          )}
          <Botao
            intencao="sutil"
            type="button"
            onClick={() => {
              setTermo('');
              setCnpjSemResultado(null);
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
            titulo="Nenhuma corretora no catálogo"
            descricao={
              ehAdmin
                ? 'O catálogo ainda não tem nenhuma corretora. Cadastre a primeira para os investidores usarem nas carteiras.'
                : 'O catálogo ainda não tem nenhuma corretora. Assim que o administrador cadastrar, ela aparece aqui.'
            }
            {...(ehAdmin && { rotuloAcao: 'Cadastrar corretora', aoAcionar: () => navegar('/corretoras/nova') })}
          />
        ) : (
          <>
            <ul className="m-0 grid list-none gap-2 p-0">
              {pagina.content.map((corretora) => {
                const selo = rotuloDoSelo(selos.get(corretora.id));
                return (
                  <li
                    key={corretora.id}
                    data-corretora={corretora.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 rounded-grande border border-borda bg-superficie px-4 py-3 transition-colors duration-(--duracao-rapida) hover:bg-[color-mix(in_srgb,var(--cor-acento)_6%,var(--cor-superficie))] sm:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)_auto]"
                  >
                    <Link data-nome to={`/corretoras/${corretora.id}`} className="truncate font-semibold text-texto no-underline hover:underline">
                      {nomeExibido(corretora)}
                    </Link>
                    <span data-cnpj className="font-numero text-apoio text-texto-fraco">
                      {formatarCnpj(corretora.cnpj)}
                    </span>
                    <span data-lugar className="text-apoio text-texto-fraco">
                      {cidadeComUf(corretora) ?? ''}
                    </span>
                    <span className="flex flex-wrap items-center justify-end gap-2">
                      <span data-validacao className="text-rotulo font-medium text-texto-fraco">
                        {corretora.validadaNaCvm ? 'Validada na CVM' : 'Sem validação na CVM'}
                      </span>
                      {selo && <Selo variante="estavel" texto={selo} />}
                    </span>
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
    </section>
  );
}
