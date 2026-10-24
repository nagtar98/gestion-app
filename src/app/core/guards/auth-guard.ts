import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // Simulamos la recuperación del rol del sistema de autenticación[cite: 1]
    const userRole = localStorage.getItem('userRole');
    
    // Verificamos los roles definidos: Administrador y Usuario Estándar[cite: 1]
    if (userRole === 'Administrador' || userRole === 'Usuario Estandar') {
      return true;
    }
    
    this.router.navigate(['/login']);
    return false;
  }
}