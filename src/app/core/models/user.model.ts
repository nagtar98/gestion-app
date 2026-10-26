/**
 * @fileoverview Modelos de datos para usuarios, autenticación y métricas del sistema.
 * Define las entidades y contratos de datos utilizados en la aplicación de gestión.
 * @module Core/Models
 */

/**
 * Roles autorizados en el sistema según especificación de control de acceso.
 */
export type UserRole = 'Administrador' | 'Usuario Estandar';

/**
 * Representa una entidad de usuario registrada en la base de datos relacional (SQL).
 */
export interface UserRecord {
  /** Identificador único autonumérico del usuario */
  id: number;
  /** Nombre completo del usuario */
  nombre: string;
  /** Correo electrónico corporativo único */
  email: string;
  /** Rol del usuario dentro del sistema */
  rol: UserRole;
  /** Departamento o área a la que pertenece */
  departamento: string;
  /** Estado operativo de la cuenta */
  estado: 'Activo' | 'Inactivo';
  /** URL de la fotografía o avatar del usuario almacenada en Supabase o CDN */
  avatar?: string;
  /** Fecha de registro o alta en el sistema (formato ISO/cadena legible) */
  fechaAlta: string;
}

/**
 * Representa la sesión del usuario autenticado en el sistema.
 */
export interface AuthUser {
  /** Correo electrónico autenticado */
  email: string;
  /** Nombre visible del usuario */
  nombre: string;
  /** Rol asignado */
  rol: UserRole;
  /** Token de autorización simulado (JWT / Bearer Token) */
  token: string;
}

/**
 * Estructura de métricas analíticas provenientes de la fuente NoSQL/Documental en tiempo real.
 */
export interface DepartmentMetric {
  /** Nombre del departamento o división */
  departamento: string;
  /** Cantidad de integrantes o recursos asignados */
  cantidad: number;
}

/**
 * Resumen consolidado de indicadores clave de rendimiento (KPIs).
 */
export interface MetricSummary {
  /** Total de usuarios registrados */
  totalUsuarios: number;
  /** Cantidad de usuarios con estado activo */
  usuariosActivos: number;
  /** Total de departamentos representados */
  totalDepartamentos: number;
  /** Porcentaje de actividad de la plantilla */
  tasaActividad: number;
}

/**
 * Carga combinada de datos orquestada de forma asíncrona (SQL + NoSQL).
 */
export interface DashboardDataPayload {
  /** Lista de usuarios recuperada de la fuente relacional */
  users: UserRecord[];
  /** Métricas departamentales recuperadas del servicio en tiempo real / NoSQL */
  departmentMetrics: DepartmentMetric[];
  /** KPIs consolidados del sistema */
  summary: MetricSummary;
}
