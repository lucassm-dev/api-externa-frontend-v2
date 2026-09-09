import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { Carteira } from '../carteiras/carteiras.model';
import { CarteiraPreferida } from '../painel/carteira-preferida';
import { ConfissoesDesempenho } from './blocos/confissoes-desempenho';
import { GraficoComposicao } from './blocos/grafico-composicao';
import { GraficoContribuicao } from './blocos/grafico-contribuicao';
import { GraficoRealizado } from './blocos/grafico-realizado';
import { NumerosDesempenho } from './blocos/numeros-desempenho';
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
    NumerosDesempenho,
    ConfissoesDesempenho,
    GraficoComposicao,
    GraficoContribuicao,
    GraficoRealizado,
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
