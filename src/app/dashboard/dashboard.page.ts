import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonBadge,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonButtons,
  IonModal,
  IonToast,
  IonItem,
  IonLabel,
  IonInput,
  IonText,
  IonNote,
  AlertController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  downloadOutline,
  documentTextOutline,
  helpCircleOutline,
  refreshOutline,
  filterOutline,
  peopleOutline,
  pieChartOutline,
  barChartOutline,
  closeOutline,
  logOutOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  shieldCheckmarkOutline,
  personAddOutline,
  cloudUploadOutline,
  eyeOutline,
  informationCircleOutline
} from 'ionicons/icons';

import { DataTableComponent } from '../components/data-table/data-table.component';
import { StatWidgetComponent } from '../components/stat-widget/stat-widget.component';
import { DataService } from '../core/services/data.service';
import { AuthService } from '../core/services/auth.service';
import { ExportService } from '../core/services/export.service';
import { SupabaseService } from '../core/services/supabase.service';
import { UserRecord, DepartmentMetric, MetricSummary } from '../core/models/user.model';
import { emailUniqueValidator } from '../core/validators/auth.validators';

/**
 * @fileoverview Controlador principal del Cuadro de Mando Empresarial (FASE 3 / RA 5).
 * Orquesta de forma asíncrona la concurrencia de fuentes duales (SQL y NoSQL en tiempo real o Supabase en la nube)
 * mediante RxJS forkJoin con soporte para Spinners de carga.
 * Implementa ChangeDetectionStrategy.OnPush, exportación a PDF y CSV, filtrado reactivo,
 * formulario reactivo de alta con validación asíncrona (FASE 1 / Paso 1.2),
 * renderizado de imágenes de perfil y manual de usuario embebido con cumplimiento integral WCAG (RA 4, RA 6).
 * @module Dashboard/DashboardPage
 */
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatWidgetComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonBadge,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonButtons,
    IonModal,
    IonToast,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
    IonNote
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private supabaseService = inject(SupabaseService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);

  /** Formulario reactivo para alta de nuevo usuario con validación asíncrona (Paso 1.2) */
  public createUserForm: FormGroup;

  /** Control de visibilidad del modal de alta de usuario */
  public isCreateModalOpen: boolean = false;

  /** Estado de envío del formulario de alta */
  public isSubmittingUser: boolean = false;

  /** Estado de subida de fotografía de perfil al bucket 'avatars' de Supabase */
  public isUploadingAvatar: boolean = false;

  /** Vista previa en base64 de la fotografía seleccionada */
  public avatarUploadPreview: string | null = null;

  /** Indicador global de carga asíncrona */
  public isLoading: boolean = true;

  /** Estado de exportación en progreso */
  public isExporting: boolean = false;

  /** Colección íntegra de usuarios obtenida de la fuente SQL o Supabase */
  public allUsers: UserRecord[] = [];

  /** Subconjunto de usuarios tras aplicar filtros en tiempo real */
  public filteredUsers: UserRecord[] = [];

  /** Métricas analíticas obtenidas del servicio NoSQL en tiempo real */
  public departmentMetrics: DepartmentMetric[] = [];

  /** Resumen consolidado de indicadores clave (KPIs) */
  public summary: MetricSummary = {
    totalUsuarios: 0,
    usuariosActivos: 0,
    totalDepartamentos: 0,
    tasaActividad: 0
  };

  /** Término reactivo de búsqueda textual */
  public searchTerm: string = '';

  /** Filtro de departamento activo */
  public selectedDepartment: string = 'TODOS';

  /** Lista disponible de departamentos para el selector */
  public departmentsList: string[] = ['TODOS'];

  /** Columnas técnicas a proyectar en el DataTableComponent (incluye imagen/avatar) */
  public tableColumns: string[] = ['avatar', 'nombre', 'email', 'rol', 'departamento', 'estado'];

  /** Mapeo de cabeceras legibles para accesibilidad y visualización */
  public columnLabels: Record<string, string> = {
    avatar: 'Foto',
    nombre: 'Nombre Completo',
    email: 'Correo Electrónico',
    rol: 'Rol de Acceso',
    departamento: 'Departamento',
    estado: 'Estado'
  };

  /** Etiquetas para el widget estadístico por departamentos */
  public chartLabels: string[] = [];

  /** Valores métricos para el widget estadístico por departamentos */
  public chartValues: number[] = [];

  /** Etiquetas para el widget estadístico de roles */
  public roleChartLabels: string[] = ['Administrador', 'Usuario Estándar'];

  /** Valores para el widget estadístico de roles */
  public roleChartValues: number[] = [0, 0];

  /** Control de visibilidad del modal de Ayuda / Manual de Usuario embebido */
  public isHelpModalOpen: boolean = false;

  /** Mensaje informativo desplegado en el ion-toast */
  public toastMessage: string = '';

  /** Control de apertura del ion-toast */
  public isToastOpen: boolean = false;

  /** Nombre del usuario activo */
  public currentUserName: string = 'Usuario';

  /** Rol del usuario activo */
  public currentUserRole: string = 'Usuario Estandar';

  /** Indicador booleano de permisos de administración */
  public isAdmin: boolean = false;

  /** Suscripción reactiva para gestión adecuada de memoria en ngOnDestroy */
  private dataSubscription: Subscription | null = null;

  constructor() {
    addIcons({
      downloadOutline,
      documentTextOutline,
      helpCircleOutline,
      refreshOutline,
      filterOutline,
      peopleOutline,
      pieChartOutline,
      barChartOutline,
      closeOutline,
      logOutOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      shieldCheckmarkOutline,
      personAddOutline,
      cloudUploadOutline,
      eyeOutline,
      informationCircleOutline
    });

    // Formulario reactivo con marcado declarativo y validación asíncrona de unicidad (FASE 1 / Paso 1.2)
    this.createUserForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: [
        '',
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [emailUniqueValidator(this.authService)],
          updateOn: 'change'
        }
      ],
      rol: ['Usuario Estandar', [Validators.required]],
      departamento: ['Desarrollo', [Validators.required]],
      estado: ['Activo', [Validators.required]],
      avatar: ['']
    });
  }

  /**
   * Inicialización del ciclo de vida. Recupera el contexto de autenticación y lanza la carga dual.
   */
  ngOnInit(): void {
    this.initUserContext();
    this.loadDashboardData();
  }

  /**
   * Limpieza de suscripciones para evitar memory leaks (RA 3).
   */
  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  /**
   * Carga los datos de usuario y permisos desde el AuthService.
   */
  private initUserContext(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.currentUserName = user.nombre;
      this.currentUserRole = user.rol;
      this.isAdmin = user.rol === 'Administrador';
    } else {
      this.currentUserRole = this.authService.getCurrentUserRole() || 'Usuario Estandar';
      this.isAdmin = this.authService.isAdmin();
      this.currentUserName = this.isAdmin ? 'Administrador' : 'Usuario Estándar';
    }
  }

  /**
   * Orquesta de forma asíncrona la recuperación concurrente de datos (SQL / Supabase + NoSQL).
   * Gestiona el estado de spinner (isLoading) y recalcula gráficos y filtros.
   */
  public loadDashboardData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }

    this.dataSubscription = this.dataService.getDashboardConsolidatedData().subscribe({
      next: (payload) => {
        this.allUsers = payload.users;
        this.departmentMetrics = payload.departmentMetrics;
        this.summary = payload.summary;

        // Extraer lista única de departamentos
        const depts = new Set(this.allUsers.map(u => u.departamento));
        this.departmentsList = ['TODOS', ...Array.from(depts)];

        // Actualizar subconjunto filtrado y gráficos
        this.applyFilters();

        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error al orquestar carga asíncrona del dashboard:', err);
        this.isLoading = false;
        this.showToast('Error de conexión al cargar datos consolidados.');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Aplica los filtros reactivos de búsqueda textual y departamento en tiempo real.
   */
  public applyFilters(): void {
    this.filteredUsers = this.dataService.filterUsers(
      this.allUsers,
      this.searchTerm,
      this.selectedDepartment
    );

    this.updateCharts();
    this.cdr.markForCheck();
  }

  /**
   * Manejador del evento de cambio en la barra de búsqueda accesible.
   * @param event Evento emitido por IonSearchbar.
   */
  public onSearchChange(event: any): void {
    this.searchTerm = event.detail?.value || '';
    this.applyFilters();
  }

  /**
   * Manejador del cambio de departamento en el selector.
   * @param event Evento emitido por IonSelect.
   */
  public onDepartmentChange(event: any): void {
    this.selectedDepartment = event.detail?.value || 'TODOS';
    this.applyFilters();
  }

  /**
   * Recalcula las distribuciones estadísticas proyectadas en los widgets visuales (Chart.js).
   */
  private updateCharts(): void {
    // 1. Distribución por departamentos (según datos filtrados o globales de NoSQL)
    const countsByDept: Record<string, number> = {};
    for (const user of this.filteredUsers) {
      countsByDept[user.departamento] = (countsByDept[user.departamento] || 0) + 1;
    }

    this.chartLabels = Object.keys(countsByDept);
    this.chartValues = Object.values(countsByDept);

    // Si el filtro no arroja resultados, usamos las métricas base NoSQL
    if (this.chartLabels.length === 0 && this.departmentMetrics.length > 0) {
      this.chartLabels = this.departmentMetrics.map(m => m.departamento);
      this.chartValues = this.departmentMetrics.map(m => m.cantidad);
    }

    // 2. Distribución por roles
    const adminCount = this.filteredUsers.filter(u => u.rol === 'Administrador').length;
    const userCount = this.filteredUsers.filter(u => u.rol === 'Usuario Estandar').length;
    this.roleChartLabels = ['Administrador', 'Usuario Estándar'];
    this.roleChartValues = [adminCount, userCount];
  }

  /**
   * Exporta la tabla tabulada a formato PDF profesional mediante ExportService (FASE 3).
   * Restringido a rol Administrador según la especificación.
   */
  public exportToPdf(): void {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede exportar informes.');
      return;
    }

    this.isExporting = true;
    this.cdr.markForCheck();

    try {
      const pdfColumns = ['nombre', 'email', 'rol', 'departamento', 'estado'];
      const pdfHeaders = ['Nombre Completo', 'Correo Electrónico', 'Rol de Acceso', 'Departamento', 'Estado'];

      this.exportService.exportTableToPdf({
        title: 'Informe Ejecutivo de Gestión de Usuarios',
        subtitle: `Filtro aplicado: ${this.selectedDepartment} | Total registros: ${this.filteredUsers.length}`,
        headers: pdfHeaders,
        dataKeys: pdfColumns,
        dataset: this.filteredUsers,
        filename: `informe_usuarios_${Date.now()}.pdf`,
        author: `${this.currentUserName} (${this.currentUserRole})`
      });
      this.showToast('Informe PDF generado y descargado exitosamente.');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      this.showToast('Ocurrió un error al generar el archivo PDF.');
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Exporta la tabla tabulada a formato CSV estándar con BOM UTF-8 mediante ExportService (FASE 3).
   * Restringido a rol Administrador.
   */
  public exportToCsv(): void {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede exportar informes.');
      return;
    }

    this.isExporting = true;
    this.cdr.markForCheck();

    try {
      const csvKeys = ['id', 'nombre', 'email', 'rol', 'departamento', 'estado', 'avatar'];
      const csvHeaders = ['ID', 'Nombre Completo', 'Correo Electrónico', 'Rol', 'Departamento', 'Estado', 'URL Foto'];

      this.exportService.exportTableToCsv(
        csvHeaders,
        csvKeys,
        this.filteredUsers,
        `informe_usuarios_${Date.now()}.csv`
      );
      this.showToast('Informe CSV generado y descargado exitosamente.');
    } catch (err) {
      console.error('Error al generar CSV:', err);
      this.showToast('Ocurrió un error al exportar el archivo CSV.');
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Atiende la emisión del evento @Output actionClicked procedente de DataTableComponent.
   * Despliega un diálogo accesible con la fotografía del usuario, detalle del registro y cambio de estado.
   * @param user Registro de usuario seleccionado.
   */
  public async handleRowAction(user: UserRecord): Promise<void> {
    const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=3880ff&color=fff`;

    // Botones accesibles: el usuario base SOLO ve 'Cerrar'. La opción de activar/desactivar es exclusiva del Administrador.
    const alertButtons: any[] = [
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ];

    if (this.isAdmin) {
      alertButtons.push({
        text: user.estado === 'Activo' ? 'Desactivar Usuario' : 'Activar Usuario',
        role: 'destructive',
        handler: () => {
          const nuevoEstado = user.estado === 'Activo' ? 'Inactivo' : 'Activo';
          this.toggleUserStatus(user.id, nuevoEstado);
        }
      });
    }

    const alert = await this.alertController.create({
      header: 'Ficha del Usuario',
      subHeader: `${user.nombre} (${user.rol})`,
      message: `
        <div style="text-align: center; margin: 10px 0;">
          <img src="${avatarUrl}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=3880ff&color=fff'" alt="Fotografía de ${user.nombre}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 3px solid #3880ff; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" />
        </div>
        <strong>ID:</strong> ${user.id}<br>
        <strong>Email:</strong> ${user.email}<br>
        <strong>Departamento:</strong> ${user.departamento}<br>
        <strong>Estado actual:</strong> ${user.estado}<br>
        <strong>Fecha de alta:</strong> ${user.fechaAlta}
      `,
      buttons: alertButtons
    });

    await alert.present();
  }

  /**
   * Conmuta el estado del usuario simulando una llamada de actualización contra la API relacional o Supabase.
   * Restringido exclusivamente al Administrador.
   * @param userId Identificador del usuario.
   * @param newStatus Nuevo estado a establecer.
   */
  private toggleUserStatus(userId: number, newStatus: 'Activo' | 'Inactivo'): void {
    if (!this.isAdmin) {
      this.showToast('Acción no permitida: Solo el Administrador puede modificar estados de usuario.');
      return;
    }

    this.dataService.updateUserStatus(userId, newStatus).subscribe({
      next: (updated) => {
        const index = this.allUsers.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.allUsers[index] = { ...this.allUsers[index], estado: newStatus };
          this.applyFilters();
          this.showToast(`Estado del usuario ${updated.nombre} actualizado a "${newStatus}".`);
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.showToast('No se pudo actualizar el estado del usuario.');
      }
    });
  }

  /**
   * Abre el modal de alta de nuevo registro de usuario.
   * Restringido exclusivamente al Administrador.
   */
  public openCreateModal(): void {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede registrar usuarios.');
      return;
    }

    this.avatarUploadPreview = null;
    this.createUserForm.reset({
      nombre: '',
      email: '',
      rol: 'Usuario Estandar',
      departamento: 'Desarrollo',
      estado: 'Activo',
      avatar: ''
    });
    this.isCreateModalOpen = true;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de alta de usuario.
   */
  public closeCreateModal(): void {
    this.isCreateModalOpen = false;
    this.avatarUploadPreview = null;
    this.cdr.markForCheck();
  }

  /**
   * Sube una fotografía seleccionada directamente al Storage Bucket 'avatars' de Supabase.
   * @param event Evento change del input de tipo file.
   */
  public async onAvatarFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Generar vista previa local en base64
    const reader = new FileReader();
    reader.onload = () => {
      this.avatarUploadPreview = reader.result as string;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    // Subir al Storage Bucket 'avatars' de Supabase si está activo
    if (this.supabaseService.isConfigured()) {
      this.isUploadingAvatar = true;
      this.cdr.markForCheck();
      try {
        const publicUrl = await this.supabaseService.uploadAvatar(file);
        this.createUserForm.patchValue({ avatar: publicUrl });
        this.showToast('Fotografía subida exitosamente al bucket "avatars" de Supabase.');
      } catch (err: any) {
        console.warn('Aviso al subir imagen a Supabase Storage:', err);
        this.showToast('Aviso: Verifique que el bucket "avatars" esté creado en Supabase.');
      } finally {
        this.isUploadingAvatar = false;
        this.cdr.markForCheck();
      }
    }
  }

  /**
   * Procesa la inserción del nuevo usuario validando el formulario reactivo.
   * Restringido exclusivamente al Administrador.
   */
  public onCreateUserSubmit(): void {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede dar de alta usuarios.');
      return;
    }

    if (this.createUserForm.invalid || this.isSubmittingUser) {
      this.createUserForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isSubmittingUser = true;
    this.cdr.markForCheck();

    const formVal = this.createUserForm.value;
    const newRecord: Omit<UserRecord, 'id'> = {
      nombre: formVal.nombre.trim(),
      email: formVal.email.trim().toLowerCase(),
      rol: formVal.rol,
      departamento: formVal.departamento,
      estado: formVal.estado,
      avatar: formVal.avatar?.trim() || `https://ui-avatars.com/api/?name=${encodeURIComponent(formVal.nombre)}&background=3880ff&color=fff`,
      fechaAlta: new Date().toISOString().split('T')[0]
    };

    this.dataService.createUser(newRecord).subscribe({
      next: (created) => {
        this.isSubmittingUser = false;
        this.closeCreateModal();
        this.showToast(`Usuario "${created.nombre}" creado exitosamente.`);
        this.loadDashboardData();
      },
      error: (err) => {
        console.error('Error al registrar usuario:', err);
        this.isSubmittingUser = false;
        this.showToast('Error al dar de alta el usuario.');
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Comprueba si la validación asíncrona de email está pendiente en el alta.
   */
  public get isNewEmailValidating(): boolean {
    const ctrl = this.createUserForm.get('email');
    return ctrl ? ctrl.pending : false;
  }

  /**
   * Abre el modal accesible con el Manual de Usuario contextual embebido (FASE 5 / RA 6).
   */
  public openHelpModal(): void {
    this.isHelpModalOpen = true;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de Ayuda / Manual de Usuario.
   */
  public closeHelpModal(): void {
    this.isHelpModalOpen = false;
    this.cdr.markForCheck();
  }

  /**
   * Cierra la sesión activa del usuario y navega a la vista de login.
   */
  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  /**
   * Despliega un mensaje flotante de notificación accesible en pantalla.
   * @param message Mensaje a comunicar.
   */
  private showToast(message: string): void {
    this.toastMessage = message;
    this.isToastOpen = true;
    this.cdr.markForCheck();
  }
}