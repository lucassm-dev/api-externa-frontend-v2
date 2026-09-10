import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input } from '@angular/core';

/**
 * As quatro intenções que o produto reconhece. Não são estilos: são respostas à
 * pergunta "o que acontece se eu clicar?". Primária avança o fluxo, secundária
 * oferece a alternativa, sutil é navegação de baixo peso e destrutiva apaga.
 */
export type IntencaoBotao = 'primaria' | 'secundaria' | 'sutil' | 'destrutiva';
export type TamanhoBotao = 'medio' | 'compacto';

const INTENCOES: readonly IntencaoBotao[] = ['primaria', 'secundaria', 'sutil', 'destrutiva'];
const TAMANHOS: readonly TamanhoBotao[] = ['medio', 'compacto'];

/**
 * Intenção desconhecida é recusada em vez de virar aparência padrão silenciosa
 * (AC-267): um botão que deveria gritar e aparece discreto é pior que um erro.
 */
function exigirIntencao(valor: string): IntencaoBotao {
  if (!INTENCOES.includes(valor as IntencaoBotao)) {
    throw new Error(`Intenção de botão desconhecida: "${valor}". Use ${INTENCOES.join(', ')}.`);
  }
  return valor as IntencaoBotao;
}

function exigirTamanho(valor: string): TamanhoBotao {
  if (!TAMANHOS.includes(valor as TamanhoBotao)) {
    throw new Error(`Tamanho de botão desconhecido: "${valor}". Use ${TAMANHOS.join(', ')}.`);
  }
  return valor as TamanhoBotao;
}

@Component({
  selector: 'button[appBotao], a[appBotao]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './botao.html',
  styleUrl: './botao.scss',
  host: {
    class: 'botao',
    '[attr.data-intencao]': 'intencao()',
    '[attr.data-tamanho]': 'tamanho()',
    '[attr.data-ocupado]': 'ocupado() ? "" : null',
    '[attr.aria-busy]': 'ocupado() ? "true" : null',
    '[attr.disabled]': 'ehBotao && bloqueado() ? "" : null',
    '[attr.aria-disabled]': '!ehBotao && bloqueado() ? "true" : null',
    '[attr.tabindex]': '!ehBotao && bloqueado() ? "-1" : null',
    '[class.bloqueado]': 'bloqueado()',
  },
})
export class Botao {
  readonly intencao = input<IntencaoBotao, string>('secundaria', { transform: exigirIntencao });
  readonly tamanho = input<TamanhoBotao, string>('medio', { transform: exigirTamanho });

  /**
   * Ação em curso. O rótulo continua legível — botão que vira spinner esconde o
   * que estava prestes a acontecer —, e o clique não passa duas vezes (AC-268).
   */
  readonly ocupado = input(false);
  readonly desabilitado = input(false);

  /**
   * Só `<button>` tem `disabled` de verdade. Num `<a>`, desabilitar é tirar do
   * foco e do ponteiro e dizer isso ao leitor de tela — atributo inexistente
   * não protege ninguém.
   */
  protected readonly ehBotao = inject(ElementRef).nativeElement.tagName === 'BUTTON';

  protected readonly bloqueado = computed(() => this.ocupado() || this.desabilitado());
}
