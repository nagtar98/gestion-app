import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, IonBadge } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eyeOutline, personOutline, trashOutline } from 'ionicons/icons';

/**
 * Componente reutilizable de tabla para mostrar datos tabulares.
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
  @Input() columns: string[] = [];
  @Input() dataset: any[] = [];
  @Input() columnLabels: Record<string, string> = {};
  @Input() tableCaption: string = 'Tabla de registros del sistema';
  @Input() emptyMessage: string = 'No se encontraron registros que coincidan con la búsqueda.';
  @Input() isAdmin: boolean = false;

  @Output() actionClicked = new EventEmitter<any>();
  @Output() deleteClicked = new EventEmitter<any>();

  constructor() {
    addIcons({ eyeOutline, personOutline, trashOutline });
  }

  /**
   * Despacha el evento personalizado hacia el componente contenedor (padre).
   * @param row Registro de datos sobre el que se ejecuta la acción.
   */
  public onAction(row: any): void {
    this.actionClicked.emit(row);
  }

  /**
   * Despacha el evento de eliminación de registro hacia el padre (solo Administrador).
   * @param row Registro de datos a eliminar.
   */
  public onDelete(row: any): void {
    this.deleteClicked.emit(row);
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

  /** URL oficial del avatar predeterminado alojado en el bucket 'avatars' de Supabase */
  public readonly DEFAULT_AVATAR =
    'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/user-icon-person-icon-client-symbol-profile-icon-vector.jpg';

  /**
   * Retorna el avatar predeterminado del sistema desde Supabase Storage.
   * @param name Nombre opcional del usuario.
   */
  public getFallbackAvatar(name?: string): string {
    return this.DEFAULT_AVATAR;
  }

  /**
   * Maneja el error de carga de imagen asignando automáticamente el avatar predeterminado de Supabase.
   * @param event Evento de error emitido por el tag img.
   * @param name Nombre del usuario.
   */
  public onAvatarError(event: Event, name?: string): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.DEFAULT_AVATAR) {
      target.src = this.DEFAULT_AVATAR;
    }
  }
}