import { useState, type FormEvent } from 'react';
import { Botao } from '@/components/ui/botao';
import { Campo } from '@/components/ui/campo';
import { Selecao } from '@/components/ui/selecao';
import { Parametros } from '@/core/api/http';
import { CATALOGO_ERROS } from '@/core/erros/catalogo-erros';
import { MensagemFeedback } from '@/core/feedback/mensagem-feedback';
import { Carteira } from '@/features/carteiras/carteiras.model';
import { useFormulario, type Erros } from '@/lib/formulario';

/**
 * Nomes na busca do endereço. `carteira` e `tipo` já pertencem ao formulário de
 * registro (link do detalhe da carteira), por isso o filtro usa outros (ASM-084).
 */
export const CAMPOS_DO_FILTRO = ['dataInicio', 'dataFim', 'ticker', 'carteiraId', 'tipoOperacao', 'resultado'] as const;
export type Filtros = Record<(typeof CAMPOS_DO_FILTRO)[number], string>;

export function filtrosDaBusca(busca: URLSearchParams): Filtros {
  return Object.fromEntries(CAMPOS_DO_FILTRO.map((campo) => [campo, busca.get(campo) ?? ''])) as Filtros;
}

export function temFiltro(filtros: Filtros): boolean {
  return CAMPOS_DO_FILTRO.some((campo) => filtros[campo] !== '');
}

/** Só o que foi preenchido sai: sem filtro, a leitura é a de sempre (AC-341). */
export function parametrosDoServidor({ tipoOperacao, ...resto }: Filtros): Parametros {
  const parametros: Parametros = {};
  for (const [campo, valor] of Object.entries({ ...resto, tipo: tipoOperacao })) if (valor) parametros[campo] = valor;
  return parametros;
}

const DATA_FINAL_ANTES = CATALOGO_ERROS['OPE-006'].mensagem;

function validar({ dataInicio, dataFim }: Filtros): Erros<Filtros> {
  // Datas ISO (AAAA-MM-DD) comparam certo como texto.
  return dataInicio && dataFim && dataFim < dataInicio ? { dataFim: DATA_FINAL_ANTES } : {};
}

export interface RecusaDoFiltro {
  mensagem: string;
  campo: string | null;
}

interface Props {
  filtros: Filtros;
  carteiras: Carteira[];
  recusa: RecusaDoFiltro | null;
  aoAplicar: (filtros: Filtros) => void;
}

export function FiltrosExtrato({ filtros, carteiras, recusa, aoAplicar }: Props) {
  const formulario = useFormulario<Filtros>(filtros, validar);
  const [enviado, setEnviado] = useState(false);

  const aplicar = (evento: FormEvent) => {
    evento.preventDefault();
    setEnviado(true);
    if (formulario.invalido) {
      formulario.tocarTodos();
      return;
    }
    aoAplicar({ ...formulario.valores, ticker: formulario.valores.ticker.trim().toUpperCase() });
  };

  const ligar = (campo: keyof Filtros) => ({
    name: campo,
    value: formulario.valores[campo],
    onChange: (evento: { target: { value: string } }) => formulario.mudar(campo, evento.target.value),
    // A recusa do servidor só vale para o que foi enviado; mexer no campo a apaga.
    erro: formulario.erroDe(campo) ?? (recusa?.campo === campo && !enviado ? recusa.mensagem : null),
  });

  return (
    <form data-filtros-extrato aria-label="Filtros do extrato" onSubmit={aplicar} noValidate className="grid gap-4 rounded-grande border border-borda bg-superficie p-5 shadow-cartao max-sm:p-4">
      {recusa && !recusa.campo && <MensagemFeedback nivel="erro" mensagem={recusa.mensagem} />}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Campo rotulo="Data inicial" type="date" {...ligar('dataInicio')} />
        <Campo rotulo="Data final" type="date" {...ligar('dataFim')} />
        <Campo rotulo="Ação" placeholder="PETR4" autoComplete="off" {...ligar('ticker')} />
        <Selecao rotulo="Carteira" empilhado {...ligar('carteiraId')}>
          <option value="">Todas</option>
          {carteiras.map((carteira) => (
            <option key={carteira.id} value={carteira.id}>
              {carteira.nome}
            </option>
          ))}
        </Selecao>
        <Selecao rotulo="Tipo" empilhado {...ligar('tipoOperacao')}>
          <option value="">Compras e vendas</option>
          <option value="COMPRA">Compras</option>
          <option value="VENDA">Vendas</option>
        </Selecao>
        <Selecao rotulo="Resultado" empilhado dica="Lucro realizado: só vendas entram." {...ligar('resultado')}>
          <option value="">Qualquer</option>
          <option value="LUCRO">Lucro</option>
          <option value="PREJUIZO">Prejuízo</option>
        </Selecao>
      </div>
      <div className="flex flex-wrap gap-2">
        <Botao intencao="secundaria" type="submit">
          Filtrar
        </Botao>
      </div>
    </form>
  );
}
