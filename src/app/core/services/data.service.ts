import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, from, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { DashboardDataPayload, DepartmentMetric, MetricSummary, UserRecord } from '../models/user.model';
import { SupabaseService } from './supabase.service';

/**
 * Configuración para conexión con backend Supabase (si está configurado).
 */
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Servicio de datos que gestiona los usuarios y las métricas del dashboard,
 * conectando con Supabase o usando datos locales como fallback.
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private supabaseService = inject(SupabaseService);

  /**
   * Lista local de usuarios con avatares.
   */
  private mockSqlUsers: UserRecord[] = [
    {
      id: 1,
      nombre: 'Ana García',
      email: 'ana@empresa.com',
      rol: 'Administrador',
      departamento: 'Desarrollo',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_1.png',
      fechaAlta: '2023-01-15'
    },
    {
      id: 2,
      nombre: 'Luis Pérez',
      email: 'luis@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Soporte',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_2.png',
      fechaAlta: '2023-03-22'
    },
    {
      id: 3,
      nombre: 'Carlos Ruiz',
      email: 'carlos@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Ventas',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_3.png',
      fechaAlta: '2023-05-10'
    },
    {
      id: 4,
      nombre: 'Elena Moreno',
      email: 'elena@empresa.com',
      rol: 'Administrador',
      departamento: 'Finanzas',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_4.png',
      fechaAlta: '2023-07-18'
    },
    {
      id: 5,
      nombre: 'Javier Domínguez',
      email: 'javier@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Desarrollo',
      estado: 'Inactivo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_5.png',
      fechaAlta: '2023-09-01'
    },
    {
      id: 6,
      nombre: 'Marta Soler',
      email: 'marta@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Marketing',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_6.png',
      fechaAlta: '2023-11-04'
    },
    {
      id: 7,
      nombre: 'Sergio Morales',
      email: 'sergio@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Ventas',
      estado: 'Activo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_7.png',
      fechaAlta: '2024-01-12'
    },
    {
      id: 8,
      nombre: 'Patricia Romero',
      email: 'patricia@empresa.com',
      rol: 'Administrador',
      departamento: 'Soporte',
      estado: 'Inactivo',
      avatar: 'https://nembeporhkhneggqrtli.supabase.co/storage/v1/object/public/avatars/avatar_8.png',
      fechaAlta: '2024-02-28'
    }
  ];

  /**
   * Dataset representativo de la fuente NoSQL / Firestore / Documental en tiempo real.
   */
  private mockNoSqlDepartmentMetrics: DepartmentMetric[] = [
    { departamento: 'Ventas', cantidad: 35 },
    { departamento: 'Soporte', cantidad: 25 },
    { departamento: 'Desarrollo', cantidad: 30 },
    { departamento: 'Marketing', cantidad: 18 },
    { departamento: 'Finanzas', cantidad: 12 }
  ];

  constructor() {}

  /**
   * Consume la fuente relacional (SQL REST API o Supabase si está enlazado).
   * Si Supabase está configurado, consume la tabla real de la nube; en caso contrario,
   * sirve el mock con imágenes con un retardo realista de 800ms.
   * @returns Observable con el listado de usuarios con imágenes.
   */
  public getUsersFromRelationalDb(): Observable<UserRecord[]> {
    if (this.supabaseService.isConfigured()) {
      return from(this.supabaseService.getUsers()).pipe(
        catchError(err => {
          console.warn('Fallo al conectar con Supabase en la nube, activando fallback local:', err);
          return of(JSON.parse(JSON.stringify(this.mockSqlUsers)) as UserRecord[]);
        })
      );
    }

    // Retardo asíncrono realista (800ms) simulando conexión a base de datos remota
    const clonedData = JSON.parse(JSON.stringify(this.mockSqlUsers)) as UserRecord[];
    return of(clonedData).pipe(delay(800));
  }

  /**
   * Consume de forma asíncrona la fuente NoSQL / tiempo real (colección documental).
   * @returns Observable con las métricas departamentales.
   */
  public getDepartmentMetricsFromNoSql(): Observable<DepartmentMetric[]> {
    const clonedMetrics = JSON.parse(JSON.stringify(this.mockNoSqlDepartmentMetrics)) as DepartmentMetric[];
    
    // Retardo asíncrono realista (600ms)
    return of(clonedMetrics).pipe(
      delay(600),
      catchError(error => {
        console.error('Error al consumir servicio NoSQL en tiempo real:', error);
        return throwError(() => new Error('Error al conectar con el servicio NoSQL documental.'));
      })
    );
  }

  /**
   * Orquestación asíncrona avanzada y concurrente mediante RxJS `forkJoin`.
   * Ejecuta en paralelo el consumo de la fuente SQL y la fuente NoSQL sin bloquear
   * el hilo principal, consolidando la información y calculando KPIs analíticos.
   * @returns Observable con el payload integrado del Cuadro de Mando.
   */
  public getDashboardConsolidatedData(): Observable<DashboardDataPayload> {
    return forkJoin({
      users: this.getUsersFromRelationalDb(),
      metrics: this.getDepartmentMetricsFromNoSql()
    }).pipe(
      map(({ users, metrics }) => {
        // Cálculo reactivo de KPIs consolidados
        const total = users.length;
        const activos = users.filter(u => u.estado === 'Activo').length;
        const departamentosUnicos = new Set(users.map(u => u.departamento)).size;
        const tasaActividad = total > 0 ? Math.round((activos / total) * 100) : 0;

        const summary: MetricSummary = {
          totalUsuarios: total,
          usuariosActivos: activos,
          totalDepartamentos: departamentosUnicos,
          tasaActividad: tasaActividad
        };

        return {
          users: users,
          departmentMetrics: metrics,
          summary: summary
        };
      })
    );
  }

  /**
   * Permite filtrar en tiempo real los registros por término de búsqueda y departamento.
   * @param source Lista de origen de usuarios.
   * @param query Término a buscar en nombre o correo.
   * @param department Filtro opcional por departamento específico.
   * @returns Registros coincidentes.
   */
  public filterUsers(source: UserRecord[], query: string, department?: string): UserRecord[] {
    const cleanQuery = (query || '').toLowerCase().trim();
    return source.filter(u => {
      const matchQuery = !cleanQuery || 
        u.nombre.toLowerCase().includes(cleanQuery) || 
        u.email.toLowerCase().includes(cleanQuery) || 
        u.rol.toLowerCase().includes(cleanQuery);
      
      const matchDept = !department || department === 'TODOS' || u.departamento === department;
      return matchQuery && matchDept;
    });
  }

  /**
   * Actualiza el estado de un usuario simulando una transacción SQL o sincronizando con Supabase.
   * @param id Identificador único del usuario.
   * @param nuevoEstado 'Activo' | 'Inactivo'.
   * @returns Observable con el usuario actualizado.
   */
  public updateUserStatus(id: number, nuevoEstado: 'Activo' | 'Inactivo'): Observable<UserRecord> {
    const target = this.mockSqlUsers.find(u => u.id === id);
    if (!target) {
      return throwError(() => new Error(`Usuario con ID ${id} no encontrado.`));
    }
    target.estado = nuevoEstado;

    if (this.supabaseService.isConfigured()) {
      return from(this.supabaseService.updateUserStatus(id, nuevoEstado)).pipe(
        map(() => ({ ...target })),
        catchError(() => of({ ...target }))
      );
    }

    return of({ ...target }).pipe(delay(300));
  }

  /**
   * Crea un nuevo usuario en Supabase o en la lista local.
   * @param newUser Datos del usuario a dar de alta.
   * @returns Observable con el usuario insertado.
   */
  public createUser(newUser: Omit<UserRecord, 'id'>): Observable<UserRecord> {
    if (this.supabaseService.isConfigured()) {
      return from(this.supabaseService.createUser(newUser)).pipe(
        catchError(err => {
          console.warn('Fallo al dar de alta en Supabase, registrando en memoria local:', err);
          const nextId = Math.max(...this.mockSqlUsers.map(u => u.id), 0) + 1;
          const localRecord: UserRecord = { id: nextId, ...newUser };
          this.mockSqlUsers.push(localRecord);
          return of(localRecord);
        })
      );
    }

    const nextId = Math.max(...this.mockSqlUsers.map(u => u.id), 0) + 1;
    const localRecord: UserRecord = { id: nextId, ...newUser };
    this.mockSqlUsers.push(localRecord);
    return of(localRecord).pipe(delay(400));
  }

  /**
   * Elimina un usuario por su identificador único (Solo disponible para Administrador).
   * @param id Identificador único del usuario.
   * @returns Observable booleano indicando éxito.
   */
  public deleteUser(id: number): Observable<boolean> {
    if (this.supabaseService.isConfigured()) {
      return from(this.supabaseService.deleteUser(id)).pipe(
        map(() => {
          const idx = this.mockSqlUsers.findIndex(u => u.id === id);
          if (idx !== -1) {
            this.mockSqlUsers.splice(idx, 1);
          }
          return true;
        })
      );
    }

    const idx = this.mockSqlUsers.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.mockSqlUsers.splice(idx, 1);
    }
    return of(true).pipe(delay(300));
  }
}
