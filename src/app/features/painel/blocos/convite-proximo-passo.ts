import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideInbox } from '@lucide/angular';
import { ProximoPasso } from '../proximo-passo';

/**
 * Um convite por vez, na linguagem do estado vazio: painel sem carteira é
 * caminho com ícone, explicação e ação seguinte, não um bloco vazio (ADR-003).
 */
@Component({
  selector: 'app-convite-proximo-passo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideInbox, LucideArrowRight],
  templateUrl: './convite-proximo-passo.html',
  styleUrl: './convite-proximo-passo.scss',
})
export class ConviteProximoPasso {
  readonly passo = input.required<ProximoPasso>();
}
