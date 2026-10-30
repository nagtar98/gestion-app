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
  IonProgressBar,
  IonChip,
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
  informationCircleOutline,
  sunnyOutline,
  moonOutline,
  gridOutline,
  listOutline,
  pulseOutline,
  serverOutline,
  copyOutline,
  sparklesOutline,
  businessOutline,
  timeOutline,
  trashOutline
} from 'ionicons/icons';

import { DataTableComponent } from '../components/data-table/data-table.component';
import { StatWidgetComponent } from '../components/stat-widget/stat-widget.component';
import { DataService } from '../core/services/data.service';
import { AuthService } from '../core/services/auth.service';
import { ExportService } from '../core/services/export.service';
import { SupabaseService } from '../core/services/supabase.service';
import { ThemeService } from '../core/services/theme.service';
import { HelpService } from '../core/services/help.service';
import { UserRecord, DepartmentMetric, MetricSummary } from '../core/models/user.model';
import { emailUniqueValidator } from '../core/validators/auth.validators';

/**
 * Página principal del panel de gestión con visualización de métricas y listado de usuarios.
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
    IonLabel,
    IonInput,
    IonText,
    IonNote,
    IonProgressBar,
    IonChip
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  private dataService = inject(DataService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private supabaseService = inject(SupabaseService);
  public helpService = inject(HelpService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);

  public createUserForm: FormGroup;
  public isCreateModalOpen: boolean = false;
  public isSubmittingUser: boolean = false;

  /** Estado de subida de fotografía de perfil al bucket 'avatars' de Supabase */
  public isUploadingAvatar: boolean = false;

  /** Vista previa en base64 de la fotografía seleccionada */
  public avatarUploadPreview: string | null = null;

  /** URL oficial del avatar predeterminado alojado en el bucket 'avatars' de Supabase */
  public readonly DEFAULT_AVATAR_URL =
    'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/user-icon-person-icon-client-symbol-profile-icon-vector.jpg';

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

  /** Control de visibilidad del modal de Ayuda / Guía de usuario */
  public get isHelpModalOpen(): boolean {
    return this.helpService.isHelpModalOpen();
  }
  public set isHelpModalOpen(val: boolean) {
    this.helpService.isHelpModalOpen.set(val);
  }

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

  /** Servicio reactivo para conmutación de tema Claro / Oscuro */
  public themeService = inject(ThemeService);

  /** Modo de visualización de datos: 'table' (Tabla analítica) | 'grid' (Cuadrícula de tarjetas de perfil) */
  public viewMode: 'table' | 'grid' = 'table';

  /** Filtro rápido por estado operativo: 'TODOS' | 'Activo' | 'Inactivo' */
  public statusFilter: 'TODOS' | 'Activo' | 'Inactivo' = 'TODOS';

  /** Usuario actualmente seleccionado para visualización detallada en modal */
  public selectedUserForDetail: UserRecord | null = null;

  /** Estado de visibilidad del modal de ficha detallada */
  public isDetailModalOpen: boolean = false;

  public systemHealth = {
    status: 'Operativo',
    latency: 38,
    backend: 'PostgreSQL (Supabase)',
    storage: 'Bucket avatars',
    rls: 'Activo'
  };

  public activityLog: { id: number; title: string; desc: string; time: string; icon: string; color: string }[] = [
    {
      id: 1,
      title: 'Base de datos',
      desc: 'Conexión con Supabase establecida',
      time: 'Hace un momento',
      icon: 'server-outline',
      color: 'success'
    },
    {
      id: 2,
      title: 'Almacenamiento',
      desc: 'Bucket de avatares disponible',
      time: 'Hace 2 min',
      icon: 'cloud-upload-outline',
      color: 'primary'
    },
    {
      id: 3,
      title: 'Inicio de sesión',
      desc: 'Acceso correcto al sistema',
      time: 'Hace 5 min',
      icon: 'shield-checkmark-outline',
      color: 'warning'
    }
  ];

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
      informationCircleOutline,
      sunnyOutline,
      moonOutline,
      gridOutline,
      listOutline,
      pulseOutline,
      serverOutline,
      copyOutline,
      sparklesOutline,
      businessOutline,
      timeOutline,
      trashOutline
    });

    // Formulario de alta de usuario
    this.createUserForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      email: [
        '',
        {
          validators: [
            Validators.required,
            Validators.email,
            Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
          ],
          asyncValidators: [emailUniqueValidator(this.authService)],
          updateOn: 'change'
        }
      ],
      rol: ['Usuario Estandar', [Validators.required]],
      departamento: ['Desarrollo', [Validators.required]],
      estado: ['Activo', [Validators.required]],
      avatar: [this.DEFAULT_AVATAR_URL]
    });
  }

  ngOnInit(): void {
    this.initUserContext();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
      this.dataSubscription = null;
    }
  }

  /**
   * Carga los datos de usuario y permisos.
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
   * Carga los datos del panel (usuarios y estadísticas).
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
   * Conteo reactivo de usuarios activos en el dataset completo.
   */
  public get activeUsersCount(): number {
    return this.allUsers.filter(u => u.estado === 'Activo').length;
  }

  /**
   * Conteo reactivo de usuarios inactivos en el dataset completo.
   */
  public get inactiveUsersCount(): number {
    return this.allUsers.filter(u => u.estado === 'Inactivo').length;
  }

  /**
   * Conmuta el tema visual entre Claro y Oscuro.
   */
  public toggleTheme(): void {
    this.themeService.toggleTheme();
    const isDark = this.themeService.isDarkMode();
    this.showToast(isDark ? 'Modo Oscuro activado.' : 'Modo Claro activado.');
    this.cdr.markForCheck();
  }

  /**
   * Cambia el modo de visualización entre tabla analítica y cuadrícula de tarjetas.
   * @param mode 'table' | 'grid'.
   */
  public setViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
    this.cdr.markForCheck();
  }

  /**
   * Aplica un filtro rápido por estado del usuario.
   * @param status 'TODOS' | 'Activo' | 'Inactivo'.
   */
  public setStatusFilter(status: 'TODOS' | 'Activo' | 'Inactivo'): void {
    this.statusFilter = status;
    this.applyFilters();
  }

  /**
   * Abre el modal interactivo con la ficha detallada de un usuario.
   * @param user Registro de usuario a visualizar.
   */
  public openUserDetailModal(user: UserRecord): void {
    this.selectedUserForDetail = user;
    this.isDetailModalOpen = true;
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de detalle del usuario.
   */
  public closeUserDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedUserForDetail = null;
    this.cdr.markForCheck();
  }

  /**
   * Copia un texto al portapapeles y despliega notificación.
   * @param text Texto a copiar.
   */
  public copyToClipboard(text: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      this.showToast(`Copiado al portapapeles: ${text}`);
    }
  }

  /**
   * Registra un nuevo evento en el feed de auditoría en tiempo real.
   */
  public addActivity(title: string, desc: string, icon: string, color: string): void {
    const newEntry = {
      id: Date.now(),
      title,
      desc,
      time: 'Justo ahora',
      icon,
      color
    };
    this.activityLog = [newEntry, ...this.activityLog.slice(0, 4)];
    this.cdr.markForCheck();
  }

  /**
   * Aplica los filtros reactivos de búsqueda textual, departamento y estado en tiempo real.
   */
  public applyFilters(): void {
    let result = this.dataService.filterUsers(
      this.allUsers,
      this.searchTerm,
      this.selectedDepartment
    );

    if (this.statusFilter !== 'TODOS') {
      result = result.filter(u => u.estado === this.statusFilter);
    }

    this.filteredUsers = result;
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
    // 1. Distribución por departamentos
    if (this.selectedDepartment === 'TODOS' && !this.searchTerm.trim() && this.departmentMetrics.length > 0) {
      this.chartLabels = this.departmentMetrics.map(m => m.departamento);
      this.chartValues = this.departmentMetrics.map(m => m.cantidad);
    } else {
      const countsByDept: Record<string, number> = {};
      for (const user of this.filteredUsers) {
        countsByDept[user.departamento] = (countsByDept[user.departamento] || 0) + 1;
      }

      this.chartLabels = Object.keys(countsByDept);
      this.chartValues = Object.values(countsByDept);

      if (this.chartLabels.length === 0 && this.departmentMetrics.length > 0) {
        this.chartLabels = this.departmentMetrics.map(m => m.departamento);
        this.chartValues = this.departmentMetrics.map(m => m.cantidad);
      }
    }

    // 2. Distribución por roles
    const adminCount = this.filteredUsers.filter(u => u.rol === 'Administrador').length;
    const userCount = this.filteredUsers.filter(u => u.rol === 'Usuario Estandar').length;
    this.roleChartLabels = ['Administrador', 'Usuario Estándar'];
    this.roleChartValues = [adminCount, userCount];
  }

  /**
   * Exporta la tabla a formato PDF (solo Administrador).
   */
  public async exportToPdf(): Promise<void> {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede exportar informes.');
      return;
    }

    this.isExporting = true;
    this.cdr.markForCheck();

    try {
      const pdfColumns = ['nombre', 'email', 'rol', 'departamento', 'estado'];
      const pdfHeaders = ['Nombre Completo', 'Correo Electrónico', 'Rol de Acceso', 'Departamento', 'Estado'];

      await this.exportService.exportTableToPdf({
        title: 'Listado de Usuarios',
        subtitle: `Filtro aplicado: ${this.selectedDepartment} | Total registros: ${this.filteredUsers.length}`,
        headers: pdfHeaders,
        dataKeys: pdfColumns,
        dataset: this.filteredUsers,
        filename: `usuarios_${Date.now()}.pdf`,
        author: `${this.currentUserName} (${this.currentUserRole})`,
        summary: this.summary
      });
      this.addActivity('Informe PDF', 'Descarga de listado en PDF', 'document-text-outline', 'danger');
      this.showToast('Informe PDF descargado.');
    } catch (err) {
      console.error('Error al generar PDF:', err);
      this.showToast('Ocurrió un error al generar el archivo PDF.');
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Exporta la tabla a formato CSV (solo Administrador).
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
        `usuarios_${Date.now()}.csv`,
        `${this.currentUserName} (${this.currentUserRole})`
      );
      this.addActivity('Informe CSV', 'Descarga de datos en CSV', 'download-outline', 'success');
      this.showToast('Informe CSV descargado.');
    } catch (err) {
      console.error('Error al generar CSV:', err);
      this.showToast('Ocurrió un error al exportar el archivo CSV.');
    } finally {
      this.isExporting = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Atiende la emisión del evento @Output actionClicked procedente de DataTableComponent o tarjetas.
   * Abre la ficha modal detallada e interactiva del usuario con su foto en alta resolución.
   * @param user Registro de usuario seleccionado.
   */
  public handleRowAction(user: UserRecord): void {
    this.openUserDetailModal(user);
  }

  /**
   * Conmuta el estado del usuario simulando una llamada de actualización contra la API relacional o Supabase.
   * Restringido exclusivamente al Administrador.
   * @param userId Identificador del usuario.
   * @param newStatus Nuevo estado a establecer.
   */
  public toggleUserStatus(userId: number, newStatus: 'Activo' | 'Inactivo'): void {
    if (!this.isAdmin) {
      this.showToast('Acción no permitida: Solo el Administrador puede modificar estados de usuario.');
      return;
    }

    this.dataService.updateUserStatus(userId, newStatus).subscribe({
      next: (updated) => {
        const index = this.allUsers.findIndex(u => u.id === userId);
        if (index !== -1) {
          this.allUsers[index] = { ...this.allUsers[index], estado: newStatus };
          if (this.selectedUserForDetail && this.selectedUserForDetail.id === userId) {
            this.selectedUserForDetail = { ...this.selectedUserForDetail, estado: newStatus };
          }
          this.applyFilters();
          this.addActivity(
            'Estado Actualizado',
            `Usuario ${updated.nombre} cambiado a "${newStatus}"`,
            'checkmark-circle-outline',
            newStatus === 'Activo' ? 'success' : 'medium'
          );
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
   * Muestra un diálogo de confirmación accesible antes de proceder a la eliminación física del usuario.
   * Exclusivo para Administrador.
   * @param user Registro de usuario a eliminar.
   */
  public async promptDeleteUser(user: UserRecord): Promise<void> {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede eliminar usuarios.');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      subHeader: `¿Desea eliminar a "${user.nombre}"?`,
      message: 'Esta acción eliminará permanentemente el registro de la base de datos de Supabase. Esta operación no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Eliminar Registro',
          role: 'destructive',
          handler: () => {
            this.confirmDeleteUser(user);
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Ejecuta la eliminación física del usuario tras la confirmación afirmativa del diálogo.
   * @param user Registro de usuario a eliminar.
   */
  public confirmDeleteUser(user: UserRecord): void {
    if (!this.isAdmin) {
      this.showToast('Acción restringida: Solo el Administrador puede eliminar usuarios.');
      return;
    }

    this.dataService.deleteUser(user.id).subscribe({
      next: () => {
        if (this.selectedUserForDetail && this.selectedUserForDetail.id === user.id) {
          this.closeUserDetailModal();
        }

        this.allUsers = this.allUsers.filter(u => u.id !== user.id);
        this.applyFilters();

        this.addActivity(
          'Usuario Eliminado',
          `Se eliminó permanentemente el registro de ${user.nombre} (${user.email})`,
          'trash-outline',
          'danger'
        );

        this.showToast(`Usuario "${user.nombre}" eliminado correctamente.`);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error al eliminar usuario:', err);
        const detail = err?.message || 'Error de permisos o políticas RLS en Supabase.';
        this.showToast(`Error al eliminar en Supabase: ${detail}`);
        this.cdr.markForCheck();
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
      avatar: this.DEFAULT_AVATAR_URL
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
        this.createUserForm.get('avatar')?.markAsDirty();
        this.createUserForm.get('avatar')?.updateValueAndValidity();
        this.showToast('Fotografía subida exitosamente al bucket "avatars" de Supabase.');
      } catch (err: any) {
        console.warn('Aviso al subir imagen a Supabase Storage:', err);
        this.avatarUploadPreview = null;
        this.createUserForm.patchValue({ avatar: this.DEFAULT_AVATAR_URL });
        this.createUserForm.get('avatar')?.markAsDirty();
        this.createUserForm.get('avatar')?.updateValueAndValidity();
        input.value = '';
        const detail = err?.message || 'Error de permisos o políticas RLS en Supabase.';
        this.showToast(`Error al subir imagen a Supabase: ${detail}`);
      } finally {
        this.isUploadingAvatar = false;
        this.cdr.markForCheck();
      }
    } else {
      // Entorno sin Supabase: fallback simulado para desarrollo local
      this.createUserForm.patchValue({ avatar: this.avatarUploadPreview });
      this.createUserForm.get('avatar')?.markAsDirty();
      this.createUserForm.get('avatar')?.updateValueAndValidity();
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
      avatar: (formVal.avatar && formVal.avatar.trim() !== '') ? formVal.avatar.trim() : this.DEFAULT_AVATAR_URL,
      fechaAlta: new Date().toISOString().split('T')[0]
    };

    this.dataService.createUser(newRecord).subscribe({
      next: (created) => {
        this.isSubmittingUser = false;
        this.closeCreateModal();
        this.addActivity(
          'Nuevo Usuario Registrado',
          `Se registró a ${created.nombre} (${created.departamento}) con foto en Supabase`,
          'person-add-outline',
          'success'
        );
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
   * Manejador de error de carga para reemplazar imágenes fallidas por el avatar predeterminado de Supabase.
   */
  public onAvatarFallbackError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== this.DEFAULT_AVATAR_URL) {
      target.src = this.DEFAULT_AVATAR_URL;
    }
  }

  /**
   * Comprueba si la validación asíncrona de email está pendiente en el alta.
   */
  public get isNewEmailValidating(): boolean {
    const ctrl = this.createUserForm.get('email');
    return ctrl ? ctrl.pending : false;
  }

  /**
   * Abre el modal de ayuda con la guía de usuario.
   */
  public openHelpModal(): void {
    this.helpService.openHelp();
    this.cdr.markForCheck();
  }

  /**
   * Cierra el modal de Ayuda / Manual de Usuario.
   */
  public closeHelpModal(): void {
    this.helpService.closeHelp();
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