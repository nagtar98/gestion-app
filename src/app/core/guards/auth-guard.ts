import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * @fileoverview Guardián de seguridad para protección de rutas basado en roles de acceso.
 * Valida la existencia de una sesión autenticada válida (Administrador o Usuario Estándar).
 * Redirige de forma reactiva al /login si el acceso es denegado.
 * @module Core/Guards/AuthGuard
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Determina si el usuario tiene autorización para acceder a la ruta solicitada.
   * @returns true si el usuario posee un rol permitido, o un UrlTree hacia /login.
   */
  canActivate(): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    // 1. Verificación mediante el servicio centralizado de autenticación
    if (this.authService.isAuthenticated()) {
      return true;
    }

    // 2. Comprobación de respaldo contra almacenamiento local
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'Administrador' || userRole === 'Usuario Estandar') {
      return true;
    }

    // 3. Denegación de acceso y redirección segura hacia el login
    return this.router.parseUrl('/login');
  }
}