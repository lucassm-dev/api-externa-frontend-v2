import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PainelFeedback } from './core/feedback/painel-feedback';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, PainelFeedback],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
