import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardPage } from './dashboard.page';
import { DataService } from '../core/services/data.service';
import { AuthService } from '../core/services/auth.service';
import { ExportService } from '../core/services/export.service';
import { SupabaseService } from '../core/services/supabase.service';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  const mockDataService = {
    getDashboardConsolidatedData: () => of({
      users: [],
      departmentMetrics: [],
      summary: { totalUsuarios: 0, usuariosActivos: 0, totalDepartamentos: 0, tasaActividad: 0 }
    }),
    filterUsers: () => [],
    updateUserStatus: () => of({})
  };

  const mockAuthService = {
    getCurrentUserRole: () => 'Administrador',
    isAdmin: () => true,
    logout: () => {},
    currentUserValue: { email: 'admin@empresa.com', nombre: 'Admin', rol: 'Administrador', token: 'mock' }
  };

  const mockExportService = {
    exportTableToPdf: () => {},
    exportTableToCsv: () => {}
  };

  const mockSupabaseService = {
    isConfigured: () => true,
    uploadAvatar: () => Promise.resolve('https://mock-url.com/avatar.png'),
    getBucketImageUrl: (f: string) => `https://mock-url.com/${f}`,
    getAvatarFallback: (n: string) => `https://fallback/${n}`
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ExportService, useValue: mockExportService },
        { provide: SupabaseService, useValue: mockSupabaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe instanciarse correctamente el componente DashboardPage', () => {
    expect(component).toBeTruthy();
  });

  it('debe reconocer los permisos de Administrador', () => {
    expect(component.isAdmin).toBe(true);
  });

  it('debe bloquear la apertura de modal de alta si el usuario no es Administrador', () => {
    component.isAdmin = false;
    component.openCreateModal();
    expect(component.isCreateModalOpen).toBe(false);
  });
});

