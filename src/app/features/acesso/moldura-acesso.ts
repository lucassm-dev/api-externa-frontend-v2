import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Moldura compartilhada pelas duas tarefas de acesso, sem carregar regra de formulário. */
@Component({
  selector: 'app-moldura-acesso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './moldura-acesso.html',
  styleUrl: './moldura-acesso.scss',
})
export class MolduraAcesso {}
