import { Upload } from 'lucide-react';
import { useId, type ChangeEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { estiloBotao } from './botao';

interface Props {
  rotulo: string;
  accept?: string;
  disabled?: boolean;
  dica?: ReactNode;
  erro?: ReactNode;
  onChange: (evento: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Escolher arquivo com cara de botão do kit. O <input type="file"> continua lá,
 * invisível dentro do rótulo: teclado, leitor de tela e o seletor do sistema são
 * os do navegador; só a aparência crua ("Nenhum arquivo escolhido") some.
 */
export function EscolhaDeArquivo({ rotulo, accept, disabled = false, dica, erro, onChange }: Props) {
  const idApoio = useId();
  const apoio = erro ?? dica;

  return (
    <div className="grid justify-items-start gap-1.5">
      <label
        aria-disabled={disabled || undefined}
        className={cn(estiloBotao({ intencao: 'secundaria', tamanho: 'medio' }), 'has-[:focus-visible]:shadow-(--anel-foco)')}
      >
        <Upload aria-hidden="true" focusable="false" />
        {rotulo}
        <input
          type="file"
          accept={accept}
          disabled={disabled}
          aria-invalid={erro ? true : undefined}
          aria-describedby={apoio ? idApoio : undefined}
          onChange={onChange}
          className="sr-only"
        />
      </label>
      {apoio && (
        <p id={idApoio} {...(erro ? { 'data-erro': true } : { 'data-dica': true })} className={cn('m-0 text-rotulo', erro ? 'font-medium text-erro-texto' : 'text-texto-fraco')}>
          {apoio}
        </p>
      )}
    </div>
  );
}
