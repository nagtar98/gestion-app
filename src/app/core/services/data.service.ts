import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { DashboardDataPayload, DepartmentMetric, MetricSummary, UserRecord } from '../models/user.model';

/**
 * Configuración para conexión con backend Supabase (si está configurado).
 */
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * @fileoverview Servicio de concurrencia y orquestación asíncrona de orígenes de datos.
 * Simula el consumo dual de fuentes exigido en la FASE 3 (RA 5):
 * 1. API REST basada en base de datos relacional (SQL) para entidades tabulares.
 * 2. Servicio NoSQL / en tiempo real documental para métricas de cuadro de mando.
 * Dispone además de arquitectura extensible preparada para cliente Supabase.
 * @module Core/Services/DataService
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  /** Configuración opcional para cliente Supabase */
  private supabaseConfig: SupabaseConfig = {
    supabaseUrl: 'https://xyzcompany.supabase.co',
    supabaseAnonKey: 'public-anon-key-simulated-token'
  };

  /**
   * Dataset representativo de la fuente Relacional (SQL).
   * Esquema normalizado de usuarios empresariales.
   */
  private mockSqlUsers: UserRecord[] = [
    {
      id: 1,
      nombre: 'Ana García',
      email: 'ana@empresa.com',
      rol: 'Administrador',
      departamento: 'Desarrollo',
      estado: 'Activo',
      fechaAlta: '2023-01-15'
    },
    {
      id: 2,
      nombre: 'Luis Pérez',
      email: 'luis@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Soporte',
      estado: 'Activo',
      fechaAlta: '2023-03-22'
    },
    {
      id: 3,
      nombre: 'Carlos Ruiz',
      email: 'carlos@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Ventas',
      estado: 'Activo',
      fechaAlta: '2023-05-10'
    },
    {
      id: 4,
      nombre: 'Elena Moreno',
      email: 'elena@empresa.com',
      rol: 'Administrador',
      departamento: 'Finanzas',
      estado: 'Activo',
      fechaAlta: '2023-07-18'
    },
    {
      id: 5,
      nombre: 'Javier Domínguez',
      email: 'javier@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Desarrollo',
      estado: 'Inactivo',
      fechaAlta: '2023-09-01'
    },
    {
      id: 6,
      nombre: 'Marta Soler',
      email: 'marta@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Marketing',
      estado: 'Activo',
      fechaAlta: '2023-11-04'
    },
    {
      id: 7,
      nombre: 'Sergio Morales',
      email: 'sergio@empresa.com',
      rol: 'Usuario Estandar',
      departamento: 'Ventas',
      estado: 'Activo',
      fechaAlta: '2024-01-12'
    },
    {
      id: 8,
      nombre: 'Patricia Romero',
      email: 'patricia@empresa.com',
      rol: 'Administrador',
      departamento: 'Soporte',
      estado: 'Inactivo',
      fechaAlta: '2024-02-28'
    }
  ];

  /**
   * Dataset representativo de la fuente NoSQL / Firestore / Documental en tiempo real.
   * Agrupaciones métricas de dotación y rendimiento departamental.
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
   * Consume de forma asíncrona la fuente relacional (SQL REST API).
   * Simula latencia de red, serialización JSON y control de excepciones.
   * @returns Observable con la colección completa de registros de usuarios.
   */
  public getUsersFromRelationalDb(): Observable<UserRecord[]> {
    // Clonamos profundamente para asegurar inmutabilidad
    const clonedData = JSON.parse(JSON.stringify(this.mockSqlUsers)) as UserRecord[];
    
    // Retardo asíncrono realista (800ms) simulando conexión a base de datos remota
    return of(clonedData).pipe(
      delay(800),
      catchError(error => {
        console.error('Error al consumir API Relacional (SQL):', error);
        return throwError(() => new Error('Error al conectar con la fuente de datos relacional.'));
      })
    );
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
   * Actualiza el estado de un usuario simulando una transacción SQL PATCH / PUT.
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
    return of({ ...target }).pipe(delay(300));
  }

  /**
   * Retorna la configuración de cliente Supabase preparada para integración directa.
   */
  public getSupabaseConfiguration(): SupabaseConfig {
    return { ...this.supabaseConfig };
  }
}
