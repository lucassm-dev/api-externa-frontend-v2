import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Botao } from '@/components/ui/botao';
import { CaixaDeMarcar } from '@/components/ui/caixa-de-marcar';
import { Campo } from '@/components/ui/campo';
import { DialogoConfirmacao } from '@/components/ui/dialogo-confirmacao';
import { formatarDataHora } from '@/core/formatacao/formatacao';
import { AlteracaoDeOperacao, OperacaoEditavel } from './operacoes.model';
import { precoManualTemCasasDemais } from './preco-da-operacao';

export const AVISO_DE_RECALCULO_NA_EDICAO = 'Editar esta operação vai recalcular a posição e o resultado da carteira.';

const ROTULO = 'text-rotulo font-medium uppercase tracking-(--entrelinha-rotulo) text-texto-fraco';

interface Props {
  operacao: OperacaoEditavel;
  salvando?: boolean;
  aoSalvar: (alteracao: AlteracaoDeOperacao) => void;
  aoCancelar: () => void;
}

const numeroOuNulo = (texto: string): number | null => (texto ? Number(texto) : null);

/**
 * Só quantidade e preço unitário são editáveis — nem ação, nem carteira, nem
 * tipo, nem data (PRD-007). E a edição não é correção de uma linha isolada: ela
 * recalcula preço médio, posição e resultado da carteira inteira, e a tela avisa
 * disso antes de confirmar.
 *
 * Sem preço novo o backend reutiliza a última cotação conhecida da ação, sem
 * buscar preço novo. O investidor precisa saber disso antes de salvar.
 */
export function EditarOperacao({ operacao, salvando = false, aoSalvar, aoCancelar }: Props) {
  const [quantidade, setQuantidade] = useState<number | null>(operacao.quantidade ?? null);
  const [precoManualAtivo, setPrecoManualAtivo] = useState(false);
  const [precoUnitario, setPrecoUnitario] = useState<number | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const precoComCasasDemais = precoManualAtivo && precoManualTemCasasDemais(precoUnitario);
  const podeSalvar = (quantidade ?? 0) > 0 && !precoComCasasDemais && !(precoManualAtivo && !precoUnitario);

  const confirmar = () => {
    if (!podeSalvar) return;
    const alteracao: AlteracaoDeOperacao = { quantidade: quantidade! };
    if (precoManualAtivo && precoUnitario) alteracao.precoUnitario = precoUnitario;
    aoSalvar(alteracao);
  };

  const fixos: Array<[string, string, string]> = [
    ['Tipo', 'tipo', operacao.tipo],
    ['Ação', 'ticker', operacao.ticker ?? '—'],
    ['Carteira', 'carteira', String(operacao.carteiraId)],
    ['Data e hora', 'data', formatarDataHora(operacao.dataHora)],
  ];

  return (
    <section data-edicao aria-labelledby="titulo-edicao" className="grid gap-5 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      <h2 id="titulo-edicao" className="m-0 text-medio font-semibold tracking-(--entrelinha-titulo)">
        Corrigir operação
      </h2>

      <dl data-nao-editaveis className="m-0 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-4 border-b border-borda pb-5">
        {fixos.map(([rotulo, chave, valor]) => (
          <div key={rotulo} className="grid gap-0.5">
            <dt className={ROTULO}>{rotulo}</dt>
            <dd data-fixo={chave} className="m-0 font-semibold">
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      <div className="grid max-w-(--largura-formulario) gap-4">
        <Campo
          rotulo="Quantidade"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          data-campo-quantidade
          value={quantidade ?? ''}
          onChange={(evento) => setQuantidade(numeroOuNulo(evento.target.value))}
        />

        <CaixaDeMarcar
          rotulo="Informar um preço novo"
          data-preco-manual
          checked={precoManualAtivo}
          onChange={(evento) => {
            setPrecoManualAtivo(evento.target.checked);
            if (!evento.target.checked) setPrecoUnitario(null);
          }}
          className="justify-self-start"
        />

        {precoManualAtivo ? (
          <Campo
            rotulo="Preço unitário"
            type="number"
            min={0}
            step={0.01}
            inputMode="decimal"
            data-campo-preco
            value={precoUnitario ?? ''}
            onChange={(evento) => setPrecoUnitario(numeroOuNulo(evento.target.value))}
            erro={precoComCasasDemais ? 'O preço pode ter no máximo 2 casas decimais.' : null}
          />
        ) : (
          <p data-sem-preco-novo className="m-0 text-apoio text-texto-fraco">
            Sem preço novo, o sistema reutiliza a última cotação conhecida desta ação, sem buscar preço novo.
          </p>
        )}
      </div>

      <p data-aviso-recalculo className="m-0 flex items-start gap-2 text-apoio font-medium text-aviso-texto">
        <RefreshCw aria-hidden="true" focusable="false" className="mt-0.5 size-4 flex-none" />
        {AVISO_DE_RECALCULO_NA_EDICAO}
      </p>

      <div className="flex flex-wrap gap-2">
        <Botao intencao="primaria" type="button" data-salvar disabled={!podeSalvar} ocupado={salvando} onClick={() => podeSalvar && setConfirmando(true)}>
          {salvando ? 'Salvando…' : 'Salvar correção'}
        </Botao>
        <Botao
          intencao="secundaria"
          type="button"
          data-cancelar-edicao
          onClick={() => {
            setConfirmando(false);
            aoCancelar();
          }}
        >
          Cancelar
        </Botao>
      </div>

      {confirmando && (
        <DialogoConfirmacao
          titulo="Salvar esta correção?"
          consequencia={AVISO_DE_RECALCULO_NA_EDICAO}
          rotuloConfirmar="Salvar correção"
          ocupado={salvando}
          aoConfirmar={confirmar}
          aoCancelar={() => setConfirmando(false)}
        />
      )}
    </section>
  );
}
