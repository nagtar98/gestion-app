import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { UserRecord, UserRole } from '../models/user.model';

/**
 * @fileoverview Servicio de integración directa con backend Supabase (BaaS en la nube).
 * Gestiona el cliente SDK oficial, consultas a tablas SQL, gestión de Storage Buckets y fotos de perfil.
 * @module Core/Services/SupabaseService
 */
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  /** Nombre del bucket de almacenamiento para imágenes de avatar */
  public readonly BUCKET_NAME = 'avatars';

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
      avatar: row.avatar_url || row.avatar || this.getAvatarFallback(row.nombre),
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

  /**
   * Da de alta un nuevo usuario en la tabla 'usuarios' de Supabase (FASE 1 / Paso 1.2).
   * @param user Datos del nuevo usuario a registrar.
   * @returns Promesa con el registro insertado incluyendo su nuevo ID autonumérico.
   */
  public async createUser(user: Omit<UserRecord, 'id'>): Promise<UserRecord> {
    if (!this.supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const avatarUrl = user.avatar || this.getAvatarFallback(user.nombre);

    const { data, error } = await this.supabase
      .from('usuarios')
      .insert([
        {
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          departamento: user.departamento,
          estado: user.estado,
          avatar_url: avatarUrl,
          fecha_alta: user.fechaAlta || new Date().toISOString().split('T')[0]
        }
      ])
      .select();

    if (error) {
      throw error;
    }

    const inserted = data[0];
    return {
      id: Number(inserted.id),
      nombre: String(inserted.nombre),
      email: String(inserted.email),
      rol: inserted.rol as UserRole,
      departamento: String(inserted.departamento),
      estado: inserted.estado as 'Activo' | 'Inactivo',
      avatar: inserted.avatar_url,
      fechaAlta: inserted.fecha_alta
    };
  }

  /**
   * Sube un archivo de imagen al bucket 'avatars' de Supabase Storage y retorna su URL pública.
   * @param file Archivo File obtenido del input de formulario.
   * @returns Promesa con la URL pública accesible del archivo en Supabase.
   */
  public async uploadAvatar(file: File): Promise<string> {
    if (!this.supabase) {
      throw new Error('Supabase no está configurado.');
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `avatars_${Date.now()}_${cleanName}`;

    const { error: uploadError } = await this.supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/png'
      });

    if (uploadError) {
      console.warn('Advertencia al subir al bucket de Supabase:', uploadError.message);
      throw uploadError;
    }

    const { data } = this.supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Genera una URL pública de Supabase Storage para un archivo dado.
   * @param fileName Nombre del fichero en el bucket avatars.
   */
  public getBucketImageUrl(fileName: string): string {
    const url = environment.supabase?.url || '';
    return `${url}/storage/v1/object/public/${this.BUCKET_NAME}/${fileName}`;
  }

  /**
   * Retorna un avatar gráfico de respaldo basado en iniciales.
   * @param name Nombre del usuario.
   */
  public getAvatarFallback(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=2563eb&color=fff&size=128`;
  }
}
