import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class DataTableComponent {
  // Recibe la información sin importar de dónde venga (componente agnóstico)[cite: 2]
  @Input() columns: string[] = [];
  @Input() dataset: any[] = [];

  // Emite eventos personalizados al componente padre[cite: 2]
  @Output() actionClicked = new EventEmitter<any>();

  onAction(row: any) {
    this.actionClicked.emit(row);
  }
}