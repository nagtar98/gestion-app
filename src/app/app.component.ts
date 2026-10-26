import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  statsChartOutline,
  statsChartSharp,
  logOutOutline,
  logOutSharp,
  documentTextOutline,
  documentTextSharp,
  helpCircleOutline,
  helpCircleSharp
} from 'ionicons/icons';

/**
 * @fileoverview Componente raíz de la aplicación híbrida/PWA (FASE 1 / RA 1).
 * Implementa la estructura global de navegación con SplitPane y Side Menu en Lazy Loading.
 * @module AppComponent
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet
  ]
})
export class AppComponent {
  /** Enlaces de navegación global accesibles desde el menú lateral */
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'stats-chart' },
    { title: 'Cerrar Sesión', url: '/login', icon: 'log-out' }
  ];

  constructor() {
    addIcons({
      statsChartOutline,
      statsChartSharp,
      logOutOutline,
      logOutSharp,
      documentTextOutline,
      documentTextSharp,
      helpCircleOutline,
      helpCircleSharp
    });
  }
}
