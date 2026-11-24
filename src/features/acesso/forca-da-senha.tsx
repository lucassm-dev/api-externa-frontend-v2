import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validarSenha } from './validadores';

/** Progresso nos três requisitos; a decisão final vem do mesmo validador do formulário (AC-255). */
export function ForcaDaSenha({ senha }: { senha: string }) {
  const requisitos = [
    { id: 'tamanho', rotulo: '8 ou mais caracteres', atendido: senha.length >= 8 },
    { id: 'letra', rotulo: 'Ao menos uma letra', atendido: /[A-Za-z]/.test(senha) },
    { id: 'numero', rotulo: 'Ao menos um número', atendido: /\d/.test(senha) },
  ];
  const progresso = requisitos.filter((requisito) => requisito.atendido).length / requisitos.length;
  const aceitavel = validarSenha(senha) === null;

  return (
    <section data-forca-senha data-aceitavel={String(aceitavel)} role="status" aria-live="polite" className="grid gap-2 text-rotulo text-texto-fraco">
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-pilula bg-superficie-alta">
        {/* Preenche por escala, não por largura: anima sem recalcular layout. */}
        <span
          data-preenchimento
          className={cn(
            'block h-full origin-left rounded-pilula transition-transform duration-(--duracao) ease-(--saida)',
            aceitavel ? 'bg-sucesso-borda' : 'bg-aviso-borda',
          )}
          style={{ transform: `scaleX(${progresso})` }}
        />
      </div>

      <p className="m-0 font-semibold text-texto">{aceitavel ? 'Senha atende à política' : 'Complete os requisitos da senha'}</p>

      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-1 p-0">
        {requisitos.map((requisito) => (
          <li key={requisito.id} data-requisito={requisito.id} className={cn('inline-flex items-center gap-1', requisito.atendido && 'text-sucesso-texto')}>
            {requisito.atendido ? (
              <Check aria-hidden="true" focusable="false" className="size-3.5" strokeWidth={2.5} />
            ) : (
              <Circle aria-hidden="true" focusable="false" className="size-3" />
            )}
            {requisito.rotulo}
            <span className="sr-only"> — {requisito.atendido ? 'atendido' : 'falta'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
