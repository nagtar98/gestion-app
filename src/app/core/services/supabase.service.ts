import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { UserRecord, UserRole } from '../models/user.model';

/**
 * @fileoverview Servicio de integración directa con backend Supabase (BaaS en la nube).
 * Gestiona el cliente SDK oficial, consultas a tablas SQL y mapeo de datos con soporte para imágenes.
 * @module Core/Services/SupabaseService
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** Instancia oficial del cliente de Supabase */
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.initClient();
  }

  /**
   * Inicializa la conexión con el cliente Supabase según las variables de entorno.
   */
  private initClient(): void {
    const url = environment.supabase?.url;
    const key = environment.supabase?.anonKey;

    if (url && key && !url.includes('xyzcompany.supabase.co')) {
      try {
        this.supabase = createClient(url, key);
      } catch (err) {
        console.warn('No se pudo inicializar el cliente de Supabase:', err);
        this.supabase = null;
      }
    }
  }

  /**
   * Determina si la integración con Supabase está activa y configurada con credenciales válidas.
   * @returns true si el cliente está conectado a un proyecto real en la nube.
   */
  public isConfigured(): boolean {
    const url = environment.supabase?.url;
    return Boolean(this.supabase && url && !url.includes('xyzcompany.supabase.co'));
  }

  /**
   * Retorna la referencia al cliente nativo de Supabase para consultas avanzadas o buckets.
   */
  public getClient(): SupabaseClient | null {
    return this.supabase;
  }

  /**
   * Consulta la tabla 'usuarios' de Supabase y mapea las columnas relacionales.
   * Admite nombres en formato snake_case (avatar_url, fecha_alta) transformándolos al modelo de la app.
   * @returns Promesa con el listado de usuarios recuperados de la nube.
   */
  public async getUsers(): Promise<UserRecord[]> {
    if (!this.supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const { data, error } = await this.supabase
      .from('usuarios')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []).map((row: any) => ({
      id: Number(row.id),
      nombre: String(row.nombre || ''),
      email: String(row.email || ''),
      rol: (row.rol || 'Usuario Estandar') as UserRole,
      departamento: String(row.departamento || 'General'),
      estado: (row.estado || 'Activo') as 'Activo' | 'Inactivo',
      avatar: row.avatar_url || row.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nombre || 'U')}&background=0D8ABC&color=fff`,
      fechaAlta: row.fecha_alta || row.fechaAlta || new Date().toISOString().split('T')[0]
    }));
  }

  /**
   * Actualiza el estado de un usuario en la tabla 'usuarios' de Supabase.
   * @param id Identificador numérico del usuario.
   * @param estado 'Activo' | 'Inactivo'.
   */
  public async updateUserStatus(id: number, estado: 'Activo' | 'Inactivo'): Promise<boolean> {
    if (!this.supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const { error } = await this.supabase
      .from('usuarios')
      .update({ estado: estado })
      .eq('id', id);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Comprueba de forma asíncrona si un correo electrónico ya está registrado en la tabla 'usuarios' de Supabase.
   * @param email Correo electrónico a verificar.
   */
  public async checkEmailExists(email: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id')
      .ilike('email', email.trim().toLowerCase())
      .limit(1);

    if (error) {
      console.warn('Error al verificar email en Supabase:', error);
      return false;
    }

    return (data && data.length > 0);
  }
}
