import { Component, inject } from '@angular/core';
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
  helpCircleSharp,
  sunnyOutline,
  moonOutline
} from 'ionicons/icons';
import { ThemeService } from './core/services/theme.service';

/**
 * Componente principal de la aplicación.
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
  public themeService = inject(ThemeService);

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
      helpCircleSharp,
      sunnyOutline,
      moonOutline
    });
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
