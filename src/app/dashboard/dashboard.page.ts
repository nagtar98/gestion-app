import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol,IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular';
import { DataTableComponent } from '../components/data-table/data-table.component';
// 1. Importamos el nuevo widget
import { StatWidgetComponent } from '../components/stat-widget/stat-widget.component'; 

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, 
    CommonModule, DataTableComponent, StatWidgetComponent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent
  ]
})
export class DashboardPage implements OnInit {
  
  // Datos para la tabla
  tableColumns = ['id', 'nombre', 'rol'];
  tableData = [
    { id: 1, nombre: 'Ana García', rol: 'Administrador' },
    { id: 2, nombre: 'Luis Pérez', rol: 'Usuario Estándar' },
    { id: 3, nombre: 'Carlos Ruiz', rol: 'Usuario Estándar' }
  ];

  // Datos para los gráficos
  chartLabels = ['Ventas', 'Soporte', 'Desarrollo'];
  chartValues = [45, 25, 30];

  constructor() { }

  ngOnInit() {}

  handleRowAction(row: any) {
    console.log('Acción sobre:', row);
  }
}