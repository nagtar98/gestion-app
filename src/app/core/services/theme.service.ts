import { Injectable, signal } from '@angular/core';

/**
 * Servicio para gestionar el cambio de tema (claro/oscuro) con persistencia en localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  /** Clave de persistencia para el almacenamiento local */
  private readonly THEME_STORAGE_KEY = 'gestion_app_theme';

  /** Señal reactiva que almacena si el modo oscuro está activo */
  public isDarkMode = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  /**
   * Inicializa el tema leyendo la preferencia guardada en localStorage
   * o respetando la configuración del sistema operativo/navegador.
   */
  private initTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_STORAGE_KEY);

    if (savedTheme !== null) {
      this.setDarkMode(savedTheme === 'dark');
    } else {
      // Detección automática de preferencia del sistema
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
    }

    // Escuchar cambios de preferencia del sistema si el usuario no ha forzado una manualmente
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(this.THEME_STORAGE_KEY)) {
          this.setDarkMode(e.matches);
        }
      });
    }
  }

  /**
   * Alterna entre modo claro y modo oscuro.
   */
  public toggleTheme(): void {
    this.setDarkMode(!this.isDarkMode());
  }

  /**
   * Aplica el estado del modo oscuro al DOM y persiste la preferencia.
   * @param dark true para activar modo oscuro, false para modo claro.
   */
  public setDarkMode(dark: boolean): void {
    this.isDarkMode.set(dark);
    localStorage.setItem(this.THEME_STORAGE_KEY, dark ? 'dark' : 'light');

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    if (dark) {
      htmlEl.classList.add('dark-theme');
      htmlEl.classList.add('ion-palette-dark');
      bodyEl.classList.add('dark-theme');
      htmlEl.style.colorScheme = 'dark';
    } else {
      htmlEl.classList.remove('dark-theme');
      htmlEl.classList.remove('ion-palette-dark');
      bodyEl.classList.remove('dark-theme');
      htmlEl.style.colorScheme = 'light';
    }
  }
}

