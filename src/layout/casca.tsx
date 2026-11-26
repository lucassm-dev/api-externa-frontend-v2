import { CircleUserRound, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useEffect, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { Botao } from '@/components/ui/botao';
import { BotaoIcone } from '@/components/ui/botao-icone';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { MINUTOS_AVISO_EXPIRACAO, ROTA_LOGIN } from '@/core/sessao/sessao.model';
import { sessao } from '@/core/sessao/sessao.service';
import { temaService } from '@/core/tema/tema.service';
import { ROTA_CONTA } from '@/features/conta/conta';
import { FotoDePerfil } from '@/features/conta/foto-de-perfil';
import { cn } from '@/lib/utils';
import { AREAS_DO_PRODUTO } from './areas';

const INTERVALO_DE_CHECAGEM_MS = 30_000;

/** Abaixo disto a navegação some atrás do botão de menu (AC-271). */
const CONSULTA_TELA_ESTREITA = '(max-width: 47.99em)';

function consultaEstreita(): MediaQueryList | null {
  return typeof window.matchMedia === 'function' ? window.matchMedia(CONSULTA_TELA_ESTREITA) : null;
}

/**
 * Moldura da área autenticada: as áreas, a troca de tema e o botão de sair —
 * sempre visível (PRD-002, ADR-001) — mais o aviso de sessão acabando, que sai
 * do `expiraEm` guardado, sem tocar o servidor.
 *
 * Na tela estreita as áreas ficam atrás de um botão de menu que anuncia
 * `aria-expanded`, fecha com Esc e fecha ao navegar (AC-271).
 */
export function Casca() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const email = useSyncExternalStore(sessao.assinar, () => sessao.email());
  const nome = useSyncExternalStore(sessao.assinar, () => sessao.nome());
  const papel = useSyncExternalStore(sessao.assinar, () => sessao.papel());
  const areas = AREAS_DO_PRODUTO.filter((area) => (papel === 'ADMIN' ? !area.somenteInvestidor : !area.somenteAdmin));
  const tema = useSyncExternalStore(temaService.assinar, temaService.tema);

  // Reavalia a idade da sessão de tempos em tempos, sem consultar o backend.
  const [, setTique] = useState(0);
  useEffect(() => {
    const relogio = setInterval(() => setTique((valor) => valor + 1), INTERVALO_DE_CHECAGEM_MS);
    return () => clearInterval(relogio);
  }, []);
  const sessaoAcabando = sessao.acabando();

  const [compacto, setCompacto] = useState(() => consultaEstreita()?.matches ?? false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    const lista = consultaEstreita();
    if (!lista) return;
    const aoMudarLargura = (evento: MediaQueryListEvent) => {
      setCompacto(evento.matches);
      if (!evento.matches) setMenuAberto(false);
    };
    lista.addEventListener('change', aoMudarLargura);
    return () => lista.removeEventListener('change', aoMudarLargura);
  }, []);

  // Trocar de área não deixa o menu aberto por cima (AC-271).
  useEffect(() => setMenuAberto(false), [pathname]);

  const sair = () => {
    sessao.encerrar();
    navegar(ROTA_LOGIN);
  };

  const aoTeclar = (evento: KeyboardEvent) => {
    if (evento.key === 'Escape') setMenuAberto(false);
  };

  const rotuloTema = tema === 'claro' ? 'Ativar tema escuro' : 'Ativar tema claro';

  return (
    <div data-casca onKeyDown={aoTeclar} className="min-h-full">
      <header
        data-barra
        className={cn(
          'sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3',
          // A barra ocupa a janela, mas o conteúdo dela alinha com a coluna do <main>.
          'min-h-14 border-b border-borda bg-superficie px-[max(1.25rem,calc((100%-var(--largura-pagina))/2+1.25rem))] py-2 shadow-baixa',
          'max-md:px-4 max-md:py-3',
        )}
      >
        <span className="flex items-center gap-2 text-grande font-bold tracking-(--entrelinha-titulo)">
          <span aria-hidden="true" className="size-3 rounded-[3px] bg-destaque" />
          Carteira
        </span>

        {compacto && (
          <Botao
            intencao="sutil"
            tamanho="compacto"
            type="button"
            data-menu
            aria-controls="areas-do-produto"
            aria-expanded={menuAberto}
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className="ml-auto"
          >
            <Menu aria-hidden="true" focusable="false" />
            Menu
          </Botao>
        )}

        <nav
          id="areas-do-produto"
          data-areas
          aria-label="Áreas do produto"
          hidden={compacto && !menuAberto}
          className={cn(
            'mr-auto ml-5 flex min-w-0 flex-wrap items-center gap-1',
            compacto && 'm-0 basis-full flex-col items-stretch gap-1',
          )}
        >
          {areas.map((area) => (
            <NavLink
              key={area.rota}
              to={area.rota}
              data-area={area.rota}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                cn(
                  'relative rounded px-3 py-2 text-texto-fraco no-underline transition-colors duration-(--duracao-rapida)',
                  'hover:bg-superficie-alta hover:text-texto',
                  compacto && 'py-3',
                  // Barra reta sob a área ativa: o sublinhado não acompanha o canto arredondado.
                  isActive &&
                    "font-semibold text-texto after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-pilula after:bg-acento after:content-['']",
                )
              }
            >
              {area.rotulo}
            </NavLink>
          ))}
        </nav>

        <div className={cn('ml-auto flex min-w-0 items-center gap-2', compacto && 'basis-full justify-end')}>
          <div data-identidade-investidor className="flex min-w-0 flex-auto items-center justify-end gap-3 overflow-hidden">
            <span className="flex min-w-0 flex-col items-end leading-(--altura-apertada)">
              <span className="text-rotulo font-semibold text-texto-fraco">{papel === 'ADMIN' ? 'Administrador' : 'Investidor'}</span>
              {/* ADMIN não tem perfil de investidor: sem nome, o e-mail o identifica (AC-312). */}
              <span data-email title={email ?? undefined} className="block max-w-60 truncate text-apoio text-texto-fraco max-md:max-w-full">
                {nome ?? email}
              </span>
            </span>
            <FotoDePerfil data-avatar-investidor />
          </div>

          <span data-minha-conta className="contents">
            <BotaoIcone rotulo="Minha conta" aoPressionar={() => navegar(ROTA_CONTA)}>
              <CircleUserRound aria-hidden="true" focusable="false" />
            </BotaoIcone>
          </span>

          <span data-alternar-tema data-tema-atual={tema} className="contents">
            <BotaoIcone rotulo={rotuloTema} aoPressionar={() => temaService.alternar()}>
              {tema === 'claro' ? (
                <Moon data-icone-tema="lua" aria-hidden="true" focusable="false" />
              ) : (
                <Sun data-icone-tema="sol" aria-hidden="true" focusable="false" />
              )}
            </BotaoIcone>
          </span>

          <span data-sair className="contents">
            <BotaoIcone rotulo="Sair do sistema" aoPressionar={sair}>
              <LogOut aria-hidden="true" focusable="false" />
            </BotaoIcone>
          </span>
        </div>
      </header>

      {sessaoAcabando && (
        <div data-aviso-sessao className="flex flex-wrap items-center gap-4 px-[max(1.25rem,calc((100%-var(--largura-pagina))/2+1.25rem))] py-3 max-md:p-3">
          <MensagemFeedback
            nivel="aviso"
            mensagem={`Sua sessão acaba em menos de ${MINUTOS_AVISO_EXPIRACAO} minutos. Entre novamente para não perder o que estiver fazendo.`}
            className="flex-[1_1_18rem]"
          />
          <Botao intencao="primaria" type="button" data-entrar-novamente onClick={sair}>
            Entrar novamente
          </Botao>
        </div>
      )}

      <main className="mx-auto block w-full max-w-(--largura-pagina) p-5 max-md:px-3 max-md:py-4">
        <Outlet />
      </main>
    </div>
  );
}
