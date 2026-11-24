import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { NivelFeedback } from '@/core/feedback/feedback.model';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';

export interface MensagemDaTela {
  texto: string;
  nivel: NivelFeedback;
  codigo: string | null;
}

interface Props {
  titulo: string;
  apoio: string;
  avisos: ReactNode;
  rodape: { texto: string; rotulo: string; para: string };
  children: ReactNode;
}

/** O cartão comum do login e do cadastro (mesmo login.scss e cadastro.scss no Angular). */
export function CartaoAcesso({ titulo, apoio, avisos, rodape, children }: Props) {
  return (
    <section className="rounded-grande border border-borda bg-superficie p-8 shadow-cartao max-sm:p-6">
      <h1 className="m-0 mb-1 text-titulo font-bold tracking-(--entrelinha-titulo)">{titulo}</h1>
      <p className="m-0 mb-6 text-texto-fraco">{apoio}</p>
      <div className="mb-4 grid gap-2 empty:hidden">{avisos}</div>
      {children}
      <p className="mt-6 mb-0 text-texto-fraco">
        {rodape.texto} <Link to={rodape.para}>{rodape.rotulo}</Link>
      </p>
    </section>
  );
}

export function MensagemDoEnvio({ mensagem }: { mensagem: MensagemDaTela | null }) {
  return mensagem && <MensagemFeedback nivel={mensagem.nivel} mensagem={mensagem.texto} codigo={mensagem.codigo} />;
}
