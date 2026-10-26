import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { AuthUser, UserRole } from '../models/user.model';

/**
 * @fileoverview Servicio central de autenticación y gestión de estado de sesión.
 * Implementa el patrón Singleton con persistencia en localStorage y emisión de estado reactivo.
 * @module Core/Services/AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Clave de persistencia para el rol de usuario en localStorage */
  private readonly ROLE_STORAGE_KEY = 'userRole';
  /** Clave de persistencia para el token de sesión en localStorage */
  private readonly TOKEN_STORAGE_KEY = 'authToken';
  /** Clave de persistencia para los datos del usuario en localStorage */
  private readonly USER_STORAGE_KEY = 'authUserData';

  /**
   * Catálogo simulado de usuarios registrados en el sistema para autenticación.
   * Contiene credenciales de prueba para Administrador y Usuario Estándar.
   */
  private readonly mockRegisteredUsers: Array<{
    email: string;
    nombre: string;
    rol: UserRole;
    pass: string;
  }> = [
    {
      email: 'admin@empresa.com',
      nombre: 'Administradora Gómez',
      rol: 'Administrador',
      pass: 'admin123'
    },
    {
      email: 'usuario@empresa.com',
      nombre: 'Carlos Martínez',
      rol: 'Usuario Estandar',
      pass: 'user123'
    },
    {
      email: 'ana@empresa.com',
      nombre: 'Ana García',
      rol: 'Administrador',
      pass: 'admin123'
    },
    {
      email: 'luis@empresa.com',
      nombre: 'Luis Pérez',
      rol: 'Usuario Estandar',
      pass: 'user123'
    }
  ];

  /** Sujeto de comportamiento para el estado de autenticación reactivo */
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getInitialStoredUser());

  /** Observable público que emite el estado del usuario autenticado */
  public currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor() {}

  /**
   * Obtiene la sesión previamente guardada en el almacenamiento local.
   * @returns Datos del usuario autenticado o null si no existe sesión válida.
   */
  private getInitialStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.USER_STORAGE_KEY);
      const role = localStorage.getItem(this.ROLE_STORAGE_KEY) as UserRole | null;
      if (stored && role) {
        return JSON.parse(stored);
      }
      if (role) {
        return {
          email: role === 'Administrador' ? 'admin@empresa.com' : 'usuario@empresa.com',
          nombre: role === 'Administrador' ? 'Administrador General' : 'Usuario Operativo',
          rol: role,
          token: localStorage.getItem(this.TOKEN_STORAGE_KEY) || 'simulated-token-xyz'
        };
      }
    } catch {
      // Ignorar error de parsing en inicialización
    }
    return null;
  }

  /**
   * Validador asíncrono simulado contra base de datos.
   * Comprueba si una dirección de correo electrónico ya existe registrada en el sistema.
   * @param email Correo electrónico a verificar.
   * @returns Observable que emite true si el correo existe, false en caso contrario.
   */
  public checkEmailExists(email: string): Observable<boolean> {
    const normalized = (email || '').trim().toLowerCase();
    const exists = this.mockRegisteredUsers.some(u => u.email.toLowerCase() === normalized);
    
    // Retardo asíncrono realista de 600 ms para simular llamada de red/BD
    return of(exists).pipe(delay(600));
  }

  /**
   * Ejecuta el inicio de sesión del usuario validando credenciales de forma asíncrona.
   * @param email Dirección de correo electrónico.
   * @param password Contraseña de acceso.
   * @returns Observable con el usuario autenticado o error si las credenciales fallan.
   */
  public login(email: string, password: string): Observable<AuthUser> {
    const normalized = (email || '').trim().toLowerCase();
    const userFound = this.mockRegisteredUsers.find(
      u => u.email.toLowerCase() === normalized && u.pass === password
    );

    return of(userFound).pipe(
      delay(700),
      map(user => {
        if (!user) {
          throw new Error('Credenciales inválidas. Verifique el usuario y la contraseña.');
        }

        const authData: AuthUser = {
          email: user.email,
          nombre: user.nombre,
          rol: user.rol,
          token: `jwt-simulated-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
        };

        // Persistencia segura en localStorage
        localStorage.setItem(this.ROLE_STORAGE_KEY, authData.rol);
        localStorage.setItem(this.TOKEN_STORAGE_KEY, authData.token);
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(authData));

        // Actualización de estado predecible
        this.currentUserSubject.next(authData);

        return authData;
      })
    );
  }

  /**
   * Cierra la sesión activa del usuario y limpia los datos en memoria y almacenamiento local.
   */
  public logout(): void {
    localStorage.removeItem(this.ROLE_STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.USER_STORAGE_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Comprueba si el usuario tiene una sesión activa y válida.
   * @returns true si está autenticado, false en caso contrario.
   */
  public isAuthenticated(): boolean {
    const role = localStorage.getItem(this.ROLE_STORAGE_KEY);
    return role === 'Administrador' || role === 'Usuario Estandar';
  }

  /**
   * Comprueba si el usuario autenticado posee rol de Administrador.
   * @returns true si el usuario activo es Administrador.
   */
  public isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    if (user) {
      return user.rol === 'Administrador';
    }
    return localStorage.getItem(this.ROLE_STORAGE_KEY) === 'Administrador';
  }

  /**
   * Retorna el rol del usuario actualmente autenticado.
   * @returns 'Administrador' | 'Usuario Estandar' | null
   */
  public getCurrentUserRole(): UserRole | null {
    const user = this.currentUserSubject.value;
    if (user) {
      return user.rol;
    }
    return (localStorage.getItem(this.ROLE_STORAGE_KEY) as UserRole) || null;
  }

  /**
   * Obtiene la instantánea actual del usuario autenticado.
   */
  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }
}
