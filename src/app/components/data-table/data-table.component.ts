import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonBadge } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, personOutline } from 'ionicons/icons';

/**
 * @fileoverview Componente genérico y agnóstico de tabla de datos avanzada (FASE 2 / RA 3).
 * Recibe datos mediante @Input unidireccionales y emite interacciones al padre mediante @Output.
 * Implementa ChangeDetectionStrategy.OnPush, renderizado accesible de imágenes de perfil y WAI-ARIA (RA 4).
 * @module Components/DataTableComponent
 */
@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, IonButton, IonIcon, IonBadge]
})
export class DataTableComponent {
  /** Claves de las columnas que se proyectarán en la tabla */
  @Input() columns: string[] = [];

  /** Colección de datos a representar */
  @Input() dataset: any[] = [];

  /** Diccionario de mapeo opcional para títulos legibles de columnas */
  @Input() columnLabels: Record<string, string> = {};

  /** Texto descriptivo de la tabla para software de asistencia y lectores de pantalla */
  @Input() tableCaption: string = 'Tabla de registros del sistema';

  /** Mensaje desplegado en caso de ausencia de registros */
  @Input() emptyMessage: string = 'No se encontraron registros que coincidan con la búsqueda.';

  /** Emisión de evento al hacer clic en una acción sobre una fila */
  @Output() actionClicked = new EventEmitter<any>();

  constructor() {
    addIcons({ eyeOutline, personOutline });
  }

  /**
   * Despacha el evento personalizado hacia el componente contenedor (padre).
   * @param row Registro de datos sobre el que se ejecuta la acción.
   */
  public onAction(row: any): void {
    this.actionClicked.emit(row);
  }

  /**
   * Resuelve el encabezado legible para una columna dada.
   * @param col Clave técnica de la columna.
   * @returns Nombre legible o clave capitalizada.
   */
  public getHeaderLabel(col: string): string {
    if (this.columnLabels && this.columnLabels[col]) {
      return this.columnLabels[col];
    }
    return col.charAt(0).toUpperCase() + col.slice(1);
  }

  /**
   * Identifica si la columna corresponde a una fotografía o avatar.
   * @param col Clave de la columna.
   */
  public isAvatarColumn(col: string): boolean {
    const key = col.toLowerCase();
    return key === 'avatar' || key === 'foto' || key === 'avatar_url' || key === 'imagen';
  }

  /**
   * Identifica si un valor corresponde a un estado que deba estilizarse con badge.
   * @param col Clave de la columna.
   */
  public isStatusColumn(col: string): boolean {
    return col.toLowerCase() === 'estado';
  }

  /**
   * Identifica si un valor corresponde al rol del usuario.
   * @param col Clave de la columna.
   */
  public isRoleColumn(col: string): boolean {
    return col.toLowerCase() === 'rol';
  }

  /**
   * Genera un avatar accesible por iniciales si la imagen remota no está disponible o falla.
   * @param name Nombre del usuario.
   */
  public getFallbackAvatar(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=3880ff&color=fff&size=128`;
  }

  /**
   * Maneja el error de carga de imagen asignando automáticamente el avatar de iniciales accesible.
   * @param event Evento de error emitido por el tag img.
   * @param name Nombre del usuario para iniciales.
   */
  public onAvatarError(event: Event, name: string): void {
    const target = event.target as HTMLImageElement;
    if (target && !target.src.includes('ui-avatars.com')) {
      target.src = this.getFallbackAvatar(name);
    }
  }
}