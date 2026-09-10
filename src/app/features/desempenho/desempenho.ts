import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Carteira } from '../carteiras/carteiras.model';
import { CarteiraPreferida } from '../painel/carteira-preferida';
import { Botao } from '../../shared/botao/botao';
import { ConfissoesDesempenho } from './blocos/confissoes-desempenho';
import { GraficoComposicao } from './blocos/grafico-composicao';
import { GraficoConcentracao } from './blocos/grafico-concentracao';
import { GraficoContribuicao } from './blocos/grafico-contribuicao';
import { GraficoInvestidoMercado } from './blocos/grafico-investido-mercado';
import { GraficoMapaPosicoes } from './blocos/grafico-mapa-posicoes';
import { GraficoQuadrante } from './blocos/grafico-quadrante';
import { GraficoRealizado } from './blocos/grafico-realizado';
import { NumerosDesempenho } from './blocos/numeros-desempenho';
import { moedaDe, paraReal } from './moeda-das-posicoes';
import { composicaoDaCarteira } from './composicao';
import { contribuicaoPorAtivo } from './contribuicao';
import { DadosDaCarteira } from './desempenho.model';
import { DesempenhoService } from './desempenho.service';
import { idadeDasCotacoes } from './idade-das-cotacoes';
import { houveVenda, realizadoPorTicker } from './realizado-por-ticker';
import { resultadosDaCarteira } from './resultados';

/**
 * A tela que entrega o valor do produto. Uma carteira por vez: o backend
 * consolida por carteira, e somar no frontend produziria um número que não bate
 * com nenhuma outra tela do sistema (ADR-004).
 *
 * A escolha da carteira é a mesma do painel — quem escolheu ali não reescolhe
 * aqui, e vice-versa.
 *
 * Quem não tem operação não vê gráfico zerado: vê o convite a registrar a
 * primeira compra. Tela vazia é caminho, não estado degradado (ADR-003).
 */
@Component({
  selector: 'app-desempenho',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    Botao,
    NumerosDesempenho,
    ConfissoesDesempenho,
    GraficoComposicao,
    GraficoContribuicao,
    GraficoRealizado,
    GraficoMapaPosicoes,
    GraficoInvestidoMercado,
    GraficoQuadrante,
    GraficoConcentracao,
  ],
  templateUrl: './desempenho.html',
  styleUrl: './desempenho.scss',
})
export class Desempenho {
  private readonly desempenho = inject(DesempenhoService);
  private readonly preferida = inject(CarteiraPreferida);

  protected readonly carteiras = signal<Carteira[] | null>(null);
  protected readonly carteiraSelecionada = signal<number | null>(null);
  protected readonly dados = signal<DadosDaCarteira | null>(null);
  protected readonly carregandoCarteiras = signal(true);
  protected readonly carregandoDados = signal(false);

  protected readonly semCarteira = computed(
    () => !this.carregandoCarteiras() && this.carteiras()?.length === 0,
  );

  protected readonly consolidado = computed(() => this.dados()?.consolidado ?? null);

  /**
   * Sem posição aberta e sem venda apurada não há nada para desenhar. Leitura
   * que falhou não conta como carteira vazia: `null` é desconhecido, não zero.
   */
  protected readonly semOperacao = computed(() => {
    const dados = this.dados();
    if (!dados || dados.posicoes === null || dados.lucroRealizado === null) {
      return false;
    }
    return dados.posicoes.length === 0 && !houveVenda(dados.lucroRealizado);
  });

  protected readonly resultados = computed(() => {
    const dados = this.dados();
    return dados?.consolidado ? resultadosDaCarteira(dados.consolidado, dados.lucroRealizado) : null;
  });

  protected readonly composicao = computed(() => {
    const dados = this.dados();
    if (!dados?.consolidado || dados.posicoes === null) {
      return null;
    }
    return composicaoDaCarteira(dados.posicoes, dados.moedas, dados.consolidado);
  });

  protected readonly contribuicao = computed(() => {
    const dados = this.dados();
    if (!dados?.consolidado || dados.posicoes === null) {
      return null;
    }
    return contribuicaoPorAtivo(dados.posicoes, dados.moedas, dados.consolidado.taxaCambioAtual);
  });

  protected readonly realizado = computed(() => {
    const lucro = this.dados()?.lucroRealizado;
    return lucro ? realizadoPorTicker(lucro) : null;
  });

  /**
   * Cada posição em real, com custo, valor de hoje e resultado lado a lado. É a
   * base dos quatro blocos novos, e a conversão vem ANTES de qualquer
   * comparação: custo em real ao lado de valor em dólar produz diferença
   * inventada, e o erro é silencioso.
   */
  protected readonly posicoesEmReal = computed(() => {
    const dados = this.dados();
    const taxa = dados?.consolidado?.taxaCambioAtual;
    if (!dados || dados.posicoes === null || taxa === undefined) {
      return [];
    }

    return dados.posicoes
      .map((posicao) => {
        const moeda = moedaDe(posicao.ticker, dados.moedas);
        const valorDeMercado = paraReal(posicao.quantidade * posicao.cotacaoAtual, moeda, taxa).valor;
        const investido = paraReal(posicao.quantidade * posicao.precoMedio, moeda, taxa).valor;
        const resultado = paraReal(posicao.rentabilidadeNaoRealizada, moeda, taxa).valor;

        return {
          ticker: posicao.ticker,
          nomeEmpresa: posicao.nomeEmpresa,
          valorDeMercado,
          investido,
          valorMercado: valorDeMercado,
          resultado,
          // Sobre o custo, não sobre o valor de hoje: é o custo que o investidor
          // arriscou, e é dele que a rentabilidade fala.
          rentabilidade: investido > 0 ? (resultado / investido) * 100 : 0,
        };
      })
      .filter((posicao) => posicao.valorDeMercado > 0)
      .sort((uma, outra) => outra.valorDeMercado - uma.valorDeMercado);
  });

  protected readonly idade = computed(() => idadeDasCotacoes(this.dados()?.posicoes ?? []));

  constructor() {
    this.desempenho
      .carteiras()
      .pipe(catchError(() => of(null)))
      .subscribe((carteiras) => {
        this.carregandoCarteiras.set(false);
        this.carteiras.set(carteiras);
        const escolhida = carteiras ? this.preferida.escolherEntre(carteiras) : null;
        if (escolhida) {
          this.carteiraSelecionada.set(escolhida.id);
          this.carregar(escolhida.id);
        }
      });
  }

  protected escolher(valor: string): void {
    const id = Number(valor);
    if (!Number.isInteger(id) || id === this.carteiraSelecionada()) {
      return;
    }
    this.preferida.lembrar(id);
    this.carteiraSelecionada.set(id);
    this.carregar(id);
  }

  private carregar(carteiraId: number): void {
    this.carregandoDados.set(true);
    this.dados.set(null);
    this.desempenho.dadosDaCarteira(carteiraId).subscribe((dados) => {
      this.carregandoDados.set(false);
      this.dados.set(dados);
    });
  }
}
