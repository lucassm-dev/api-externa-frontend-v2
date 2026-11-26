import type { ReactNode } from 'react';
import { AlertDialog } from 'radix-ui';
import { Botao } from './botao';

interface Props {
  titulo: string;
  consequencia: string;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  ocupado?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  /** Um campo que a confirmação exige, como o motivo de um bloqueio. */
  children?: ReactNode;
}

/**
 * A confirmação simples do PRD-009: título, consequência em texto e dois
 * botões. Nada de digitar o nome do que será removido — o atrito extra não se
 * justifica num produto sem dinheiro real, e o vínculo ativo já protege o resto.
 *
 * Sobre o AlertDialog do Radix: o foco fica preso no diálogo, Esc cancela, e
 * clicar no véu também cancela, como no Angular.
 */
export function DialogoConfirmacao({
  titulo,
  consequencia,
  rotuloConfirmar = 'Confirmar',
  rotuloCancelar = 'Cancelar',
  ocupado = false,
  aoConfirmar,
  aoCancelar,
  children,
}: Props) {
  const cancelar = () => {
    if (!ocupado) aoCancelar();
  };

  return (
    <AlertDialog.Root open onOpenChange={(aberto) => !aberto && cancelar()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="animacao-veu fixed inset-0 z-20 bg-sombra-modal" onClick={cancelar} />
        <AlertDialog.Content className="animacao-dialogo fixed top-1/2 left-1/2 z-20 w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-grande border border-borda bg-superficie p-6 shadow-alta">
          <AlertDialog.Title
            data-titulo
            className="m-0 mb-2 text-grande font-semibold leading-(--altura-apertada) tracking-(--entrelinha-titulo)"
          >
            {titulo}
          </AlertDialog.Title>
          <AlertDialog.Description data-consequencia className="m-0 text-texto-fraco">
            {consequencia}
          </AlertDialog.Description>
          {children && <div className="mt-4 grid gap-3">{children}</div>}

          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Botao intencao="sutil" type="button" data-cancelar desabilitado={ocupado} onClick={aoCancelar}>
              {rotuloCancelar}
            </Botao>
            <Botao intencao="primaria" type="button" data-confirmar ocupado={ocupado} onClick={aoConfirmar}>
              {rotuloConfirmar}
            </Botao>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
