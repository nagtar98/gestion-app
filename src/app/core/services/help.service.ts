import { Injectable, signal } from '@angular/core';

/**
 * Servicio para controlar la apertura y cierre del modal de guía de usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class HelpService {
  /** Señal reactiva que indica si el modal de ayuda está abierto */
  public isHelpModalOpen = signal<boolean>(false);

  /**
   * Abre el modal de guía de usuario.
   */
  public openHelp(): void {
    this.isHelpModalOpen.set(true);
  }

  /**
   * Cierra el modal de guía de usuario.
   */
  public closeHelp(): void {
    this.isHelpModalOpen.set(false);
  }
}

