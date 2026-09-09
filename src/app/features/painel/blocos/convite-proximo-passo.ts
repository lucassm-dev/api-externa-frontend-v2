import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProximoPasso } from '../proximo-passo';

/** Um convite por vez. A tela vazia é caminho, não estado degradado (ADR-003). */
@Component({
  selector: 'app-convite-proximo-passo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './convite-proximo-passo.html',
  styleUrl: './convite-proximo-passo.scss',
})
export class ConviteProximoPasso {
  readonly passo = input.required<ProximoPasso>();
}
