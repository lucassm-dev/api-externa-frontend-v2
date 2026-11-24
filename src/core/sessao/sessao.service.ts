import { CHAVE_SESSAO, MINUTOS_AVISO_EXPIRACAO, RespostaLogin, Sessao, ehSessao } from './sessao.model';

function ler(): Sessao | null {
  try {
    const guardado = localStorage.getItem(CHAVE_SESSAO);
    if (!guardado) {
      return null;
    }
    const candidata: unknown = JSON.parse(guardado);
    return ehSessao(candidata) ? candidata : null;
  } catch {
    return null;
  }
}

function apagar(): void {
  try {
    localStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // sem armazenamento não há o que apagar
  }
}

function venceu(sessao: Sessao): boolean {
  return Date.parse(sessao.expiraEm) <= Date.now();
}

/**
 * Mesma regra do SessaoService do Angular. No lugar do signal, quem precisa
 * reagir assina as mudanças (os componentes, via useSyncExternalStore).
 */
export class SessaoService {
  private estado: Sessao | null = null;
  private readonly ouvintes = new Set<() => void>();

  constructor() {
    const guardada = ler();
    if (guardada && venceu(guardada)) {
      apagar();
      return;
    }
    this.estado = guardada;
  }

  readonly assinar = (ouvinte: () => void): (() => void) => {
    this.ouvintes.add(ouvinte);
    return () => this.ouvintes.delete(ouvinte);
  };

  email(): string | null {
    return this.sessaoValida()?.email ?? null;
  }

  token(): string | null {
    return this.sessaoValida()?.token ?? null;
  }

  ativa(): boolean {
    return this.sessaoValida() !== null;
  }

  /** Verdadeiro nos últimos minutos da sessão, sem nenhuma ida ao servidor. */
  acabando(): boolean {
    const sessao = this.sessaoValida();
    if (!sessao) {
      return false;
    }
    const restante = Date.parse(sessao.expiraEm) - Date.now();
    return restante <= MINUTOS_AVISO_EXPIRACAO * 60_000;
  }

  expiraEm(): Date | null {
    const sessao = this.sessaoValida();
    return sessao ? new Date(sessao.expiraEm) : null;
  }

  /** O e-mail vem do formulário de login: o servidor não o devolve. */
  iniciar(resposta: RespostaLogin, email: string): void {
    const sessao: Sessao = { ...resposta, email };
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
    } catch {
      // sem armazenamento a sessão vale só para esta aba
    }
    this.estado = sessao;
    this.avisar();
  }

  encerrar(): void {
    apagar();
    const mudou = this.estado !== null;
    this.estado = null;
    if (mudou) this.avisar();
  }

  private sessaoValida(): Sessao | null {
    const sessao = this.estado;
    if (!sessao) {
      return null;
    }
    if (venceu(sessao)) {
      this.encerrar();
      return null;
    }
    return sessao;
  }

  private avisar(): void {
    for (const ouvinte of this.ouvintes) ouvinte();
  }
}

export const sessao = new SessaoService();
