import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
  formatarDataHora,
  formatarMoeda,
  formatarNumero,
} from '../../../core/formatacao/formatacao';
import { BotaoIcone } from '../../../shared/botao-icone/botao-icone';
import { DialogoConfirmacao } from '../../../shared/confirmacao/dialogo-confirmacao';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { EstadoVazio } from '../../../shared/estado-vazio/estado-vazio';
import { Monograma } from '../../../shared/monograma/monograma';
import { Paginador } from '../../../shared/paginador/paginador';
import { Selo, VarianteSelo } from '../../../shared/selo/selo';
import { CabecalhoOrdenavel, SentidoOrdenacao } from '../../../shared/tabela/cabecalho-ordenavel';
import { OrdenacaoTabela } from '../../../shared/tabela/ordenacao';
import { Carteira } from '../../carteiras/carteiras.model';
import { OPERACOES_POR_PAGINA, OperacaoDoExtrato } from '../operacoes.model';

export const AVISO_DE_RECALCULO =
  'Excluir esta operação vai recalcular a posição e o resultado da carteira. Não há como desfazer.';

/**
 * Data e hora, carteira, tipo, ticker, quantidade, preço unitário, valor total
 * e moeda, do mais recente para o mais antigo, paginado (PRD-007).
 *
 * **Sem filtros.** O backend não aceita filtro por carteira, ticker, tipo nem
 * período, e filtrar só a página carregada mentiria: o investidor filtraria por
 * um ticker, não acharia a operação que sabe existir, e concluiria que o
 * sistema perdeu o lançamento (ADR-010). Nenhum controle de filtro existe aqui.
 *
 * A ordenação (via utilitário compartilhado, RFC-001 D2) vale só sobre a página
 * já carregada — nunca busca de novo nem troca de página (AC-243, ADR-010).
 */
@Component({
  selector: 'app-extrato-operacoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CabecalhoOrdenavel,
    Monograma,
    Selo,
    BotaoIcone,
    Paginador,
    EstadoVazio,
    Esqueleto,
    DialogoConfirmacao,
  ],
  templateUrl: './extrato-operacoes.html',
  styleUrl: './extrato-operacoes.scss',
})
export class ExtratoOperacoes {
  readonly operacoes = input.required<OperacaoDoExtrato[]>();
  readonly carteiras = input<Carteira[]>([]);
  readonly pagina = input(0);
  readonly totalDePaginas = input(0);
  readonly carregando = input(false);
  readonly excluindo = input(false);

  readonly mudarPagina = output<number>();
  readonly editar = output<OperacaoDoExtrato>();
  readonly excluir = output<OperacaoDoExtrato>();
  readonly registrarPrimeira = output<void>();

  protected readonly avisoDeRecalculo = AVISO_DE_RECALCULO;
  protected readonly itensPorPagina = OPERACOES_POR_PAGINA;

  readonly emExclusao = signal<OperacaoDoExtrato | null>(null);

  /** A ordenação é estado imperativo do utilitário; este contador reprojeta a view a cada acionamento. */
  private readonly versaoOrdenacao = signal(0);

  private readonly ordenacao = new OrdenacaoTabela<OperacaoDoExtrato>([
    { id: 'quando', valor: (o) => o.dataHora },
    { id: 'carteira', valor: (o) => this.carteira(o) },
    { id: 'tipo', valor: (o) => o.tipo },
    { id: 'ticker', valor: (o) => o.ticker },
    { id: 'quantidade', valor: (o) => o.quantidade },
    { id: 'preco', valor: (o) => o.precoUnitario },
    { id: 'total', valor: (o) => o.valorTotal },
    { id: 'resultado', valor: (o) => (o.tipo === 'VENDA' ? o.lucroRealizado ?? null : null) },
  ]);

  protected readonly linhas = computed(() => {
    this.versaoOrdenacao();
    return this.ordenacao.ordenar(this.operacoes());
  });

  /**
   * O total real de itens não chega do backend nesta tela; a última página
   * fecha a conta pelo que carregou e as demais assumem página cheia. Basta
   * para o rodapé anunciar a faixa exibida (AC-249).
   */
  protected readonly totalDeItens = computed(() => {
    const ultima = this.totalDePaginas() - 1;
    return this.pagina() >= ultima
      ? ultima * OPERACOES_POR_PAGINA + this.operacoes().length
      : this.totalDePaginas() * OPERACOES_POR_PAGINA;
  });

  protected ordenarPor(coluna: string): void {
    this.ordenacao.alternar(coluna);
    this.versaoOrdenacao.update((v) => v + 1);
  }

  protected sentido(coluna: string): SentidoOrdenacao {
    this.versaoOrdenacao();
    switch (this.ordenacao.ariaSort(coluna)) {
      case 'ascending':
        return 'crescente';
      case 'descending':
        return 'decrescente';
      default:
        return 'nenhum';
    }
  }

  protected quando(operacao: OperacaoDoExtrato): string {
    return formatarDataHora(operacao.dataHora);
  }

  protected quantidade(operacao: OperacaoDoExtrato): string {
    return formatarNumero(operacao.quantidade, 0);
  }

  protected preco(operacao: OperacaoDoExtrato): string {
    return formatarMoeda(operacao.precoUnitario, operacao.moeda);
  }

  protected total(operacao: OperacaoDoExtrato): string {
    return formatarMoeda(operacao.valorTotal, operacao.moeda);
  }

  /** Carteira fora da listagem carregada aparece pelo identificador, nunca em branco. */
  protected carteira(operacao: OperacaoDoExtrato): string {
    const achada = this.carteiras().find((carteira) => carteira.id === operacao.carteiraId);
    return achada ? achada.nome : `Carteira ${operacao.carteiraId}`;
  }

  protected tipoVariante(operacao: OperacaoDoExtrato): VarianteSelo {
    return operacao.tipo === 'COMPRA' ? 'alta' : 'baixa';
  }

  /** Ausente é ausente (ASM-038): a linha some com o campo, sem traço nem zero. */
  protected resultado(operacao: OperacaoDoExtrato): string | null {
    if (operacao.tipo !== 'VENDA' || operacao.lucroRealizado === undefined) {
      return null;
    }
    return formatarMoeda(operacao.lucroRealizado, operacao.moeda);
  }

  protected resultadoVariante(operacao: OperacaoDoExtrato): VarianteSelo {
    const lucro = operacao.lucroRealizado ?? 0;
    return lucro > 0 ? 'alta' : lucro < 0 ? 'baixa' : 'estavel';
  }

  protected rotuloEditar(operacao: OperacaoDoExtrato): string {
    return `Editar operação de ${operacao.ticker} em ${this.quando(operacao)}`;
  }

  protected rotuloExcluir(operacao: OperacaoDoExtrato): string {
    return `Excluir operação de ${operacao.ticker} em ${this.quando(operacao)}`;
  }

  pedirExclusao(operacao: OperacaoDoExtrato): void {
    this.emExclusao.set(operacao);
  }

  cancelarExclusao(): void {
    this.emExclusao.set(null);
  }

  confirmarExclusao(): void {
    const operacao = this.emExclusao();
    if (operacao) {
      this.excluir.emit(operacao);
    }
  }

  fecharExclusao(): void {
    this.emExclusao.set(null);
  }

  irPara(pagina: number): void {
    if (pagina >= 0 && pagina < this.totalDePaginas()) {
      this.mudarPagina.emit(pagina);
    }
  }
}
