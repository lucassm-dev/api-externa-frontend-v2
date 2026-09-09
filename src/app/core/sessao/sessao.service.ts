import { Injectable, computed, signal } from '@angular/core';
import {
  CHAVE_SESSAO,
  MINUTOS_AVISO_EXPIRACAO,
  RespostaLogin,
  Sessao,
  ehSessao,
} from './sessao.model';

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

@Injectable({ providedIn: 'root' })
export class SessaoService {
  /** Muda a cada evento de sessão; é o que faz os sinais derivados reavaliarem. */
  private readonly estado = signal<Sessao | null>(null);

  readonly email = computed(() => this.sessaoValida()?.email ?? null);

  constructor() {
    const guardada = ler();
    if (guardada && this.venceu(guardada)) {
      apagar();
      return;
    }
    this.estado.set(guardada);
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
    this.estado.set(sessao);
  }

  encerrar(): void {
    apagar();
    this.estado.set(null);
  }

  private sessaoValida(): Sessao | null {
    const sessao = this.estado();
    if (!sessao) {
      return null;
    }
    if (this.venceu(sessao)) {
      this.encerrar();
      return null;
    }
    return sessao;
  }

  private venceu(sessao: Sessao): boolean {
    return Date.parse(sessao.expiraEm) <= Date.now();
  }
}
