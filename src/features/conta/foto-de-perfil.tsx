import { useEffect, useState, useSyncExternalStore } from 'react';
import { sessao } from '@/core/sessao/sessao.service';
import { cn } from '@/lib/utils';
import { conta } from './conta';

export function iniciaisDoEmail(email: string | null | undefined): string {
  const [parteLocal = '', dominio = ''] = (email ?? '').trim().split('@');
  const iniciais = `${parteLocal.charAt(0)}${dominio.charAt(0)}`.toLocaleUpperCase('pt-BR');
  return iniciais || 'IN';
}

/**
 * A foto exige o token, então não dá para usar `<img src="/auth/me/foto">`:
 * vem como blob e vira um endereço local (AC-339). A busca refaz a cada
 * identidade nova, que é o que muda depois de enviar ou remover a foto.
 */
function useFoto(): string | null {
  const identidade = useSyncExternalStore(sessao.assinar, () => sessao.identidade());
  const [endereco, setEndereco] = useState<string | null>(null);

  useEffect(() => {
    if (!identidade?.fotoUrl) return;
    const controle = new AbortController();
    let criado: string | null = null;
    conta.buscarFoto(controle.signal).then(
      (foto) => {
        criado = URL.createObjectURL(foto);
        setEndereco(criado);
      },
      () => setEndereco(null),
    );
    return () => {
      controle.abort();
      if (criado) URL.revokeObjectURL(criado);
      setEndereco(null);
    };
  }, [identidade]);

  return endereco;
}

/** Avatar decorativo: quem lê o nome é o texto ao lado (AC-285). */
export function FotoDePerfil({ className, ...atributos }: { className?: string } & Record<`data-${string}`, boolean>) {
  const email = useSyncExternalStore(sessao.assinar, () => sessao.email());
  const foto = useFoto();

  return (
    <span
      {...atributos}
      aria-hidden="true"
      className={cn(
        'grid size-10 flex-none place-items-center overflow-hidden rounded-pilula bg-destaque text-apoio font-extrabold tracking-(--entrelinha-rotulo) text-destaque-texto',
        className,
      )}
    >
      {foto ? <img src={foto} alt="" className="size-full object-cover" /> : iniciaisDoEmail(email)}
    </span>
  );
}
