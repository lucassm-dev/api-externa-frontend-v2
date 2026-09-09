import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideMinus,
  LucideTrendingDown,
  LucideTrendingUp,
  LucideTriangleAlert,
} from '@lucide/angular';

export type VarianteSelo = 'alta' | 'baixa' | 'estavel' | 'sucesso' | 'aviso' | 'erro';

@Component({
  selector: 'app-selo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LucideCircleCheck,
    LucideCircleX,
    LucideMinus,
    LucideTrendingDown,
    LucideTrendingUp,
    LucideTriangleAlert,
  ],
  templateUrl: './selo.html',
  styleUrl: './selo.scss',
})
export class Selo {
  readonly variante = input.required<VarianteSelo>();
  readonly texto = input.required<string>();
}
