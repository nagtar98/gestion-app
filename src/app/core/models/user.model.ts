export type UserRole = 'Administrador' | 'Usuario Estandar';

export interface UserRecord {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  departamento: string;
  estado: 'Activo' | 'Inactivo';
  avatar?: string;
  fechaAlta: string;
}

export interface AuthUser {
  email: string;
  nombre: string;
  rol: UserRole;
  token: string;
}

export interface DepartmentMetric {
  departamento: string;
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
